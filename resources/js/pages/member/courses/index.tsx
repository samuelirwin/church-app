import { Head, Link } from '@inertiajs/react';
import { BookOpen, CheckCircle2, Clock, GraduationCap } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type ActiveCourse = {
    id: number;
    course_title: string;
    course_slug: string;
    difficulty: string;
    estimated_hours: string | null;
    progress: number;
    enrolled_at: string;
};

type CompletedCourse = {
    id: number;
    course_title: string;
    course_slug: string;
    difficulty: string;
    completed_at: string;
};

type Props = {
    active: ActiveCourse[];
    completed: CompletedCourse[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Courses', href: '/my-courses' },
];

function difficultyColor(difficulty: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (difficulty) {
        case 'beginner':
            return 'secondary';
        case 'intermediate':
            return 'default';
        case 'advanced':
            return 'destructive';
        default:
            return 'outline';
    }
}

export default function MyCourses({ active, completed }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Courses" />

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/academy">Browse All</Link>
                    </Button>
                </div>

                {/* Active Courses */}
                <div>
                    <h2 className="mb-3 text-lg font-semibold">In Progress</h2>
                    {active.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="mb-4 text-muted-foreground">No courses in progress.</p>
                                <Button asChild>
                                    <Link href="/academy">Explore Courses</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {active.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/academy/${course.course_slug}`}
                                    className="block"
                                >
                                    <Card className="transition-colors hover:bg-muted/50">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate font-medium">{course.course_title}</p>
                                                        <Badge variant={difficultyColor(course.difficulty)}>
                                                            {course.difficulty}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                        {course.estimated_hours && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="size-3.5" />
                                                                {course.estimated_hours}h estimated
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1.5">
                                                            <BookOpen className="size-3.5" />
                                                            Enrolled {new Date(course.enrolled_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4 shrink-0 text-right">
                                                    <span className="text-lg font-semibold">{course.progress}%</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Completed Courses */}
                {completed.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-lg font-semibold">Completed</h2>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Course</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Difficulty</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Completed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {completed.map((course) => (
                                        <tr key={course.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/academy/${course.course_slug}`}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="size-4 text-green-500" />
                                                        {course.course_title}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={difficultyColor(course.difficulty)}>
                                                    {course.difficulty}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(course.completed_at).toLocaleDateString()}
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
