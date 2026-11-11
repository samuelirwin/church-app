import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Users } from 'lucide-react';
import { useState } from 'react';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, User } from '@/types';
import type { PaginationMeta } from '@/types/members';

type Filters = {
    search?: string | null;
    tab?: string;
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    users: PaginationMeta & { data: User[] };
    filters: Filters;
    activeTab: string;
    staffCount: number;
    memberCount: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/users' },
    { title: 'Users', href: '/admin/users' },
];

const roleBadgeVariant = (role: string) => {
    switch (role) {
        case 'admin':
            return 'destructive' as const;
        case 'staff':
            return 'default' as const;
        case 'leader':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
};

const getRowId = (user: User) => String(user.id);

/** Column ids match the sort keys UserController accepts. */
const columns: DataTableColumn<User>[] = [
    {
        id: 'name',
        accessorFn: (user) => user.name,
        header: 'Name',
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
        ),
    },
    {
        id: 'email',
        accessorFn: (user) => user.email,
        header: 'Email',
        cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.email}</span>
        ),
    },
    {
        id: 'role',
        accessorFn: (user) => user.role,
        header: 'Role',
        cell: ({ row }) => (
            <Badge variant={roleBadgeVariant(row.original.role)}>
                {row.original.role}
            </Badge>
        ),
    },
    {
        id: 'created_at',
        accessorFn: (user) => user.created_at,
        header: 'Joined',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {new Date(row.original.created_at).toLocaleDateString()}
            </span>
        ),
    },
    {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/users/${row.original.id}/edit`}>
                        <Pencil className="mr-1 size-3.5" />
                        Edit
                    </Link>
                </Button>
            </div>
        ),
    },
];

export default function UsersIndex({
    users,
    filters,
    activeTab,
    staffCount,
    memberCount,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    // Search and sorting live in the URL alongside the active tab.
    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/users',
            { ...filters, tab: activeTab, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleTabChange = (tab: string) => {
        setSearch('');
        router.get(
            '/admin/users',
            { tab },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Users" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Users</h1>
                    <ExportDropdown baseUrl="/admin/exports/users" />
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="staff">
                            Staff ({staffCount})
                        </TabsTrigger>
                        <TabsTrigger value="members">
                            Members ({memberCount})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <DataTable
                    data={users.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-users"
                    meta={users}
                    itemLabel="users"
                    empty={
                        <EmptyState
                            icon={Users}
                            title="No users found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <Input
                            placeholder="Search users..."
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
