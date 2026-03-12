import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, LayoutGrid, List, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventCalendar } from '@/components/event-calendar';

type EventData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    is_full: boolean;
    available_spots: number | null;
    category: { id: number; name: string } | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    events: PaginatedData<EventData>;
    filters: { search?: string; category_id?: string };
    categories: Array<{ id: number; name: string }>;
};

function formatEventDate(startsAt: string, endsAt: string | null, isAllDay: boolean): string {
    const start = new Date(startsAt);
    if (isAllDay) return start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${dateStr} at ${timeStr}`;
}

function getStoredView(): 'list' | 'calendar' {
    if (typeof window === 'undefined') return 'list';
    return (localStorage.getItem('events_view') as 'list' | 'calendar') ?? 'list';
}

export default function EventsIndex({ events, filters, categories }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>(getStoredView);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/events', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/events', newFilters, { preserveState: true, replace: true });
    };

    const toggleView = (mode: 'list' | 'calendar') => {
        setViewMode(mode);
        localStorage.setItem('events_view', mode);
    };

    return (
        <PublicLayout title="Events">
            <Head title="Events" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Events</h1>
                    <p className="mt-2 text-muted-foreground">Discover upcoming events and gatherings at our church.</p>
                </div>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search events..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select onValueChange={(v) => handleFilter('category_id', v)} defaultValue={filters.category_id ?? 'all'}>
                            <SelectTrigger className="sm:w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-1 rounded-md border p-1">
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => toggleView('list')}
                        >
                            <List className="mr-1.5 size-4" />
                            List
                        </Button>
                        <Button
                            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => toggleView('calendar')}
                        >
                            <LayoutGrid className="mr-1.5 size-4" />
                            Calendar
                        </Button>
                    </div>
                </div>

                {viewMode === 'calendar' ? (
                    <EventCalendar categoryId={filters.category_id ? Number(filters.category_id) : null} />
                ) : events.data.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        No upcoming events found.
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {events.data.map((event) => (
                                <Link key={event.id} href={`/events/${event.slug}`}>
                                    <Card className="group h-full transition-shadow hover:shadow-md">
                                        <CardContent className="p-5">
                                            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                                                <CalendarDays className="size-4" />
                                                {formatEventDate(event.starts_at, event.ends_at, event.is_all_day)}
                                            </div>
                                            <h3 className="text-lg font-semibold group-hover:text-primary">{event.title}</h3>
                                            {event.description && (
                                                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                                            )}
                                            {event.location && (
                                                <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="size-3.5" />
                                                    {event.location}
                                                </div>
                                            )}
                                            <div className="mt-3 flex gap-2">
                                                {event.category && <Badge variant="outline" className="text-xs">{event.category.name}</Badge>}
                                                {event.is_full && <Badge variant="destructive" className="text-xs">Full</Badge>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>

                        {events.links.length > 3 && (
                            <div className="mt-8 flex justify-center gap-1">
                                {events.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </PublicLayout>
    );
}
