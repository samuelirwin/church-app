import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
    category: { id: number; name: string; slug: string } | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type DifficultyOption = { value: string; label: string };
type CategoryOption = { id: number; name: string; slug: string };

type Props = {
    courses: PaginatedData<CourseData>;
    filters: { search?: string; difficulty?: string; category?: string };
    difficulties: DifficultyOption[];
    categories: CategoryOption[];
};

const difficultyColor: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AcademyIndex({ courses, filters, difficulties, categories }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/academy', { search: value || undefined, difficulty: filters.difficulty, category: filters.category }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/academy', { ...filters, [key]: value || undefined, search: filters.search }, { preserveState: true, replace: true });
    };

    return (
        <PublicLayout title="Academy">
            <Head title="Academy" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Academy</h1>
                    <p className="mt-2 text-muted-foreground">
                        Grow in knowledge and faith through structured courses.
                    </p>
                </div>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <select
                        value={filters.difficulty ?? ''}
                        onChange={(e) => handleFilter('difficulty', e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All Levels</option>
                        {difficulties.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                    {categories.length > 0 && (
                        <select
                            value={filters.category ?? ''}
                            onChange={(e) => handleFilter('category', e.target.value)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.slug} value={c.slug}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.data.map((course) => (
                        <Link key={course.id} href={`/academy/${course.slug}`} className="group">
                            <Card className="h-full transition-shadow group-hover:shadow-lg">
                                {course.cover_url && (
                                    <div className="aspect-video overflow-hidden rounded-t-lg">
                                        <img
                                            src={course.cover_url}
                                            alt={course.title}
                                            className="size-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor[course.difficulty] ?? ''}`}>
                                            {course.difficulty_label}
                                        </span>
                                        {course.category && (
                                            <Badge variant="outline" className="text-xs">{course.category.name}</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                                    {course.description && (
                                        <CardDescription className="line-clamp-2">
                                            {course.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="size-3.5" />
                                            {course.lessons_count} lessons
                                        </span>
                                        {course.estimated_hours && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3.5" />
                                                {course.estimated_hours}h
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Users className="size-3.5" />
                                            {course.enrollments_count} enrolled
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {courses.data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <BookOpen className="mb-3 size-10" />
                        <p>No courses available yet. Check back soon!</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
