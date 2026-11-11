import { Head, Link, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import {
    CategoryBarChart,
    categoryTable,
    type CategoryPoint,
} from '@/components/admin/charts/category-bar-chart';
import { ChartCard } from '@/components/admin/charts/chart-card';
import {
    TrendAreaChart,
    trendTable,
    type TrendPoint,
} from '@/components/admin/charts/trend-area-chart';
import {
    AttentionList,
    type AttentionItem,
} from '@/components/admin/dashboard/attention-list';
import {
    UpcomingTableCard,
    type UpcomingColumn,
} from '@/components/admin/dashboard/upcoming-table-card';
import { StatTile, type Metric } from '@/components/admin/stat-tile';
import { SegmentedControl } from '@/components/shared/segmented-control';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as eventsIndex } from '@/routes/admin/events';
import { roster } from '@/routes/admin/volunteer';
import type { BreadcrumbItem } from '@/types';

type Membership = {
    statuses: CategoryPoint[];
    activeMembers: number;
    userAccounts: number;
};

type Duty = {
    id: number;
    date: string;
    service: string | null;
    role: string | null;
    volunteer: string | null;
    status: 'scheduled' | 'confirmed' | 'declined' | 'absent';
    statusLabel: string;
};

type UpcomingEvent = {
    id: number;
    title: string;
    startsAt: string;
    registrations: number;
    capacity: number | null;
    href: string;
};

type Upcoming<Row> = { total: number; rows: Row[] };

type Ministries = {
    rows: CategoryPoint[];
    totalMinistries: number;
    totalGroups: number;
};

/** Membership statuses outside the active congregation; drawn muted so the active ones stand out. */
const INACTIVE_STATUSES = new Set(['Inactive', 'Transferred', 'Deceased']);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin' },
];

function Section({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {title}
            </h2>
            <div
                className={cn(
                    'grid items-start gap-4 lg:grid-cols-2',
                    className,
                )}
            >
                {children}
            </div>
        </section>
    );
}

/** plural(3, 'event') -> "3 events"; pass the plural form when adding "s" is wrong. */
const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
    `${count.toLocaleString()} ${count === 1 ? singular : pluralForm}`;

/** "2026-11-15" -> "Sun, Nov 15" */
const formatDay = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

const DUTY_COLUMNS: UpcomingColumn<Duty>[] = [
    {
        header: 'Date',
        cell: (duty) => (
            <span className="whitespace-nowrap">
                {formatDay(duty.date)}
                {duty.service && (
                    <span className="block text-xs text-muted-foreground">
                        {duty.service}
                    </span>
                )}
            </span>
        ),
    },
    { header: 'Role', cell: (duty) => duty.role ?? '-', hideOnMobile: true },
    { header: 'Volunteer', cell: (duty) => duty.volunteer ?? 'Unassigned' },
    {
        header: 'Status',
        align: 'right',
        cell: (duty) => <DutyStatus duty={duty} />,
    },
];

const EVENT_COLUMNS: UpcomingColumn<UpcomingEvent>[] = [
    {
        header: 'Event',
        cell: (event) => (
            <Link href={event.href} className="font-medium hover:underline">
                {event.title}
                <span className="block text-xs font-normal text-muted-foreground">
                    {formatDateTime(event.startsAt)}
                </span>
            </Link>
        ),
    },
    {
        header: 'Registered',
        align: 'right',
        cell: (event) => <EventFill event={event} />,
    },
];

/** Status pill: colour plus the word itself, so it never relies on colour alone. */
function DutyStatus({ duty }: { duty: Duty }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
                duty.status === 'confirmed' &&
                    'bg-[color-mix(in_oklab,var(--viz-good)_12%,transparent)] text-[var(--viz-good)]',
                (duty.status === 'declined' || duty.status === 'absent') &&
                    'bg-[color-mix(in_oklab,var(--viz-critical)_12%,transparent)] text-[var(--viz-critical)]',
                duty.status === 'scheduled' && 'bg-muted text-foreground',
            )}
        >
            {duty.statusLabel}
        </span>
    );
}

/** Registrations with a small fill bar against capacity (just the count when there's no limit). */
function EventFill({ event }: { event: UpcomingEvent }) {
    if (!event.capacity) {
        return <span>{event.registrations.toLocaleString()}</span>;
    }

    const percent = Math.min(
        100,
        Math.round((event.registrations / event.capacity) * 100),
    );

    return (
        <span className="inline-flex flex-col items-end gap-1">
            <span className="whitespace-nowrap">
                {event.registrations.toLocaleString()}
                <span className="text-muted-foreground">
                    {' '}
                    / {event.capacity.toLocaleString()}
                </span>
            </span>
            <span
                className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--viz-muted-mark)]"
                role="img"
                aria-label={`${percent}% full`}
            >
                <span
                    className="block h-full rounded-full"
                    style={{
                        width: `${percent}%`,
                        backgroundColor:
                            percent >= 100
                                ? 'var(--viz-critical)'
                                : 'var(--viz-1)',
                    }}
                />
            </span>
        </span>
    );
}

type Props = {
    attention: AttentionItem[];
    membership: Membership;
    visitorPipeline: CategoryPoint[];
    upcomingDuties: Upcoming<Duty>;
    upcomingEvents: Upcoming<UpcomingEvent>;
    ministries: Ministries;
    contentLibrary: CategoryPoint[];
    engagement: CategoryPoint[];
    metrics: Metric[];
    attendanceTrend: TrendPoint[];
    period: number;
    periods: Array<{ value: number; label: string }>;
};

