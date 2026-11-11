import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Users, UsersRound } from 'lucide-react';
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

type MinistryData = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
    leader: { id: number; name: string } | null;
    groups_count: number;
};

type Filters = {
    search?: string;
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    ministries: Paginated<MinistryData>;
    filters: Filters;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/ministries' },
    { title: 'Ministries', href: '/admin/ministries' },
];

const deleteMinistry = async (ministry: MinistryData) => {
    if (
        await confirmAction({
            title: `Delete ministry "${ministry.name}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/ministries/${ministry.id}`);
    }
};

export default function MinistriesIndex({ ministries, filters }: Props) {
    const { permissions } = usePage().props as {
        permissions: {
            isAdmin: boolean;
            isStaffOrAbove: boolean;
            isLeaderOrAbove: boolean;
            isDeacon: boolean;
        };
    };
    const [search, setSearch] = useState(filters.search ?? '');
    const canDelete = permissions.isStaffOrAbove;

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/ministries',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    /** Column ids match the sort keys MinistryController accepts. */
    const columns = useMemo<DataTableColumn<MinistryData>[]>(
        () => [
            {
                id: 'name',
                header: 'Name',
                accessorFn: (ministry) => ministry.name,
                enableHiding: false,
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.name}</span>
                ),
            },
            {
                id: 'leader',
                header: 'Leader',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.leader?.name ?? '-'}
                    </span>
                ),
            },
            {
                id: 'groups',
                header: 'Groups',
                accessorFn: (ministry) => ministry.groups_count,
                cell: ({ row }) => (
                    <span className="text-muted-foreground tabular-nums">
                        {row.original.groups_count}
                    </span>
                ),
            },
            {
                id: 'sort_order',
                header: 'Order',
                accessorFn: (ministry) => ministry.sort_order,
                cell: ({ row }) => (
                    <span className="text-muted-foreground tabular-nums">
                        {row.original.sort_order}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                accessorFn: (ministry) => ministry.is_active,
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
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href={`/admin/ministries/${row.original.id}/members`}
                                aria-label={`Members of ${row.original.name}`}
                            >
                                <Users className="size-3.5" />
                            </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href={`/admin/ministries/${row.original.id}/edit`}
                                aria-label={`Edit ${row.original.name}`}
                            >
                                <Pencil className="size-3.5" />
                            </Link>
                        </Button>
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMinistry(row.original)}
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete ${row.original.name}`}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                ),
            },
        ],
        [canDelete],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Ministries" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Ministries</h1>
                    {permissions.isStaffOrAbove && (
                        <Button asChild>
                            <Link href="/admin/ministries/create">
                                <Plus className="mr-1 size-4" />
                                Add Ministry
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    data={ministries.data}
                    columns={columns}
                    getRowId={(ministry) => String(ministry.id)}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-ministries"
                    defaultHidden={['sort_order']}
                    meta={ministries.meta}
                    itemLabel="ministries"
                    empty={
                        <EmptyState
                            icon={UsersRound}
                            title="No ministries found"
                            description="Try a different search."
                        />
                    }
                    toolbar={
                        <Input
                            placeholder="Search ministries..."
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
