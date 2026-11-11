import { Head, Link, router } from '@inertiajs/react';
import { ArchiveRestore, Contact, Eye, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';
import {
    membershipStatusColors,
    type Member,
    type Option,
    type Paginated,
} from '@/types/members';

type Filters = {
    search?: string;
    status?: string;
    age_band?: string;
    household_id?: string;
    archived?: string;
};

type Props = {
    members: Paginated<Member>;
    filters: Filters;
    statuses: Option[];
    ageBands: Option[];
    canManage: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/members' },
    { title: 'Members', href: '/admin/members' },
];

export default function MembersIndex({
    members,
    filters,
    statuses,
    ageBands,
    canManage,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const isArchived = filters.archived === '1';

    const applyFilters = (next: Filters) => {
        router.get(
            '/admin/members',
            { ...filters, ...next },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        applyFilters({ search: value || undefined });
    };

    const handleRestore = async (member: Member) => {
        if (await confirmAction({ title: `Restore ${member.full_name} to the directory?`, confirmLabel: 'Restore' })) {
            router.patch(`/admin/members/${member.id}/restore`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Members" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">Members</h1>
                        <p className="text-sm text-muted-foreground">
                            {members.meta.total} {isArchived ? 'archived' : ''}{' '}
                            people
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <ExportDropdown baseUrl="/admin/exports/members" />
                            <Button variant="outline" asChild>
                                <Link href="/admin/households">Households</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/admin/members/create">
                                    <Plus className="mr-1 size-4" />
                                    Add Member
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                    <Input
                        placeholder="Search name, email, or phone..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select
                        onValueChange={(v) =>
                            applyFilters({
                                status: v === 'all' ? undefined : v,
                            })
                        }
                        defaultValue={filters.status ?? 'all'}
                    >
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={(v) =>
                            applyFilters({
                                age_band: v === 'all' ? undefined : v,
                            })
                        }
                        defaultValue={filters.age_band ?? 'all'}
                    >
                        <SelectTrigger className="sm:w-[160px]">
                            <SelectValue placeholder="Age" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Ages</SelectItem>
                            {ageBands.map((b) => (
                                <SelectItem key={b.value} value={b.value}>
                                    {b.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {canManage && (
                        <Button
                            variant={isArchived ? 'default' : 'outline'}
                            onClick={() =>
                                applyFilters({
                                    archived: isArchived ? undefined : '1',
                                })
                            }
                        >
                            {isArchived ? 'Showing Archived' : 'Show Archived'}
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Contact
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Household
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Age
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {members.data.map((member) => (
                                <tr
                                    key={member.id}
                                    className="hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {member.photo_url ? (
                                                <img
                                                    src={member.photo_url}
                                                    alt=""
                                                    className="size-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                    {member.first_name.charAt(
                                                        0,
                                                    )}
                                                    {member.last_name?.charAt(
                                                        0,
                                                    )}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium">
                                                    {member.full_name}
                                                </div>
                                                {!member.user_id && (
                                                    <div className="text-xs text-muted-foreground">
                                                        No account
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        <div>{member.email ?? '-'}</div>
                                        {member.phone && (
                                            <div className="text-xs">
                                                {member.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {member.household ? (
                                            canManage ? (
                                                <Link
                                                    href={`/admin/households/${member.household.id}`}
                                                    className="hover:underline"
                                                >
                                                    {member.household.name}
                                                </Link>
                                            ) : (
                                                member.household.name
                                            )
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {member.age ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${membershipStatusColors[member.membership_status] ?? ''}`}
                                        >
                                            {member.membership_status_label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {isArchived ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleRestore(member)
                                                    }
                                                    title="Restore"
                                                >
                                                    <ArchiveRestore className="size-3.5" />
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/members/${member.id}`}
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    {canManage && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/admin/members/${member.id}/edit`}
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {members.data.length === 0 && (
                                <TableEmptyRow colSpan={6} icon={Contact} title="No members found" description="Try a different search or filter." />
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={members.meta} itemLabel="members" />
            </div>
        </AppLayout>
    );
}
