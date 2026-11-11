import { Head, Link, router, usePage } from '@inertiajs/react';
import { Highlighter, Pencil, Plus, Trash2 } from 'lucide-react';
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
import type { Paginated } from '@/types/members';

type HighlightData = {
    id: number;
    title: string;
    slug: string;
    type: string;
    type_label: string;
    priority: number;
    is_active: boolean;
    starts_at: string;
    ends_at: string | null;
    author: { id: number; name: string } | null;
};

type Filters = {
    search?: string;
    type: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    highlights: Paginated<HighlightData>;
    filters: Filters;
    types: Array<{ value: string; label: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/highlights' },
    { title: 'Highlights', href: '/admin/highlights' },
];

const getRowId = (highlight: HighlightData) => String(highlight.id);

const deleteHighlight = async (highlight: HighlightData) => {
    if (
        await confirmAction({
            title: `Delete highlight "${highlight.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/highlights/${highlight.id}`);
    }
};

export default function HighlightsIndex({ highlights, filters, types }: Props) {
    const { permissions } = usePage().props as {
        permissions: { isStaffOrAbove: boolean };
    };
    const canManage = permissions.isStaffOrAbove;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/highlights',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns = useMemo<DataTableColumn<HighlightData>[]>(
        () => [
            {
                id: 'title',
                accessorFn: (highlight) => highlight.title,
                header: 'Title',
                enableHiding: false,
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.title}</div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.author?.name ?? '—'}
                        </div>
                    </div>
                ),
            },
            {
                id: 'type',
                accessorFn: (highlight) => highlight.type,
                header: 'Type',
                cell: ({ row }) => (
                    <Badge variant="outline">{row.original.type_label}</Badge>
                ),
            },
            {
                id: 'priority',
                accessorFn: (highlight) => highlight.priority,
                header: 'Priority',
                cell: ({ row }) => (
                    <span className="text-muted-foreground tabular-nums">
                        {row.original.priority}
                    </span>
                ),
            },
            {
                id: 'dates',
                accessorFn: (highlight) => highlight.starts_at,
                header: 'Dates',
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground">
                        {new Date(row.original.starts_at).toLocaleDateString()}
                        {row.original.ends_at && (
                            <>
                                {' '}
                                —{' '}
                                {new Date(
                                    row.original.ends_at,
                                ).toLocaleDateString()}
                            </>
                        )}
                    </div>
                ),
            },
            {
                id: 'status',
                accessorFn: (highlight) => highlight.is_active,
                header: 'Status',
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.original.is_active ? 'default' : 'secondary'
                        }
                    >
                        {row.original.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                enableHiding: false,
                cell: ({ row }) =>
                    canManage && (
                        <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    href={`/admin/highlights/${row.original.id}/edit`}
                                    aria-label={`Edit ${row.original.title}`}
                                >
                                    <Pencil className="size-3.5" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteHighlight(row.original)}
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete ${row.original.title}`}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ),
            },
        ],
        [canManage],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Highlights" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Highlights</h1>
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/highlights/create">
                                <Plus className="mr-1 size-4" />
                                Add Highlight
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    data={highlights.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-highlights"
                    meta={highlights.meta}
                    itemLabel="highlights"
                    empty={
                        <EmptyState
                            icon={Highlighter}
                            title="No highlights found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search highlights..."
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
                                title="Type"
                                options={types}
                                selected={filters.type}
                                onChange={(type) => applyFilters({ type })}
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
