import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Check, Clock, Lock, Play, Users } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type LessonData = {
    id: number;
    title: string;
    slug: string;
    content_type: string;
    content_type_label: string;
    duration_minutes: number | null;
    is_free_preview: boolean;
};

type ModuleData = {
    id: number;
    title: string;
    description: string | null;
    lessons: LessonData[];
};

type CourseData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    cover_url: string | null;
    difficulty: string;
    difficulty_label: string;
    estimated_hours: number | null;
    enrollments_count: number;
    lessons_count: number;
    modules: ModuleData[];
};

type EnrollmentData = {
    id: number;
    enrolled_at: string;
    completed_at: string | null;
    progress_percentage: number;
} | null;

type Props = {
    course: { data: CourseData };
    enrollment: EnrollmentData;
    completedLessonIds: number[];
};

const difficultyColor: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function CourseShow({ course: { data: course }, enrollment, completedLessonIds }: Props) {
    const { auth } = usePage().props;
    const isLoggedIn = !!auth.user;

    const handleEnroll = () => {
        router.post(`/academy/${course.id}/enroll`);
    };

    const totalDuration = course.modules.reduce(
        (sum, mod) => sum + mod.lessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0),
        0,
    );

    return (
        <PublicLayout title={course.title}>
            <Head title={course.title}>
                <meta name="description" content={course.description?.substring(0, 160) ?? ''} />
                <meta property="og:title" content={course.title} />
                <meta property="og:description" content={course.description?.substring(0, 160) ?? ''} />
                <meta property="og:type" content="article" />
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/academy" className="hover:text-foreground">Academy</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{course.title}</span>
                </nav>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {course.cover_url && (
                            <div className="mb-8 aspect-video overflow-hidden rounded-lg">
                                <img src={course.cover_url} alt={course.title} className="size-full object-cover" />
                            </div>
                        )}

                        <div className="mb-4 flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor[course.difficulty] ?? ''}`}>
                                {course.difficulty_label}
                            </span>
                        </div>

                        <h1 className="mb-4 text-3xl font-bold">{course.title}</h1>

                        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <BookOpen className="size-4" />
                                {course.lessons_count} lessons
                            </span>
                            {course.estimated_hours && (
                                <span className="flex items-center gap-1">
                                    <Clock className="size-4" />
                                    {course.estimated_hours}h estimated
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Users className="size-4" />
                                {course.enrollments_count} enrolled
                            </span>
                        </div>

                        {course.description && (
                            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">{course.description}</p>
                        )}

                        {/* Curriculum */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Curriculum</h2>
                            {course.modules.map((mod) => (
                                <Card key={mod.id}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">{mod.title}</CardTitle>
                                        {mod.description && (
                                            <p className="text-sm text-muted-foreground">{mod.description}</p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="divide-y divide-border">
                                            {mod.lessons.map((lesson) => {
                                                const isCompleted = completedLessonIds.includes(lesson.id);
                                                const canAccess = enrollment || lesson.is_free_preview;

                                                return (
                                                    <div key={lesson.id} className="flex items-center justify-between py-2.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${isCompleted ? 'bg-green-500 text-white' : canAccess ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                                {isCompleted ? <Check className="size-4" /> : canAccess ? <Play className="size-3" /> : <Lock className="size-3" />}
                                                            </div>
                                                            <div>
                                                                {canAccess ? (
                                                                    <Link
                                                                        href={enrollment ? `/academy/${course.id}/learn/${lesson.id}` : '#'}
                                                                        className="text-sm font-medium hover:text-primary"
                                                                    >
                                                                        {lesson.title}
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-sm font-medium text-muted-foreground">{lesson.title}</span>
                                                                )}
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <span>{lesson.content_type_label}</span>
                                                                    {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                                                                    {lesson.is_free_preview && <Badge variant="secondary" className="text-xs">Free</Badge>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isCompleted && <Badge variant="outline" className="text-green-600">Done</Badge>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {course.modules.length === 0 && (
                                <p className="py-8 text-center text-muted-foreground">
                                    Course content is being prepared. Check back soon!
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
                                            Enroll to start learning and track your progress.
                                        </p>
                                        <Button size="sm" onClick={handleEnroll}>
                                            Enroll Now
                                        </Button>
                                    </div>
                                )}

                                {enrollment && (
                                    <div>
                                        <div className="mb-3 flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">{enrollment.progress_percentage}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{ width: `${enrollment.progress_percentage}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {completedLessonIds.length} of {course.lessons_count} lessons completed
                                        </p>
                                        {enrollment.completed_at && (
                                            <Badge className="mt-3" variant="default">Course Completed!</Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Course Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Level</span>
                                    <span className="font-medium">{course.difficulty_label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lessons</span>
                                    <span className="font-medium">{course.lessons_count}</span>
                                </div>
                                {course.estimated_hours && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Duration</span>
                                        <span className="font-medium">{course.estimated_hours}h</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Enrolled</span>
                                    <span className="font-medium">{course.enrollments_count}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
