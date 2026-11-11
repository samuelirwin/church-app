import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';

type GroupData = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    ministry: { id: number; name: string };
    leader: { id: number; name: string } | null;
    members_count: number;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    groups: PaginatedData<GroupData>;
    filters: { search?: string; ministry_id?: string };
    ministries: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/ministry-groups' },
    { title: 'Ministry Groups', href: '/admin/ministry-groups' },
];

export default function MinistryGroupsIndex({ groups, filters, ministries }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/ministry-groups', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/ministry-groups', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = async (group: GroupData) => {
        if (await confirmAction({ title: `Delete group "${group.name}"?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/ministry-groups/${group.id}`);
        }
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

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search groups..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select onValueChange={(v) => handleFilter('ministry_id', v)} defaultValue={filters.ministry_id ?? 'all'}>
                        <SelectTrigger className="sm:w-[200px]">
                            <SelectValue placeholder="Ministry" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Ministries</SelectItem>
                            {ministries.map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ministry</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Leader</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Members</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {groups.data.map((group) => (
                                <tr key={group.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{group.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{group.ministry.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{group.leader?.name ?? '-'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{group.members_count}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={group.is_active ? 'default' : 'secondary'}>
                                            {group.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/ministry-groups/${group.id}/members`}>
                                                    <Users className="size-3.5" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/ministry-groups/${group.id}/edit`}>
                                                    <Pencil className="size-3.5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(group)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {groups.data.length === 0 && (
                                <TableEmptyRow colSpan={6} icon={Users} title="No groups found" description="Try a different search or filter." />
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
