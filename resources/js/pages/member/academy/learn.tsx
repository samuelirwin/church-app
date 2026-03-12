import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Check, ChevronLeft, Play } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type LessonData = {
    id: number;
    title: string;
    slug: string;
    content_type: string;
    body: string | null;
    video_url: string | null;
    duration_minutes: number | null;
};

type ModuleLessonData = {
    id: number;
    title: string;
    slug: string;
    content_type_label: string;
    duration_minutes: number | null;
};

type ModuleData = {
    id: number;
    title: string;
    lessons: ModuleLessonData[];
};

type CourseData = {
    id: number;
    title: string;
    slug: string;
    modules: ModuleData[];
};

type Props = {
    course: { data: CourseData };
    lesson: { data: LessonData };
    isCompleted: boolean;
    completedLessonIds: number[];
    enrollment: { id: number; progress_percentage: number };
};

export default function LearnLesson({ course: { data: course }, lesson: { data: lesson }, isCompleted, completedLessonIds, enrollment }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Academy', href: `/academy/${course.slug}` },
        { title: course.title, href: `/academy/${course.slug}` },
        { title: lesson.title, href: '#' },
    ];

    const handleMarkComplete = () => {
        router.post(`/academy/${course.id}/lessons/${lesson.id}/complete`);
    };

    // Find previous and next lessons
    const allLessons = course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));
    const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${lesson.title} - ${course.title}`} />

            <div className="flex min-h-[calc(100vh-4rem)]">
                {/* Sidebar */}
                <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-border bg-muted/30 lg:block">
                    <div className="p-4">
                        <Link href={`/academy/${course.slug}`} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="size-4" />
                            Back to Course
                        </Link>
                        <div className="mb-2">
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{enrollment.progress_percentage}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${enrollment.progress_percentage}%` }} />
                            </div>
                        </div>
                    </div>
                    <nav className="px-2 pb-4">
                        {course.modules.map((mod) => (
                            <div key={mod.id} className="mb-3">
                                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{mod.title}</p>
                                {mod.lessons.map((l) => {
                                    const isCurrent = l.id === lesson.id;
                                    const isDone = completedLessonIds.includes(l.id);
                                    return (
                                        <Link
                                            key={l.id}
                                            href={`/academy/${course.id}/learn/${l.id}`}
                                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${isCurrent ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-muted'}`}
                                        >
                                            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${isDone ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                {isDone ? <Check className="size-3" /> : <Play className="size-2.5" />}
                                            </span>
                                            <span className="truncate">{l.title}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto">
                        <h1 className="mb-2 text-2xl font-bold">{lesson.title}</h1>
                        <div className="mb-6 flex items-center gap-3">
                            <Badge variant="outline">{lesson.content_type}</Badge>
                            {lesson.duration_minutes && <span className="text-sm text-muted-foreground">{lesson.duration_minutes} min</span>}
                            {isCompleted && <Badge variant="default" className="bg-green-500">Completed</Badge>}
                        </div>

                        {lesson.video_url && (
                            <div className="mb-6 aspect-video overflow-hidden rounded-lg bg-black">
                                <iframe
                                    src={lesson.video_url.replace('watch?v=', 'embed/')}
                                    className="size-full"
                                    allowFullScreen
                                    title={lesson.title}
                                />
                            </div>
                        )}

                        {lesson.body && (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: lesson.body }} />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                            <div>
                                {prevLesson && (
                                    <Button variant="outline" asChild>
                                        <Link href={`/academy/${course.id}/learn/${prevLesson.id}`}>
                                            Previous
                                        </Link>
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {!isCompleted && (
                                    <Button onClick={handleMarkComplete}>
                                        <Check className="mr-1 size-4" />
                                        Mark Complete
                                    </Button>
                                )}
                                {nextLesson && (
                                    <Button variant={isCompleted ? 'default' : 'outline'} asChild>
                                        <Link href={`/academy/${course.id}/learn/${nextLesson.id}`}>
                                            Next Lesson
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}
