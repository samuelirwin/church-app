import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Users, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';

type MinistryData = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
    leader: { id: number; name: string } | null;
    groups_count: number;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    ministries: PaginatedData<MinistryData>;
    filters: { search?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/ministries' },
    { title: 'Ministries', href: '/admin/ministries' },
];

export default function MinistriesIndex({ ministries, filters }: Props) {
    const { permissions } = usePage().props as { permissions: { isAdmin: boolean; isStaffOrAbove: boolean; isLeaderOrAbove: boolean; isDeacon: boolean } };
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/ministries', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = async (ministry: MinistryData) => {
        if (await confirmAction({ title: `Delete ministry "${ministry.name}"?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/ministries/${ministry.id}`);
        }
    };

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

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search ministries..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Leader</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Groups</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {ministries.data.map((ministry) => (
                                <tr key={ministry.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{ministry.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {ministry.leader?.name ?? '-'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {ministry.groups_count}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={ministry.is_active ? 'default' : 'secondary'}>
                                            {ministry.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/ministries/${ministry.id}/members`}>
                                                    <Users className="size-3.5" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/ministries/${ministry.id}/edit`}>
                                                    <Pencil className="size-3.5" />
                                                </Link>
                                            </Button>
                                            {permissions.isStaffOrAbove && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(ministry)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {ministries.data.length === 0 && (
                                <TableEmptyRow colSpan={5} icon={UsersRound} title="No ministries found" description="Try a different search or filter." />
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
