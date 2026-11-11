import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/members';

type PlanData = {
    id: number;
    title: string;
    slug: string;
    duration_days: number;
    is_published: boolean;
    enrollments_count: number;
};

type Filters = {
    search?: string;
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    plans: Paginated<PlanData>;
    filters: Filters;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/reading-plans' },
    { title: 'Reading Plans', href: '/admin/reading-plans' },
];

const getRowId = (plan: PlanData) => String(plan.id);

const deletePlan = async (plan: PlanData) => {
    if (
        await confirmAction({
            title: `Delete reading plan "${plan.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/reading-plans/${plan.id}`);
    }
};

export default function ReadingPlansIndex({ plans, filters }: Props) {
    const { permissions } = usePage().props as {
        permissions: { isStaffOrAbove: boolean };
    };
    const canManage = permissions.isStaffOrAbove;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/reading-plans',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns = useMemo<DataTableColumn<PlanData>[]>(
        () => [
            {
                id: 'title',
                accessorFn: (plan) => plan.title,
                header: 'Title',
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.title}</div>
                ),
            },
            {
                id: 'duration',
                accessorFn: (plan) => plan.duration_days,
                header: 'Duration',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.duration_days} days
                    </span>
                ),
            },
            {
                id: 'enrolled',
                accessorFn: (plan) => plan.enrollments_count,
                header: 'Enrolled',
                cell: ({ row }) => (
                    <span className="text-muted-foreground tabular-nums">
                        {row.original.enrollments_count}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (plan) => plan.is_published,
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
                                href={`/admin/reading-plans/${row.original.id}`}
                                aria-label={`View ${row.original.title}`}
                            >
                                <BookOpen className="size-3.5" />
                            </Link>
                        </Button>
                        {canManage && (
                            <>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link
                                        href={`/admin/reading-plans/${row.original.id}/edit`}
                                        aria-label={`Edit ${row.original.title}`}
                                    >
                                        <Pencil className="size-3.5" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deletePlan(row.original)}
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
            <Head title="Manage Reading Plans" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Reading Plans</h1>
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/reading-plans/create">
                                <Plus className="mr-1 size-4" />
                                Add Plan
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    data={plans.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-reading-plans"
                    meta={plans.meta}
                    itemLabel="plans"
                    empty={
                        <EmptyState
                            icon={BookOpen}
                            title="No reading plans found"
                            description="Try a different search."
                        />
                    }
                    toolbar={
                        <Input
                            placeholder="Search plans..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters({
                                    search: e.target.value || undefined,
                                });
                            }}
                            className="h-9 sm:max-w-xs"
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
