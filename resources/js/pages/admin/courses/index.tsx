import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    GraduationCap,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { FacetedFilter } from '@/components/shared/data-table/faceted-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';
import type { Option, Paginated } from '@/types/members';

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

type Filters = {
    search?: string;
    difficulty: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    courses: Paginated<CourseData>;
    filters: Filters;
    difficulties: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/courses' },
    { title: 'Courses', href: '/admin/courses' },
];

const getRowId = (course: CourseData) => String(course.id);

const deleteCourse = async (course: CourseData) => {
    if (
        await confirmAction({
            title: `Delete course "${course.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/courses/${course.id}`);
    }
};

export default function CoursesIndex({
    courses,
    filters,
    difficulties,
}: Props) {
    const { permissions } = usePage().props as {
        permissions: { isStaffOrAbove: boolean };
    };
    const canManage = permissions.isStaffOrAbove;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/courses',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns = useMemo<DataTableColumn<CourseData>[]>(
        () => [
            {
                id: 'title',
                accessorFn: (course) => course.title,
                header: 'Title',
                enableHiding: false,
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.title}</div>
                        {row.original.estimated_hours && (
                            <div className="text-xs text-muted-foreground">
                                {row.original.estimated_hours}h estimated
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: 'difficulty',
                accessorFn: (course) => course.difficulty,
                header: 'Difficulty',
                cell: ({ row }) => (
                    <Badge variant="outline">
                        {row.original.difficulty_label}
                    </Badge>
                ),
            },
            {
                id: 'lessons',
                accessorFn: (course) => course.lessons_count,
                header: 'Lessons',
                cell: ({ row }) => (
                    <span className="text-muted-foreground tabular-nums">
                        {row.original.lessons_count}
                    </span>
                ),
            },
            {
                id: 'enrolled',
                accessorFn: (course) => course.enrollments_count,
                header: 'Enrolled',
                cell: ({ row }) => (
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="size-3.5" />
                        {row.original.enrollments_count}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (course) => course.is_published,
                header: 'Status',
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.original.is_published ? 'default' : 'secondary'
                        }
                    >
                        {row.original.is_published ? 'Published' : 'Draft'}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href={`/admin/courses/${row.original.id}`}
                                aria-label={`View ${row.original.title}`}
                            >
                                <BookOpen className="size-3.5" />
                            </Link>
                        </Button>
                        {canManage && (
                            <>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link
                                        href={`/admin/courses/${row.original.id}/edit`}
                                        aria-label={`Edit ${row.original.title}`}
                                    >
                                        <Pencil className="size-3.5" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCourse(row.original)}
                                    className="text-destructive hover:text-destructive"
                                    aria-label={`Delete ${row.original.title}`}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </>
                        )}
                    </div>
                ),
            },
        ],
        [canManage],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Courses" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Courses</h1>
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/courses/create">
                                <Plus className="mr-1 size-4" />
                                Add Course
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    data={courses.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-courses"
                    meta={courses.meta}
                    itemLabel="courses"
                    empty={
                        <EmptyState
                            icon={GraduationCap}
                            title="No courses found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search courses..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    applyFilters({
                                        search: e.target.value || undefined,
                                    });
                                }}
                                className="h-9 sm:max-w-xs"
                            />
                            <FacetedFilter
                                title="Difficulty"
                                options={difficulties}
                                selected={filters.difficulty}
                                onChange={(difficulty) =>
                                    applyFilters({ difficulty })
                                }
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
