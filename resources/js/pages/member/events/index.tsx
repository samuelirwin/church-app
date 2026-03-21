import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type UpcomingEvent = {
    id: number;
    event_title: string;
    event_slug: string;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    registered_at: string;
};

type PastEvent = {
    id: number;
    event_title: string;
    event_slug: string;
    starts_at: string;
    location: string | null;
};

type Props = {
    upcoming: UpcomingEvent[];
    past: PastEvent[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Events', href: '/my-events' },
];

function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function MyEvents({ upcoming, past }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Events" />

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">My Events</h1>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/events">Browse All</Link>
                    </Button>
                </div>

                {/* Upcoming Events */}
                <div>
                    <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
                    {upcoming.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="mb-4 text-muted-foreground">No upcoming events registered.</p>
                                <Button asChild>
                                    <Link href="/events">Browse Events</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {upcoming.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.event_slug}`}
                                    className="block"
                                >
                                    <Card className="transition-colors hover:bg-muted/50">
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <p className="truncate font-medium">{event.event_title}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <CalendarDays className="size-3.5" />
                                                        {formatDateTime(event.starts_at)}
                                                    </span>
                                                    {event.location && (
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="size-3.5" />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="default" className="ml-4 shrink-0">Registered</Badge>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Events */}
                {past.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-lg font-semibold">Past Events</h2>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {past.map((event) => (
                                        <tr key={event.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/events/${event.event_slug}`}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    {event.event_title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(event.starts_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {event.location ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
