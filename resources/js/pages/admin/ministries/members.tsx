import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, UsersRound } from 'lucide-react';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { FacetedFilter } from '@/components/shared/data-table/faceted-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Option, PaginationMeta } from '@/types/members';

type MemberData = {
    id: number;
    user: { id: number; name: string; email: string };
    role: string;
    joined_at: string;
};

type MinistryData = {
    id: number;
    name: string;
};

type Filters = {
    role: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    ministry: { data: MinistryData };
    /** Raw paginator: rows in `data`, page info at the top level. */
    members: PaginationMeta & { data: MemberData[] };
    filters: Filters;
    roles: Option[];
};

/** Column ids match the sort keys MinistryController::members accepts. */
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
        id: 'role',
        header: 'Role',
        accessorFn: (member) => member.role,
        cell: ({ row }) => (
            <Badge
                variant={
                    row.original.role === 'leader' ? 'default' : 'secondary'
                }
            >
                {row.original.role.charAt(0).toUpperCase() +
                    row.original.role.slice(1)}
            </Badge>
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

export default function MinistryMembers({
    ministry: { data: ministry },
    members,
    filters,
    roles,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/ministries' },
        { title: 'Ministries', href: '/admin/ministries' },
        { title: ministry.name, href: `/admin/ministries/${ministry.id}/edit` },
        { title: 'Members', href: `/admin/ministries/${ministry.id}/members` },
    ];

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            `/admin/ministries/${ministry.id}/members`,
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Members: ${ministry.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/ministries">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">
                        Members of {ministry.name}
                    </h1>
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
                    storageKey="admin-ministry-members"
                    meta={members}
                    itemLabel="members"
                    empty={
                        <EmptyState
                            icon={UsersRound}
                            title="No members found"
                            description="Try a different filter."
                        />
                    }
                    toolbar={
                        <FacetedFilter
                            title="Role"
                            options={roles}
                            selected={filters.role}
                            onChange={(role) => applyFilters({ role })}
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
