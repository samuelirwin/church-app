import { Head, Link, router } from '@inertiajs/react';
import { Library, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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

type Series = {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
    start_date: string | null;
    sermons_count?: number;
};

type Filters = {
    search?: string;
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    series: Paginated<Series>;
    filters: Filters;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/series' },
    { title: 'Series', href: '/admin/series' },
];

const getRowId = (item: Series) => String(item.id);

const deleteSeries = async (item: Series) => {
    if (
        await confirmAction({
            title: `Delete series "${item.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/series/${item.id}`);
    }
};

const columns: DataTableColumn<Series>[] = [
    {
        id: 'title',
        accessorFn: (item) => item.title,
        header: 'Title',
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-medium">{row.original.title}</span>
        ),
    },
    {
        id: 'status',
        accessorFn: (item) => item.is_active,
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
                {row.original.is_active ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
    {
        id: 'start_date',
        accessorFn: (item) => item.start_date,
        header: 'Start Date',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.start_date
                    ? new Date(row.original.start_date).toLocaleDateString()
                    : '—'}
            </span>
        ),
    },
    {
        id: 'sermons',
        accessorFn: (item) => item.sermons_count ?? 0,
        header: 'Sermons',
        cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
                {row.original.sermons_count ?? 0}
            </span>
        ),
    },
    {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" asChild>
                    <Link
                        href={`/admin/series/${row.original.id}/edit`}
                        aria-label={`Edit ${row.original.title}`}
                    >
                        <Pencil className="size-3.5" />
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSeries(row.original)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${row.original.title}`}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        ),
    },
];

export default function SeriesIndex({ series, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/series',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Series" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Sermon Series</h1>
                    <Button asChild>
                        <Link href="/admin/series/create">
                            <Plus className="mr-1 size-4" />
                            Add Series
                        </Link>
                    </Button>
                </div>

                <DataTable
                    data={series.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-series"
                    meta={series.meta}
                    itemLabel="series"
                    empty={
                        <EmptyState
                            icon={Library}
                            title="No series found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <Input
                            placeholder="Search series..."
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
