import { Head, Link } from '@inertiajs/react';
import { BookOpen, CalendarDays, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type ActivePlan = {
    id: number;
    plan_title: string;
    plan_slug: string;
    days_completed: number;
    total_days: number;
    percentage: number;
    started_at: string;
};

type CompletedPlan = {
    id: number;
    plan_title: string;
    plan_slug: string;
    total_days: number;
    completed_at: string;
};

type Props = {
    active: ActivePlan[];
    completed: CompletedPlan[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Reading Plans', href: '/my-reading-plans' },
];

export default function MyReadingPlans({ active, completed }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Reading Plans" />

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">My Reading Plans</h1>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reading-plans">Browse All</Link>
                    </Button>
                </div>

                {/* Active Plans */}
                <div>
                    <h2 className="mb-3 text-lg font-semibold">In Progress</h2>
                    {active.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="mb-4 text-muted-foreground">No reading plans in progress.</p>
                                <Button asChild>
                                    <Link href="/reading-plans">Explore Reading Plans</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {active.map((plan) => (
                                <Link
                                    key={plan.id}
                                    href={`/reading-plans/${plan.plan_slug}`}
                                    className="block"
                                >
                                    <Card className="transition-colors hover:bg-muted/50">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <p className="truncate font-medium">{plan.plan_title}</p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <BookOpen className="size-3.5" />
                                                            {plan.days_completed} of {plan.total_days} days
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarDays className="size-3.5" />
                                                            Started {new Date(plan.started_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4 shrink-0 text-right">
                                                    <span className="text-lg font-semibold">{plan.percentage}%</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{ width: `${plan.percentage}%` }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Plans */}
                {completed.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-lg font-semibold">Completed</h2>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Completed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {completed.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/reading-plans/${plan.plan_slug}`}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="size-4 text-green-500" />
                                                        {plan.plan_title}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {plan.total_days} days
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(plan.completed_at).toLocaleDateString()}
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