export default function AdminDashboard({
    attention,
    membership,
    visitorPipeline,
    upcomingDuties,
    upcomingEvents,
    ministries,
    contentLibrary,
    engagement,
    metrics,
    attendanceTrend,
    period,
    periods,
}: Props) {
    const [refreshing, setRefreshing] = useState(false);

    // Only the period-dependent props reload; the "at a glance" counts stay as they are.
    const changePeriod = (days: number) => {
        router.get(
            '/admin',
            { period: days },
            {
                only: ['metrics', 'attendanceTrend', 'period'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setRefreshing(true),
                onFinish: () => setRefreshing(false),
            },
        );
    };

    const periodLabel =
        periods.find((p) => p.value === period)?.label.toLowerCase() ?? '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-4 lg:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Admin Dashboard
                    </h1>
                    <SegmentedControl
                        label="Time period"
                        options={periods}
                        value={period}
                        onChange={changePeriod}
                    />
                </div>

                <div
                    className={cn(
                        'grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4',
                        refreshing && 'opacity-50',
                    )}
                    aria-busy={refreshing}
                >
                    {metrics.map((metric) => (
                        <StatTile key={metric.key} metric={metric} />
                    ))}
                </div>

                <div className="grid items-start gap-4 lg:grid-cols-3">
                    <ChartCard
                        className="lg:col-span-2"
                        title="Weekly service attendance"
                        description={`Members and guests across all services, ${periodLabel}`}
                        refreshing={refreshing}
                        table={trendTable(attendanceTrend, 'Attendance')}
                    >
                        <TrendAreaChart
                            data={attendanceTrend}
                            name="Attendance"
                            emptyMessage="No attendance recorded in this period."
                        />
                    </ChartCard>
                    <AttentionList items={attention} />
                </div>

                <h2 className="-mb-4 text-lg font-semibold">At a glance</h2>

                <Section title="People">
                    <ChartCard
                        title="Members by status"
                        description={`${plural(membership.activeMembers, 'active member')} · ${plural(membership.userAccounts, 'user account')}`}
                        table={categoryTable(
                            membership.statuses,
                            'Status',
                            'Members',
                        )}
                    >
                        <CategoryBarChart
                            data={membership.statuses}
                            name="Members"
                            isMuted={(point) =>
                                INACTIVE_STATUSES.has(point.label)
                            }
                            emptyMessage="No members recorded yet."
                        />
                    </ChartCard>
                    <ChartCard
                        title="Visitor follow-up"
                        description={`${plural(
                            visitorPipeline.reduce(
                                (sum, point) => sum + point.value,
                                0,
                            ),
                            'visitor',
                        )} at each stage, in order`}
                        table={categoryTable(
                            visitorPipeline,
                            'Stage',
                            'Visitors',
                        )}
                    >
                        <CategoryBarChart
                            data={visitorPipeline}
                            name="Visitors"
                            emptyMessage="No visitors recorded yet."
                        />
                    </ChartCard>
                </Section>

                <Section title="Community">
                    <UpcomingTableCard
                        title="Upcoming events"
                        description={`${plural(upcomingEvents.total, 'event')} scheduled`}
                        rows={upcomingEvents.rows}
                        columns={EVENT_COLUMNS}
                        rowKey={(event) => event.id}
                        emptyMessage="No upcoming events."
                        viewAll={{
                            href: eventsIndex().url,
                            label: 'All events',
                        }}
                    />
                    <UpcomingTableCard
                        title="Upcoming volunteer duties"
                        description={`${plural(upcomingDuties.total, 'duty', 'duties')} on the roster`}
                        rows={upcomingDuties.rows}
                        columns={DUTY_COLUMNS}
                        rowKey={(duty) => duty.id}
                        emptyMessage="Nobody is rostered yet."
                        viewAll={{ href: roster().url, label: 'Open roster' }}
                    />
                    <ChartCard
                        className="lg:col-span-2"
                        title="Largest ministries"
                        description={`Members per ministry · ${plural(ministries.totalMinistries, 'ministry', 'ministries')} and ${plural(ministries.totalGroups, 'group')} in total`}
                        table={categoryTable(
                            ministries.rows,
                            'Ministry',
                            'Members',
                        )}
                    >
                        <CategoryBarChart
                            data={ministries.rows}
                            name="Members"
                            labelWidth={160}
                            emptyMessage="No ministry members yet."
                        />
                    </ChartCard>
                </Section>

                <Section title="Content & Growth">
                    <ChartCard
                        title="Content library"
                        description="Items set up in each area"
                        table={categoryTable(contentLibrary, 'Type', 'Items')}
                    >
                        <CategoryBarChart
                            data={contentLibrary}
                            name="Items"
                            emptyMessage="No content added yet."
                        />
                    </ChartCard>
                    <ChartCard
                        title="Engagement"
                        description="How people are using that content, all time"
                        table={categoryTable(engagement, 'Activity', 'Count')}
                    >
                        <CategoryBarChart
                            data={engagement}
                            name="Count"
                            labelWidth={170}
                            emptyMessage="No activity yet."
                        />
                    </ChartCard>
                </Section>
            </div>
        </AppLayout>
    );
}
