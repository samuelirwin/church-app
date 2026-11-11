import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Users } from 'lucide-react';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginationMeta } from '@/types/members';

type MemberData = {
    id: number;
    user: { id: number; name: string; email: string };
    joined_at: string;
};

type GroupData = {
    id: number;
    name: string;
    ministry: { id: number; name: string } | null;
};

type Filters = {
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    group: { data: GroupData };
    /** Raw paginator: rows in `data`, page info at the top level. */
    members: PaginationMeta & { data: MemberData[] };
    filters: Filters;
};

/** Column ids match the sort keys MinistryGroupController::members accepts. */
const columns: DataTableColumn<MemberData>[] = [
    {
        id: 'name',
        header: 'Name',
        accessorFn: (member) => member.user.name,
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-medium">{row.original.user.name}</span>
        ),
    },
    {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.user.email}
            </span>
        ),
    },
    {
        id: 'joined_at',
        header: 'Joined',
        accessorFn: (member) => member.joined_at,
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {new Date(row.original.joined_at).toLocaleDateString()}
            </span>
        ),
    },
];

export default function MinistryGroupMembers({
    group: { data: group },
    members,
    filters,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/ministry-groups' },
        { title: 'Ministry Groups', href: '/admin/ministry-groups' },
        { title: group.name, href: `/admin/ministry-groups/${group.id}/edit` },
        {
            title: 'Members',
            href: `/admin/ministry-groups/${group.id}/members`,
        },
    ];

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            `/admin/ministry-groups/${group.id}/members`,
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Members: ${group.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/ministry-groups">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Members of {group.name}
                        </h1>
                        {group.ministry && (
                            <p className="text-sm text-muted-foreground">
                                {group.ministry.name}
                            </p>
                        )}
                    </div>
                </div>

                <DataTable
                    data={members.data}
                    columns={columns}
                    getRowId={(member) => String(member.id)}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-group-members"
                    meta={members}
                    itemLabel="members"
                    empty={
                        <EmptyState
                            icon={Users}
                            title="No members in this group yet"
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
