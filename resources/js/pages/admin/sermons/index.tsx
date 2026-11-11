import { Head, Link, router, usePage } from '@inertiajs/react';
import { Mic2, Pencil, Plus, Trash2 } from 'lucide-react';
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

type SermonData = {
    id: number;
    title: string;
    slug: string;
    sermon_date: string;
    is_published: boolean;
    is_current_week: boolean;
    speaker: { id: number; name: string } | null;
    series: { id: number; title: string } | null;
};

type Filters = {
    search?: string;
    speaker_id: string[];
    series_id: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    sermons: Paginated<SermonData>;
    filters: Filters;
    speakers: Array<{ id: number; name: string }>;
    seriesList: Array<{ id: number; title: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/sermons' },
    { title: 'Sermons', href: '/admin/sermons' },
];

const getRowId = (sermon: SermonData) => String(sermon.id);

const deleteSermon = async (sermon: SermonData) => {
    if (
        await confirmAction({
            title: `Delete sermon "${sermon.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/sermons/${sermon.id}`);
    }
};

export default function SermonsIndex({
    sermons,
    filters,
    speakers,
    seriesList,
}: Props) {
    const { permissions } = usePage().props as {
        permissions: { isStaffOrAbove: boolean };
    };
    const canManage = permissions.isStaffOrAbove;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/sermons',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns = useMemo<DataTableColumn<SermonData>[]>(
        () => [
            {
                id: 'title',
                accessorFn: (sermon) => sermon.title,
                header: 'Title',
                enableHiding: false,
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.title}</div>
                        {row.original.series && (
                            <div className="text-xs text-muted-foreground">
                                {row.original.series.title}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: 'speaker',
                header: 'Speaker',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.speaker?.name ?? '—'}
                    </span>
                ),
            },
            {
                id: 'date',
                accessorFn: (sermon) => sermon.sermon_date,
                header: 'Date',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {new Date(
                            row.original.sermon_date,
                        ).toLocaleDateString()}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (sermon) => sermon.is_published,
                header: 'Status',
                cell: ({ row }) => (
                    <div className="flex gap-1">
                        <Badge
                            variant={
                                row.original.is_published
                                    ? 'default'
                                    : 'secondary'
                            }
                        >
                            {row.original.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {row.original.is_current_week && (
                            <Badge variant="outline">This Week</Badge>
                        )}
                    </div>
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
                                    href={`/admin/sermons/${row.original.id}/edit`}
                                    aria-label={`Edit ${row.original.title}`}
                                >
                                    <Pencil className="size-3.5" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSermon(row.original)}
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
            <Head title="Manage Sermons" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Sermons</h1>
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/sermons/create">
                                <Plus className="mr-1 size-4" />
                                Add Sermon
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    data={sermons.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-sermons"
                    meta={sermons.meta}
                    itemLabel="sermons"
                    empty={
                        <EmptyState
                            icon={Mic2}
                            title="No sermons found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search sermons..."
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
                                title="Speaker"
                                options={speakers.map((s) => ({
                                    value: String(s.id),
                                    label: s.name,
                                }))}
                                selected={filters.speaker_id}
                                onChange={(speaker_id) =>
                                    applyFilters({ speaker_id })
                                }
                            />
                            <FacetedFilter
                                title="Series"
                                options={seriesList.map((s) => ({
                                    value: String(s.id),
                                    label: s.title,
                                }))}
                                selected={filters.series_id}
                                onChange={(series_id) =>
                                    applyFilters({ series_id })
                                }
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
