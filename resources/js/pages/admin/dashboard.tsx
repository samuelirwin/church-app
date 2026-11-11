import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    Contact,
    FileText,
    GraduationCap,
    HeartHandshake,
    Library,
    Mic2,
    UserPlus,
    Users,
    UsersRound,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ChartCard } from '@/components/admin/charts/chart-card';
import {
    TrendAreaChart,
    trendTable,
    type TrendPoint,
} from '@/components/admin/charts/trend-area-chart';
import { StatCard } from '@/components/admin/stat-card';
import { StatTile, type Metric } from '@/components/admin/stat-tile';
import { SegmentedControl } from '@/components/shared/segmented-control';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type Stats = {
    myCareNeeds: number;
    overdueCareNeeds: number;
    activeMembers: number;
    totalUsers: number;
    totalSermons: number;
    totalCourses: number;
    totalReadingPlans: number;
    totalBooks: number;
    totalPosts: number;
    totalForms: number;
    totalFormResponses: number;
    activeLendings: number;
    overdueLendings: number;
    totalEnrollments: number;
    totalEvents: number;
    totalMinistries: number;
    totalGroups: number;
    upcomingSchedules: number;
    newVisitors: number;
    totalVisitors: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: '/admin' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {children}
            </div>
        </section>
    );
}

type Props = {
    stats: Stats;
    metrics: Metric[];
    attendanceTrend: TrendPoint[];
    period: number;
    periods: Array<{ value: number; label: string }>;
};

export default function AdminDashboard({
    stats,
    metrics,
    attendanceTrend,
    period,
    periods,
}: Props) {
    const warn = (value: number) => (value > 0 ? 'destructive' : 'default');
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

                <ChartCard
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

                <h2 className="-mb-4 text-lg font-semibold">At a glance</h2>

                <Section title="Needs attention">
                    <Link href="/admin/care-needs?assigned=me">
                        <StatCard
                            icon={HeartHandshake}
                            label="My Care Needs"
                            value={stats.myCareNeeds}
                        />
                    </Link>
                    <Link href="/admin/care-needs?overdue=1">
                        <StatCard
                            icon={AlertTriangle}
                            label="Overdue Care Needs"
                            value={stats.overdueCareNeeds}
                            variant={warn(stats.overdueCareNeeds)}
                        />
                    </Link>
                    <Link href="/admin/visitors?status=new">
                        <StatCard
                            icon={UserPlus}
                            label="New Visitors"
                            value={stats.newVisitors}
                            variant={warn(stats.newVisitors)}
                        />
                    </Link>
                    <StatCard
                        icon={AlertTriangle}
                        label="Overdue Lendings"
                        value={stats.overdueLendings}
                        variant={warn(stats.overdueLendings)}
                    />
                </Section>

                <Section title="People">
                    <StatCard
                        icon={Contact}
                        label="Active Members"
                        value={stats.activeMembers}
                    />
                    <StatCard
                        icon={Users}
                        label="User Accounts"
                        value={stats.totalUsers}
                    />
                    <StatCard
                        icon={UserPlus}
                        label="Total Visitors"
                        value={stats.totalVisitors}
                    />
                    <StatCard
                        icon={ClipboardCheck}
                        label="Upcoming Duties"
                        value={stats.upcomingSchedules}
                    />
                </Section>

                <Section title="Community">
                    <StatCard
                        icon={CalendarDays}
                        label="Events"
                        value={stats.totalEvents}
                    />
                    <StatCard
                        icon={UsersRound}
                        label="Ministries"
                        value={stats.totalMinistries}
                    />
                    <StatCard
                        icon={Users}
                        label="Groups"
                        value={stats.totalGroups}
                    />
                </Section>

                <Section title="Content & Growth">
                    <StatCard
                        icon={Mic2}
                        label="Sermons"
                        value={stats.totalSermons}
                    />
                    <StatCard
                        icon={FileText}
                        label="Posts"
                        value={stats.totalPosts}
                    />
                    <StatCard
                        icon={GraduationCap}
                        label="Courses"
                        value={stats.totalCourses}
                    />
                    <StatCard
                        icon={GraduationCap}
                        label="Course Enrollments"
                        value={stats.totalEnrollments}
                    />
                    <StatCard
                        icon={BookOpen}
                        label="Reading Plans"
                        value={stats.totalReadingPlans}
                    />
                    <StatCard
                        icon={Library}
                        label="Books"
                        value={stats.totalBooks}
                    />
                    <StatCard
                        icon={Library}
                        label="Active Lendings"
                        value={stats.activeLendings}
                    />
                    <StatCard
                        icon={ClipboardList}
                        label="Forms"
                        value={stats.totalForms}
                    />
                    <StatCard
                        icon={ClipboardList}
                        label="Form Responses"
                        value={stats.totalFormResponses}
                    />
                </Section>
            </div>
        </AppLayout>
    );
}
