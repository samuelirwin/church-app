import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    Contact,
    Eye,
    Pencil,
    Plus,
    UserCog,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { FacetedFilter } from '@/components/shared/data-table/faceted-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
    status: string[];
    age_band: string[];
    household_id?: string;
    archived?: string;
    sort?: string | null;
    direction?: SortDirection | null;
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

const getRowId = (member: Member) => String(member.id);

const restoreMember = async (member: Member) => {
    if (
        await confirmAction({
            title: `Restore ${member.full_name} to the directory?`,
            confirmLabel: 'Restore',
        })
    ) {
        router.patch(`/admin/members/${member.id}/restore`);
    }
};

export default function MembersIndex({
    members,
    filters,
    statuses,
    ageBands,
    canManage,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const isArchived = filters.archived === '1';

    // Every change goes back to the server through the URL, so links and the back button keep working.
    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/members',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const bulkSetStatus = async (
        ids: string[],
        status: Option,
        clearSelection: () => void,
    ) => {
        const confirmed = await confirmAction({
            title: `Set ${ids.length} ${ids.length === 1 ? 'member' : 'members'} to ${status.label}?`,
            description:
                'Each change is recorded in that member’s status history.',
            confirmLabel: 'Update status',
        });
        if (confirmed) {
            router.post(
                '/admin/members/bulk/status',
                { member_ids: ids, membership_status: status.value },
                { preserveScroll: true, onSuccess: clearSelection },
            );
        }
    };

    const bulkArchive = async (ids: string[], clearSelection: () => void) => {
        const confirmed = await confirmAction({
            title: `Archive ${ids.length} ${ids.length === 1 ? 'member' : 'members'}?`,
            description: 'They can be restored later from "Show archived".',
            confirmLabel: 'Archive',
            destructive: true,
        });
        if (confirmed) {
            router.post(
                '/admin/members/bulk/archive',
                { member_ids: ids },
                { preserveScroll: true, onSuccess: clearSelection },
            );
        }
    };

    const columns = useMemo<DataTableColumn<Member>[]>(
        () => [
            {
                id: 'name',
                accessorFn: (member) => member.full_name,
                header: 'Name',
                enableHiding: false,
                cell: ({ row }) => {
                    const member = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            {member.photo_url ? (
                                <img
                                    src={member.photo_url}
                                    alt=""
                                    className="size-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                    {member.first_name.charAt(0)}
                                    {member.last_name?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <Link
                                    href={`/admin/members/${member.id}`}
                                    className="font-medium hover:underline"
                                >
                                    {member.full_name}
                                </Link>
                                {!member.user_id && (
                                    <div className="text-xs text-muted-foreground">
                                        No account
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'contact',
                header: 'Contact',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        <div>{row.original.email ?? '-'}</div>
                        {row.original.phone && (
                            <div className="text-xs">{row.original.phone}</div>
                        )}
                    </div>
                ),
            },
            {
                id: 'household',
                accessorFn: (member) => member.household?.name ?? null,
                header: 'Household',
                cell: ({ row }) => {
                    const household = row.original.household;
                    if (!household) {
                        return <span className="text-muted-foreground">-</span>;
                    }
                    return canManage ? (
                        <Link
                            href={`/admin/households/${household.id}`}
                            className="text-muted-foreground hover:underline"
                        >
                            {household.name}
                        </Link>
                    ) : (
                        <span className="text-muted-foreground">
                            {household.name}
                        </span>
                    );
                },
            },
            {
                id: 'age',
                accessorFn: (member) => member.age,
                header: 'Age',
                cell: ({ row }) => (
                    <span className="text-muted-foreground tabular-nums">
                        {row.original.age ?? '-'}
                    </span>
                ),
            },
            {
                id: 'joined_at',
                accessorFn: (member) => member.joined_at,
                header: 'Joined',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.joined_at
                            ? new Date(
                                  `${row.original.joined_at}T00:00:00`,
                              ).toLocaleDateString()
                            : '-'}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (member) => member.membership_status,
                header: 'Status',
                cell: ({ row }) => (
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${membershipStatusColors[row.original.membership_status] ?? ''}`}
                    >
                        {row.original.membership_status_label}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        {isArchived ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => restoreMember(row.original)}
                                title="Restore"
                                aria-label={`Restore ${row.original.full_name}`}
                            >
                                <ArchiveRestore className="size-3.5" />
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link
                                        href={`/admin/members/${row.original.id}`}
                                        aria-label={`View ${row.original.full_name}`}
                                    >
                                        <Eye className="size-3.5" />
                                    </Link>
                                </Button>
                                {canManage && (
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link
                                            href={`/admin/members/${row.original.id}/edit`}
                                            aria-label={`Edit ${row.original.full_name}`}
                                        >
                                            <Pencil className="size-3.5" />
                                        </Link>
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                ),
            },
        ],
        [canManage, isArchived],
    );

    const toolbar = (
        <>
            <Input
                placeholder="Search name, email, or phone..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    applyFilters({ search: e.target.value || undefined });
                }}
                className="h-9 sm:max-w-xs"
            />
            <FacetedFilter
                title="Status"
                options={statuses}
                selected={filters.status}
                onChange={(status) => applyFilters({ status })}
            />
            <FacetedFilter
                title="Age"
                options={ageBands}
                selected={filters.age_band}
                onChange={(age_band) => applyFilters({ age_band })}
            />
            {canManage && (
                <Button
                    variant={isArchived ? 'default' : 'outline'}
                    size="sm"
                    className="h-9"
                    onClick={() =>
                        applyFilters({ archived: isArchived ? undefined : '1' })
                    }
                >
                    {isArchived ? 'Showing archived' : 'Show archived'}
                </Button>
            )}
        </>
    );

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

                <DataTable
                    data={members.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    toolbar={toolbar}
                    storageKey="admin-members"
                    defaultHidden={['joined_at']}
                    meta={members.meta}
                    itemLabel="members"
                    empty={
                        <EmptyState
                            icon={Contact}
                            title="No members found"
                            description="Try a different search or filter."
                        />
                    }
                    bulkActions={
                        canManage && !isArchived
                            ? (ids, clearSelection) => (
                                  <>
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button
                                                  variant="outline"
                                                  size="sm"
                                              >
                                                  <UserCog className="mr-1.5 size-4" />
                                                  Set status
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="start">
                                              <DropdownMenuLabel>
                                                  Change status to
                                              </DropdownMenuLabel>
                                              <DropdownMenuSeparator />
                                              {statuses.map((status) => (
                                                  <DropdownMenuItem
                                                      key={status.value}
                                                      onSelect={() =>
                                                          bulkSetStatus(
                                                              ids,
                                                              status,
                                                              clearSelection,
                                                          )
                                                      }
                                                  >
                                                      {status.label}
                                                  </DropdownMenuItem>
                                              ))}
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                      <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-destructive hover:text-destructive"
                                          onClick={() =>
                                              bulkArchive(ids, clearSelection)
                                          }
                                      >
                                          <Archive className="mr-1.5 size-4" />
                                          Archive
                                      </Button>
                                  </>
                              )
                            : undefined
                    }
                />
            </div>
        </AppLayout>
    );
}
