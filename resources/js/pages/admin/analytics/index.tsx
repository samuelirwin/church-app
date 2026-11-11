import { Head } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { BenevolenceOverviewChart } from '@/components/admin/charts/benevolence-overview-chart';
import { CourseCompletionChart } from '@/components/admin/charts/course-completion-chart';
import { EventAttendanceChart } from '@/components/admin/charts/event-attendance-chart';
import { MembershipGrowthChart } from '@/components/admin/charts/membership-growth-chart';
import { MinistryDistributionChart } from '@/components/admin/charts/ministry-distribution-chart';
import {
    ServiceAttendanceChart,
    type ServiceAttendancePoint,
} from '@/components/admin/charts/service-attendance-chart';
import { VisitorFunnelChart } from '@/components/admin/charts/visitor-funnel-chart';
import { ChartSkeleton } from '@/components/shared/skeletons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChartData } from '@/hooks/use-chart-data';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

/** The data prop type of a chart component. */
type ChartData<C extends (props: { data: never }) => unknown> =
    Parameters<C>[0]['data'];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administration', href: '/admin/analytics' },
    { title: 'Analytics', href: '/admin/analytics' },
];

function defaultStartDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
}

function defaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
}

type Props = {
    isStaffOrAbove: boolean;
};

export default function AnalyticsIndex({ isStaffOrAbove }: Props) {
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const query = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
    }).toString();

    const membershipData = useChartData<
        ChartData<typeof MembershipGrowthChart>
    >('/admin/analytics/membership-growth', query, isStaffOrAbove);
    const courseData = useChartData<ChartData<typeof CourseCompletionChart>>(
        '/admin/analytics/course-metrics',
        query,
        isStaffOrAbove,
    );
    const visitorData = useChartData<ChartData<typeof VisitorFunnelChart>>(
        '/admin/analytics/visitor-funnel',
        query,
        isStaffOrAbove,
    );
    const benevolenceData = useChartData<
        ChartData<typeof BenevolenceOverviewChart>
    >('/admin/analytics/benevolence-overview', query, isStaffOrAbove);
    const serviceAttendanceData = useChartData<ServiceAttendancePoint[]>(
        '/admin/analytics/service-attendance',
        query,
        isStaffOrAbove,
    );
    const eventData = useChartData<ChartData<typeof EventAttendanceChart>>(
        '/admin/analytics/event-attendance',
        query,
    );
    const ministryData = useChartData<
        ChartData<typeof MinistryDistributionChart>
    >('/admin/analytics/ministry-distribution', '');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="size-6" />
                        <h1 className="text-2xl font-bold">Analytics</h1>
                    </div>
                    <div className="flex gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="start_date" className="text-xs">
                                From
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
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
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {isStaffOrAbove && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Membership Growth
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {membershipData ? (
                                    <MembershipGrowthChart
                                        data={membershipData}
                                    />
                                ) : (
                                    <ChartSkeleton />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {isStaffOrAbove && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Service Attendance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {serviceAttendanceData ? (
                                    <ServiceAttendanceChart
                                        data={serviceAttendanceData}
                                    />
                                ) : (
                                    <ChartSkeleton />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Event Attendance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {eventData ? (
                                <EventAttendanceChart data={eventData} />
                            ) : (
                                <ChartSkeleton />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Ministry Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ministryData ? (
                                <MinistryDistributionChart
                                    data={ministryData}
                                />
                            ) : (
                                <ChartSkeleton />
                            )}
                        </CardContent>
                    </Card>

                    {isStaffOrAbove && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Course Enrollment vs Completion
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {courseData ? (
                                    <CourseCompletionChart data={courseData} />
                                ) : (
                                    <ChartSkeleton />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {isStaffOrAbove && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Visitor Funnel
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {visitorData ? (
                                    <VisitorFunnelChart data={visitorData} />
                                ) : (
                                    <ChartSkeleton />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {isStaffOrAbove && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Benevolence Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {benevolenceData ? (
                                    <BenevolenceOverviewChart
                                        data={benevolenceData}
                                    />
                                ) : (
                                    <ChartSkeleton />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
