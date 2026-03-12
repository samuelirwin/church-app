import { router } from '@inertiajs/react';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useCallback, useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    getDay,
    locales,
});

type CalendarEvent = {
    id: number;
    title: string;
    slug: string;
    start: Date;
    end: Date;
    allDay: boolean;
    category: { id: number; name: string } | null;
    location: string | null;
};

type ApiEvent = {
    id: number;
    title: string;
    slug: string;
    start: string;
    end: string;
    allDay: boolean;
    category: { id: number; name: string } | null;
    location: string | null;
};

type Props = {
    categoryId: number | null;
};

const CATEGORY_COLORS: Record<number, string> = {};
const COLOR_PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

function getCategoryColor(categoryId: number): string {
    if (!CATEGORY_COLORS[categoryId]) {
        const index = Object.keys(CATEGORY_COLORS).length % COLOR_PALETTE.length;
        CATEGORY_COLORS[categoryId] = COLOR_PALETTE[index];
    }
    return CATEGORY_COLORS[categoryId];
}

export function EventCalendar({ categoryId }: Props) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<View>('month');

    const fetchEvents = useCallback(async (date: Date) => {
        setLoading(true);

        const rangeStart = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const rangeEnd = new Date(date.getFullYear(), date.getMonth() + 2, 0);

        const params = new URLSearchParams({
            start: rangeStart.toISOString().split('T')[0],
            end: rangeEnd.toISOString().split('T')[0],
        });

        if (categoryId) {
            params.set('category_id', String(categoryId));
        }

        try {
            const response = await fetch(`/events/calendar-data?${params.toString()}`);
            const json = await response.json();

            const calendarEvents: CalendarEvent[] = (json.data as ApiEvent[]).map((event) => ({
                id: event.id,
                title: event.title,
                slug: event.slug,
                start: new Date(event.start),
                end: new Date(event.end),
                allDay: event.allDay,
                category: event.category,
                location: event.location,
            }));

            setEvents(calendarEvents);
        } catch {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchEvents(currentDate);
    }, [fetchEvents, currentDate]);

    const handleNavigate = (date: Date) => {
        setCurrentDate(date);
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        router.visit(`/events/${event.slug}`);
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        const backgroundColor = event.category
            ? getCategoryColor(event.category.id)
            : '#6b7280';

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                color: 'white',
                border: 'none',
                fontSize: '0.8rem',
                padding: '2px 6px',
            },
        };
    };

    return (
        <div className="rounded-lg border bg-card p-4">
            {loading && (
                <div className="mb-4 flex items-center justify-center py-2">
                    <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading events...</span>
                </div>
            )}
            <div style={{ height: 650 }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    date={currentDate}
                    view={currentView}
                    onNavigate={handleNavigate}
                    onView={(view) => setCurrentView(view)}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day']}
                    popup
                    tooltipAccessor={(event) =>
                        event.location ? `${event.title} - ${event.location}` : event.title
                    }
                />
            </div>
        </div>
    );
}
