import { Head, Link } from '@inertiajs/react';
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
import type { ReactNode } from 'react';
import { StatCard } from '@/components/admin/stat-card';
import AppLayout from '@/layouts/app-layout';
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

export default function AdminDashboard({ stats }: { stats: Stats }) {
    const warn = (value: number) => (value > 0 ? 'destructive' : 'default');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-4 lg:p-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Admin Dashboard
                </h1>

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
