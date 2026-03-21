import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

type CourseData = {
    id: number;
    title: string;
    slug: string;
    difficulty: string;
    difficulty_label: string;
    estimated_hours: number | null;
    is_published: boolean;
    enrollments_count: number;
    lessons_count: number;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type DifficultyOption = { value: string; label: string };

type Props = {
    courses: PaginatedData<CourseData>;
    filters: { search?: string; difficulty?: string };
    difficulties: DifficultyOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/courses' },
    { title: 'Courses', href: '/admin/courses' },
];

export default function CoursesIndex({ courses, filters, difficulties }: Props) {
    const { permissions } = usePage().props as { permissions: { isStaffOrAbove: boolean } };
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/courses', { search: value || undefined, difficulty: filters.difficulty }, { preserveState: true, replace: true });
    };

    const handleDifficultyFilter = (value: string) => {
        router.get('/admin/courses', { search: filters.search, difficulty: value || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = (course: CourseData) => {
        if (confirm(`Delete course "${course.title}"?`)) {
            router.delete(`/admin/courses/${course.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Courses" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Courses</h1>
                    {permissions.isStaffOrAbove && (
                        <Button asChild>
                            <Link href="/admin/courses/create">
                                <Plus className="mr-1 size-4" />
                                Add Course
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <select
                        value={filters.difficulty ?? ''}
                        onChange={(e) => handleDifficultyFilter(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Difficulties</option>
                        {difficulties.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Difficulty</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lessons</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Enrolled</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {courses.data.map((course) => (
                                <tr key={course.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{course.title}</div>
                                        {course.estimated_hours && (
                                            <div className="text-xs text-muted-foreground">{course.estimated_hours}h estimated</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">{course.difficulty_label}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{course.lessons_count}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Users className="size-3.5" />
                                            {course.enrollments_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={course.is_published ? 'default' : 'secondary'}>
                                            {course.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/courses/${course.id}`}>
                                                    <BookOpen className="size-3.5" />
                                                </Link>
                                            </Button>
                                            {permissions.isStaffOrAbove && (
                                                <>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/admin/courses/${course.id}/edit`}>
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(course)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {courses.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No courses found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
