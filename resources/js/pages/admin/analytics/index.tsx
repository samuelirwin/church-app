import { Head } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
    BenevolenceOverviewChart,
    benevolenceLegend,
    benevolenceTable,
} from '@/components/admin/charts/benevolence-overview-chart';
import {
    ChartCard,
    type ChartTable,
} from '@/components/admin/charts/chart-card';
import {
    CourseCompletionChart,
    courseCompletionLegend,
    courseCompletionTable,
} from '@/components/admin/charts/course-completion-chart';
import {
    EventAttendanceChart,
    eventAttendanceLegend,
    eventAttendanceTable,
} from '@/components/admin/charts/event-attendance-chart';
import {
    MembershipGrowthChart,
    membershipGrowthTable,
} from '@/components/admin/charts/membership-growth-chart';
import {
    MinistryDistributionChart,
    ministryDistributionTable,
} from '@/components/admin/charts/ministry-distribution-chart';
import {
    ServiceAttendanceChart,
    serviceAttendanceLegend,
    serviceAttendanceTable,
} from '@/components/admin/charts/service-attendance-chart';
import {
    VisitorFunnelChart,
    visitorFunnelTable,
} from '@/components/admin/charts/visitor-funnel-chart';
import { SegmentedControl } from '@/components/shared/segmented-control';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChartData } from '@/hooks/use-chart-data';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

/** The data type a chart's table helper accepts (same shape the chart renders). */
type DataOf<F extends (data: never) => ChartTable> = Parameters<F>[0];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin/analytics' },
    { title: 'Analytics', href: '/admin/analytics' },
];

type Preset = '30' | '90' | '180' | '365' | 'custom';

const PRESETS: Array<{ value: Preset; label: string }> = [
    { value: '30', label: '30 days' },
    { value: '90', label: '3 months' },
    { value: '180', label: '6 months' },
    { value: '365', label: '12 months' },
    { value: 'custom', label: 'Custom' },
];

const isoDate = (date: Date) => date.toISOString().split('T')[0];

const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    return isoDate(d);
};

/**
 * Wires one chart to its endpoint and card: skeleton on first load, faded
 * previous chart while a new range loads, and a table view of the same data.
 */
function AnalyticsChart<T>({
    title,
    description,
    url,
    query,
    enabled = true,
    legend,
    toTable,
    render,
    className,
}: {
    title: string;
    description?: string;
    url: string;
    query: string;
    enabled?: boolean;
    legend?: ReactNode;
    toTable: (data: T) => ChartTable;
    render: (data: T) => ReactNode;
    className?: string;
}) {
    const { data, refreshing } = useChartData<T>(url, query, enabled);

    if (!enabled) {
        return null;
    }

    return (
        <ChartCard
            title={title}
            description={description}
            loading={data === null}
            refreshing={refreshing}
            legend={hasRows(data) ? legend : undefined}
            table={data ? toTable(data) : undefined}
            className={className}
        >
            {data !== null && render(data)}
        </ChartCard>
    );
}

/** Legends only make sense when there's something plotted. */
const hasRows = (data: unknown) => Array.isArray(data) && data.length > 0;

export default function AnalyticsIndex({
    isStaffOrAbove,
}: {
    isStaffOrAbove: boolean;
}) {
    const [preset, setPreset] = useState<Preset>('180');
    const [startDate, setStartDate] = useState(() => daysAgo(180));
    const [endDate, setEndDate] = useState(() => isoDate(new Date()));

    const choosePreset = (value: Preset) => {
        setPreset(value);
        if (value !== 'custom') {
            setStartDate(daysAgo(Number(value)));
            setEndDate(isoDate(new Date()));
        }
    };

    const query = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
    }).toString();
    const rangeLabel = `${new Date(`${startDate}T00:00:00`).toLocaleDateString()} – ${new Date(`${endDate}T00:00:00`).toLocaleDateString()}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <BarChart3 className="size-6" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {rangeLabel}
                        </p>
                    </div>
                </div>

                {/* One filter row above everything it affects. */}
                <div className="flex flex-wrap items-end gap-4">
                    <SegmentedControl
                        label="Date range"
                        options={PRESETS}
                        value={preset}
                        onChange={choosePreset}
                    />
                    {preset === 'custom' && (
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="start_date" className="text-xs">
                                    From
                                </Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={startDate}
                                    max={endDate}
                                    onChange={(e) =>
                                        e.target.value &&
                                        setStartDate(e.target.value)
                                    }
                                    className="w-40"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="end_date" className="text-xs">
                                    To
                                </Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    onChange={(e) =>
                                        e.target.value &&
                                        setEndDate(e.target.value)
                                    }
                                    className="w-40"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <AnalyticsChart<DataOf<typeof serviceAttendanceTable>>
                        title="Service attendance"
                        description="Members and guests per service date"
                        url="/admin/analytics/service-attendance"
                        query={query}
                        enabled={isStaffOrAbove}
                        legend={serviceAttendanceLegend}
                        toTable={serviceAttendanceTable}
                        render={(data) => (
                            <ServiceAttendanceChart data={data} />
                        )}
                        className="lg:col-span-2"
                    />

                    <AnalyticsChart<DataOf<typeof membershipGrowthTable>>
                        title="New members"
                        description="Members joining each month"
                        url="/admin/analytics/membership-growth"
                        query={query}
                        enabled={isStaffOrAbove}
                        toTable={membershipGrowthTable}
                        render={(data) => <MembershipGrowthChart data={data} />}
                    />

                    <AnalyticsChart<DataOf<typeof visitorFunnelTable>>
                        title="Visitor journey"
                        description="From first visit to becoming a member"
                        url="/admin/analytics/visitor-funnel"
                        query={query}
                        enabled={isStaffOrAbove}
                        toTable={visitorFunnelTable}
                        render={(data) => <VisitorFunnelChart data={data} />}
                    />

                    <AnalyticsChart<DataOf<typeof eventAttendanceTable>>
                        title="Event registrations"
                        description="Registrations against capacity"
                        url="/admin/analytics/event-attendance"
                        query={query}
                        legend={eventAttendanceLegend}
                        toTable={eventAttendanceTable}
                        render={(data) => <EventAttendanceChart data={data} />}
                    />

                    <AnalyticsChart<DataOf<typeof ministryDistributionTable>>
                        title="Ministry size"
                        description="Members in each ministry (current)"
                        url="/admin/analytics/ministry-distribution"
                        query=""
                        toTable={ministryDistributionTable}
                        render={(data) => (
                            <MinistryDistributionChart data={data} />
                        )}
                    />

                    <AnalyticsChart<DataOf<typeof courseCompletionTable>>
                        title="Course enrollment vs completion"
                        url="/admin/analytics/course-metrics"
                        query={query}
                        enabled={isStaffOrAbove}
                        legend={courseCompletionLegend}
                        toTable={courseCompletionTable}
                        render={(data) => <CourseCompletionChart data={data} />}
                    />

                    <AnalyticsChart<DataOf<typeof benevolenceTable>>
                        title="Benevolence"
                        description="Amount requested and approved by status"
                        url="/admin/analytics/benevolence-overview"
                        query={query}
                        enabled={isStaffOrAbove}
                        legend={benevolenceLegend}
                        toTable={benevolenceTable}
                        render={(data) => (
                            <BenevolenceOverviewChart data={data} />
                        )}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
