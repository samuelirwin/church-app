import { Head } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MembershipGrowthChart } from '@/components/admin/charts/membership-growth-chart';
import { EventAttendanceChart } from '@/components/admin/charts/event-attendance-chart';
import { MinistryDistributionChart } from '@/components/admin/charts/ministry-distribution-chart';
import { CourseCompletionChart } from '@/components/admin/charts/course-completion-chart';
import { VisitorFunnelChart } from '@/components/admin/charts/visitor-funnel-chart';
import { BenevolenceOverviewChart } from '@/components/admin/charts/benevolence-overview-chart';
import type { BreadcrumbItem } from '@/types';

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

export default function AnalyticsIndex() {
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [membershipData, setMembershipData] = useState([]);
    const [eventData, setEventData] = useState([]);
    const [ministryData, setMinistryData] = useState([]);
    const [courseData, setCourseData] = useState([]);
    const [visitorData, setVisitorData] = useState([]);
    const [benevolenceData, setBenevolenceData] = useState([]);

    const fetchData = useCallback(() => {
        const params = new URLSearchParams({ start_date: startDate, end_date: endDate });

        fetch(`/admin/analytics/membership-growth?${params}`).then(r => r.json()).then(j => setMembershipData(j.data));
        fetch(`/admin/analytics/event-attendance?${params}`).then(r => r.json()).then(j => setEventData(j.data));
        fetch('/admin/analytics/ministry-distribution').then(r => r.json()).then(j => setMinistryData(j.data));
        fetch(`/admin/analytics/course-metrics?${params}`).then(r => r.json()).then(j => setCourseData(j.data));
        fetch(`/admin/analytics/visitor-funnel?${params}`).then(r => r.json()).then(j => setVisitorData(j.data));
        fetch(`/admin/analytics/benevolence-overview?${params}`).then(r => r.json()).then(j => setBenevolenceData(j.data));
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                            <Label htmlFor="start_date" className="text-xs">From</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="end_date" className="text-xs">To</Label>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Membership Growth</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MembershipGrowthChart data={membershipData} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Event Attendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EventAttendanceChart data={eventData} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Ministry Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MinistryDistributionChart data={ministryData} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Course Enrollment vs Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CourseCompletionChart data={courseData} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Visitor Funnel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <VisitorFunnelChart data={visitorData} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Benevolence Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BenevolenceOverviewChart data={benevolenceData} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
