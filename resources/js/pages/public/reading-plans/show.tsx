import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Check, Clock, Users } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DayData = {
    id: number;
    day_number: number;
    title: string;
    scripture_reference: string;
    reflection: string | null;
};

type PlanData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    cover_url: string | null;
    duration_days: number;
    enrollments_count: number;
    days: DayData[];
};

type EnrollmentData = {
    id: number;
    started_at: string;
    completed_at: string | null;
    completion_percentage: number;
} | null;

type Props = {
    plan: { data: PlanData };
    enrollment: EnrollmentData;
    completedDayIds: number[];
};

export default function ReadingPlanShow({ plan: { data: plan }, enrollment, completedDayIds }: Props) {
    const { auth } = usePage().props;
    const isLoggedIn = !!auth.user;

    const handleEnroll = () => {
        router.post(`/reading-plans/${plan.id}/enroll`);
    };

    const handleMarkComplete = (dayId: number) => {
        router.patch(`/reading-plans/${plan.id}/progress/${dayId}`);
    };

    return (
        <PublicLayout title={plan.title}>
            <Head title={plan.title}>
                <meta name="description" content={plan.description?.substring(0, 160) ?? ''} />
                <meta property="og:title" content={plan.title} />
                <meta property="og:description" content={plan.description?.substring(0, 160) ?? ''} />
                <meta property="og:type" content="article" />
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/reading-plans" className="hover:text-foreground">
                        Reading Plans
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{plan.title}</span>
                </nav>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {plan.cover_url && (
                            <div className="mb-8 aspect-video overflow-hidden rounded-lg">
                                <img src={plan.cover_url} alt={plan.title} className="size-full object-cover" />
                            </div>
                        )}

                        <h1 className="mb-4 text-3xl font-bold">{plan.title}</h1>

                        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="size-4" />
                                {plan.duration_days} days
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="size-4" />
                                {plan.enrollments_count} enrolled
                            </span>
                        </div>

                        {plan.description && (
                            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{plan.description}</p>
                        )}

                        {/* Daily Readings */}
                        <div className="space-y-3">
                            <h2 className="text-xl font-semibold">Daily Readings</h2>
                            {plan.days.map((day) => {
                                const isCompleted = completedDayIds.includes(day.id);
                                return (
                                    <Card key={day.id} className={isCompleted ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' : ''}>
                                        <CardContent className="flex items-start gap-4 py-4">
                                            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isCompleted ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'}`}>
                                                {isCompleted ? <Check className="size-5" /> : <span className="text-sm font-bold">{day.day_number}</span>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{day.title}</p>
                                                    {isCompleted && <Badge variant="outline" className="text-green-600">Done</Badge>}
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    <BookOpen className="mr-1 inline size-3.5" />
                                                    {day.scripture_reference}
                                                </p>
                                                {day.reflection && (
                                                    <p className="mt-2 text-sm italic text-muted-foreground">{day.reflection}</p>
                                                )}
                                            </div>
                                            {enrollment && !isCompleted && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMarkComplete(day.id)}
                                                >
                                                    Complete
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {plan.days.length === 0 && (
                                <p className="py-8 text-center text-muted-foreground">
                                    Daily readings are being prepared. Check back soon!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Your Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!isLoggedIn && (
                                    <div className="text-center">
                                        <p className="mb-3 text-sm text-muted-foreground">
                                            Log in to enroll and track your progress.
                                        </p>
                                        <Button asChild size="sm">
                                            <Link href="/login">Log in</Link>
                                        </Button>
                                    </div>
                                )}

                                {isLoggedIn && !enrollment && (
                                    <div className="text-center">
                                        <p className="mb-3 text-sm text-muted-foreground">
                                            Start this plan to track your daily progress.
                                        </p>
                                        <Button size="sm" onClick={handleEnroll}>
                                            Start Plan
                                        </Button>
                                    </div>
                                )}

                                {enrollment && (
                                    <div>
                                        <div className="mb-3 flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">{enrollment.completion_percentage}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{ width: `${enrollment.completion_percentage}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {completedDayIds.length} of {plan.duration_days} days completed
                                        </p>
                                        {enrollment.completed_at && (
                                            <Badge className="mt-3" variant="default">Plan Completed!</Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
