import { Head, Link, router } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BreadcrumbItem, User } from '@/types';

type PaginatedUsers = {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    users: PaginatedUsers;
    filters: { search?: string; tab?: string };
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

export default function UsersIndex({ users, filters, activeTab, staffCount, memberCount }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/users', { search: value, tab: activeTab }, { preserveState: true, replace: true });
    };

    const handleTabChange = (tab: string) => {
        setSearch('');
        router.get('/admin/users', { tab }, { preserveState: true, replace: true });
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

                {/* Search */}
                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                </div>

                {/* Users Table */}
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={roleBadgeVariant(user.role)}>
                                            {user.role}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/users/${user.id}/edit`}>
                                                <Pencil className="mr-1 size-3.5" />
                                                Edit
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {(users.current_page - 1) * users.per_page + 1} to{' '}
                            {Math.min(users.current_page * users.per_page, users.total)} of {users.total} users
                        </p>
                        <div className="flex gap-1">
                            {users.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    asChild={!!link.url}
                                >
                                    {link.url ? (
                                        <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ) : (
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}