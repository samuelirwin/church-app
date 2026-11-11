import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
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

type GroupData = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    ministry: { id: number; name: string } | null;
    leader: { id: number; name: string } | null;
    group_members_count: number;
};

type Filters = {
    search?: string;
    ministry_id: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    groups: Paginated<GroupData>;
    filters: Filters;
    ministries: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/ministry-groups' },
    { title: 'Ministry Groups', href: '/admin/ministry-groups' },
];

const deleteGroup = async (group: GroupData) => {
    if (
        await confirmAction({
            title: `Delete group "${group.name}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/ministry-groups/${group.id}`);
    }
};

/** Column ids match the sort keys MinistryGroupController accepts. */
const columns: DataTableColumn<GroupData>[] = [
    {
        id: 'name',
        header: 'Name',
        accessorFn: (group) => group.name,
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
        ),
    },
    {
        id: 'ministry',
        header: 'Ministry',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.ministry?.name ?? '-'}
            </span>
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
        id: 'members',
        header: 'Members',
        accessorFn: (group) => group.group_members_count,
        cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
                {row.original.group_members_count}
            </span>
        ),
    },
    {
        id: 'status',
        header: 'Status',
        accessorFn: (group) => group.is_active,
        cell: ({ row }) => (
            <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
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
                        href={`/admin/ministry-groups/${row.original.id}/members`}
                        aria-label={`Members of ${row.original.name}`}
                    >
                        <Users className="size-3.5" />
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                    <Link
                        href={`/admin/ministry-groups/${row.original.id}/edit`}
                        aria-label={`Edit ${row.original.name}`}
                    >
                        <Pencil className="size-3.5" />
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGroup(row.original)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${row.original.name}`}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        ),
    },
];

export default function MinistryGroupsIndex({
    groups,
    filters,
    ministries,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/ministry-groups',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Ministry Groups" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Ministry Groups</h1>
                    <Button asChild>
                        <Link href="/admin/ministry-groups/create">
                            <Plus className="mr-1 size-4" />
                            Add Group
                        </Link>
                    </Button>
                </div>

                <DataTable
                    data={groups.data}
                    columns={columns}
                    getRowId={(group) => String(group.id)}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-ministry-groups"
                    meta={groups.meta}
                    itemLabel="groups"
                    empty={
                        <EmptyState
                            icon={Users}
                            title="No groups found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search groups..."
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
                                title="Ministry"
                                options={ministries.map((m) => ({
                                    value: String(m.id),
                                    label: m.name,
                                }))}
                                selected={filters.ministry_id}
                                onChange={(ministry_id) =>
                                    applyFilters({ ministry_id })
                                }
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
