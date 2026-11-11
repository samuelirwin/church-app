import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, BookOpen, CalendarDays, ClipboardCheck, Clock, GraduationCap, Library, Mic2, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type CourseEnrollment = {
    id: number;
    course_title: string;
    course_slug: string;
    progress: number;
};

type ReadingPlanEnrollment = {
    id: number;
    plan_title: string;
    plan_slug: string;
    days_completed: number;
    total_days: number;
};

type BookLendingItem = {
    id: number;
    book_title: string;
    book_slug: string;
    due_at: string;
    is_overdue: boolean;
};

type RecentSermon = {
    id: number;
    title: string;
    slug: string;
    speaker_name: string | null;
    sermon_date: string;
    is_current_week: boolean;
};

type UpcomingEvent = {
    id: number;
    event_title: string;
    event_slug: string;
    starts_at: string;
    location: string | null;
};

type MyMinistry = {
    id: number;
    ministry_name: string;
    ministry_slug: string;
    role: string;
};

type UpcomingDuty = {
    id: number;
    role_name: string;
    scheduled_date: string;
    service_time: string;
    status: string;
};

type MemberData = {
    courseEnrollments: CourseEnrollment[];
    readingPlanEnrollments: ReadingPlanEnrollment[];
    bookLendings: BookLendingItem[];
    recentSermons: RecentSermon[];
    upcomingEvents: UpcomingEvent[];
    myMinistries: MyMinistry[];
    upcomingDuties: UpcomingDuty[];
};


type DashboardProps = {
    memberData: MemberData;
};

export default function Dashboard({ memberData }: DashboardProps) {
    const { auth } = usePage().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 lg:p-6">
                {/* Greeting */}
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Welcome back, {auth.user.name}
                    </h1>
                    <Badge variant="secondary" className="capitalize">
                        {auth.user.role}
                    </Badge>
                </div>

                {/* Member Section */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Sermons */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Mic2 className="size-4 text-muted-foreground" />
                                <CardTitle className="text-base">Recent Sermons</CardTitle>
                            </div>
                            <CardDescription>Latest messages from our services</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {memberData.recentSermons.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sermons yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {memberData.recentSermons.map((sermon) => (
                                        <Link
                                            key={sermon.id}
                                            href={`/sermons/${sermon.slug}`}
                                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{sermon.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sermon.speaker_name} &middot; {sermon.sermon_date}
                                                </p>
                                            </div>
                                            {sermon.is_current_week && (
                                                <Badge variant="default" className="ml-2 shrink-0">This Week</Badge>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* My Courses */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="size-4 text-muted-foreground" />
                                <CardTitle className="text-base">My Courses</CardTitle>
                            </div>
                            <CardDescription>Continue where you left off</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {memberData.courseEnrollments.length === 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">No active courses.</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/academy">Browse Courses</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {memberData.courseEnrollments.map((enrollment) => (
                                        <Link
                                            key={enrollment.id}
                                            href={`/academy/${enrollment.course_slug}`}
                                            className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="truncate text-sm font-medium">{enrollment.course_title}</p>
                                                <span className="ml-2 shrink-0 text-xs text-muted-foreground">{enrollment.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-muted">
                                                <div
                                                    className="h-1.5 rounded-full bg-primary transition-all"
                                                    style={{ width: `${enrollment.progress}%` }}
                                                />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* My Reading Plans */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <BookOpen className="size-4 text-muted-foreground" />
                                <CardTitle className="text-base">My Reading Plans</CardTitle>
                            </div>
                            <CardDescription>Daily scripture progress</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {memberData.readingPlanEnrollments.length === 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">No active reading plans.</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/reading-plans">Explore Plans</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {memberData.readingPlanEnrollments.map((enrollment) => {
                                        const progress = enrollment.total_days > 0
                                            ? Math.round((enrollment.days_completed / enrollment.total_days) * 100)
                                            : 0;
                                        return (
                                            <Link
                                                key={enrollment.id}
                                                href={`/reading-plans/${enrollment.plan_slug}`}
                                                className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="truncate text-sm font-medium">{enrollment.plan_title}</p>
                                                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                                                        {enrollment.days_completed}/{enrollment.total_days} days
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-muted">
                                                    <div
                                                        className="h-1.5 rounded-full bg-primary transition-all"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Borrowed Books */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Library className="size-4 text-muted-foreground" />
                                <CardTitle className="text-base">Borrowed Books</CardTitle>
                            </div>
                            <CardDescription>Your current library lendings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {memberData.bookLendings.length === 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">No books borrowed.</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/library">Visit Library</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {memberData.bookLendings.map((lending) => (
                                        <Link
                                            key={lending.id}
                                            href={`/library/${lending.book_slug}`}
                                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{lending.book_title}</p>
                                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="size-3" />
                                                    Due: {lending.due_at}
                                                </p>
                                            </div>
                                            {lending.is_overdue && (
                                                <Badge variant="destructive" className="ml-2 shrink-0">
                                                    <AlertTriangle className="mr-1 size-3" />
                                                    Overdue
                                                </Badge>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Member Widgets */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Upcoming Events */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="size-4 text-muted-foreground" />
                                <CardTitle className="text-base">Upcoming Events</CardTitle>
                            </div>
                            <CardDescription>Your registered events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {memberData.upcomingEvents.length === 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">No upcoming events.</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/events">Browse Events</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {memberData.upcomingEvents.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.event_slug}`}
                                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{event.event_title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(event.starts_at).toLocaleDateString()}
                                                    {event.location && ` - ${event.location}`}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* My Ministries */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <UsersRound className="size-4 text-muted-foreground" />
                                <CardTitle className="text-base">My Ministries</CardTitle>
                            </div>
                            <CardDescription>Ministries you belong to</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {memberData.myMinistries.length === 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Not part of any ministry yet.</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/ministries">Explore Ministries</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {memberData.myMinistries.map((ministry) => (
                                        <Link
                                            key={ministry.id}
                                            href={`/ministries/${ministry.ministry_slug}`}
                                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <p className="truncate text-sm font-medium">{ministry.ministry_name}</p>
                                            <Badge variant="secondary" className="ml-2 shrink-0">{ministry.role}</Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Duties */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className="size-4 text-muted-foreground" />
                                <CardTitle className="text-base">Upcoming Duties</CardTitle>
                            </div>
                            <CardDescription>Your volunteer schedule</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {memberData.upcomingDuties.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No upcoming duties.</p>
                            ) : (
                                <div className="space-y-3">
                                    {memberData.upcomingDuties.map((duty) => (
                                        <Link
                                            key={duty.id}
                                            href="/volunteer/my-duties"
                                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{duty.role_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {duty.scheduled_date} - {duty.service_time}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={duty.status === 'confirmed' ? 'default' : duty.status === 'declined' ? 'destructive' : 'secondary'}
                                                className="ml-2 shrink-0 capitalize"
                                            >
                                                {duty.status}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </AppLayout>
    );
}
