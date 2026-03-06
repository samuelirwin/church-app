import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Download, ExternalLink, MapPin, Users } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { stripHtml } from '@/lib/utils';

type EventData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    body: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    recurrence: string;
    recurrence_label: string;
    max_attendees: number | null;
    is_full: boolean;
    available_spots: number | null;
    category: { id: number; name: string } | null;
    tags: string[] | null;
    form_id: number | null;
    registrations_count: number;
};

type Props = {
    event: { data: EventData };
    userRegistration: { id: number; status: string } | null;
};

function formatEventDate(startsAt: string, endsAt: string | null, isAllDay: boolean): string {
    const start = new Date(startsAt);
    if (isAllDay) return start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const dateStr = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    if (endsAt) {
        const end = new Date(endsAt);
        const endTimeStr = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        return `${dateStr}, ${timeStr} - ${endTimeStr}`;
    }
    return `${dateStr} at ${timeStr}`;
}

function buildGoogleCalendarUrl(event: EventData): string {
    const params = new URLSearchParams();
    params.set('action', 'TEMPLATE');
    params.set('text', event.title);

    if (event.is_all_day) {
        const date = new Date(event.starts_at);
        const start = date.toISOString().slice(0, 10).replace(/-/g, '');
        // Google Calendar all-day end date is exclusive
        const endDate = event.ends_at ? new Date(event.ends_at) : new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        const end = endDate.toISOString().slice(0, 10).replace(/-/g, '');
        params.set('dates', `${start}/${end}`);
    } else {
        const start = new Date(event.starts_at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const end = event.ends_at
            ? new Date(event.ends_at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
            : start;
        params.set('dates', `${start}/${end}`);
    }

    if (event.description) {
        params.set('details', stripHtml(event.description));
    }
    if (event.location) {
        params.set('location', event.location);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function EventShow({ event: { data: event }, userRegistration }: Props) {
    const { auth } = usePage().props;
    const isLoggedIn = !!auth.user;
    const isRegistered = userRegistration && userRegistration.status !== 'cancelled';

    const guestForm = useForm({ name: '', email: '', phone: '' });
    const memberForm = useForm({});
    const cancelForm = useForm({});

    const handleGuestRegister = (e: React.FormEvent) => {
        e.preventDefault();
        guestForm.post(`/events/${event.slug}/register`);
    };

    const handleMemberRegister = () => {
        memberForm.post(`/events/${event.id}/rsvp`);
    };

    const handleCancel = () => {
        cancelForm.post(`/events/${event.id}/rsvp/cancel`);
    };

    return (
        <PublicLayout title={event.title}>
            <Head title={event.title}>
                <meta name="description" content={event.description ? stripHtml(event.description).substring(0, 160) : ''} />
                <meta property="og:title" content={event.title} />
                <meta property="og:description" content={event.description ? stripHtml(event.description).substring(0, 160) : ''} />
                <meta property="og:type" content="article" />
            </Head>

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/events" className="hover:text-foreground">Events</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{event.title}</span>
                </nav>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <div className="mb-4 flex flex-wrap gap-2">
                            {event.category && <Badge variant="outline">{event.category.name}</Badge>}
                            {event.recurrence !== 'none' && <Badge variant="secondary">{event.recurrence_label}</Badge>}
                            {event.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                        </div>

                        <h1 className="text-3xl font-bold">{event.title}</h1>

                        <div className="mt-4 space-y-2 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="size-4" />
                                {formatEventDate(event.starts_at, event.ends_at, event.is_all_day)}
                            </div>
                            {event.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-4" />
                                    {event.location}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Users className="size-4" />
                                {event.registrations_count} registered
                                {event.max_attendees && ` / ${event.max_attendees} spots`}
                            </div>
                        </div>

                        {event.description && (
                            <div className="mt-6 prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: event.description }} />
                        )}

                        {event.body && (
                            <div className="mt-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: event.body }} />
                        )}
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Registration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {event.is_full ? (
                                    <p className="text-sm text-muted-foreground">This event is full.</p>
                                ) : isRegistered ? (
                                    <div className="space-y-3">
                                        <Badge variant="default">Registered</Badge>
                                        <p className="text-sm text-muted-foreground">You are registered for this event.</p>

                                        <div className="border-t pt-3">
                                            <p className="mb-2 text-sm font-medium">Save to Calendar</p>
                                            <div className="flex flex-col gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={`/events/${event.slug}/calendar.ics`} download>
                                                        <Download className="mr-1.5 size-3.5" />
                                                        Download .ics
                                                    </a>
                                                </Button>
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="mr-1.5 size-3.5" />
                                                        Google Calendar
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>

                                        <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelForm.processing}>
                                            Cancel Registration
                                        </Button>
                                    </div>
                                ) : isLoggedIn ? (
                                    <div className="space-y-3">
                                        {event.available_spots !== null && (
                                            <p className="text-sm text-muted-foreground">{event.available_spots} spots remaining</p>
                                        )}
                                        <Button onClick={handleMemberRegister} disabled={memberForm.processing} className="w-full">
                                            {memberForm.processing ? 'Registering...' : 'Register'}
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleGuestRegister} className="space-y-4">
                                        {event.available_spots !== null && (
                                            <p className="text-sm text-muted-foreground">{event.available_spots} spots remaining</p>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name *</Label>
                                            <Input id="name" value={guestForm.data.name} onChange={(e) => guestForm.setData('name', e.target.value)} />
                                            {guestForm.errors.name && <p className="text-sm text-red-500">{guestForm.errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input id="email" type="email" value={guestForm.data.email} onChange={(e) => guestForm.setData('email', e.target.value)} />
                                            {guestForm.errors.email && <p className="text-sm text-red-500">{guestForm.errors.email}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" value={guestForm.data.phone} onChange={(e) => guestForm.setData('phone', e.target.value)} />
                                        </div>
                                        <Button type="submit" disabled={guestForm.processing} className="w-full">
                                            {guestForm.processing ? 'Registering...' : 'Register'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
