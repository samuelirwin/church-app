import { Head, Link, router } from '@inertiajs/react';
import { Eye, HeartHandshake, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ExportDropdown } from '@/components/admin/export-dropdown';
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
import type { Option, Paginated } from '@/types/members';

type CaseData = {
    id: number;
    case_number: string;
    person_name: string;
    case_type: string;
    case_type_label: string;
    status: string;
    status_label: string;
    assigned_counselor: { id: number; name: string } | null;
    sessions_count: number;
    opened_at: string;
};

type Filters = {
    search?: string | null;
    status: string[];
    case_type: string[];
    counselor_id: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    cases: Paginated<CaseData>;
    filters: Filters;
    statuses: Option[];
    caseTypes: Option[];
    counselors: Array<{ id: number; name: string }>;
    isAdmin: boolean;
    isDeaconView: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/counseling-cases' },
    { title: 'Counseling Cases', href: '/admin/counseling-cases' },
];

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    on_hold:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    closed_resolved:
        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    closed_referred:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    closed_unresolved:
        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const getRowId = (c: CaseData) => String(c.id);

const deleteCase = async (c: CaseData) => {
    if (
        await confirmAction({
            title: `Delete case ${c.case_number}?`,
            description: 'This action cannot be undone.',
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/counseling-cases/${c.id}`);
    }
};

export default function CounselingCasesIndex({
    cases,
    filters,
    statuses,
    caseTypes,
    counselors,
    isAdmin,
    isDeaconView,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    // Filters and sorting live in the URL; the server applies them inside the user's visibility scope.
    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/counseling-cases',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const counselorOptions = useMemo(
        () => counselors.map((c) => ({ value: String(c.id), label: c.name })),
        [counselors],
    );

    const columns = useMemo<DataTableColumn<CaseData>[]>(
        () => [
            {
                id: 'case_number',
                accessorFn: (c) => c.case_number,
                header: 'Case #',
                enableHiding: false,
                cell: ({ row }) => (
                    <Link
                        href={`/admin/counseling-cases/${row.original.id}`}
                        className="font-mono text-sm hover:underline"
                    >
                        {row.original.case_number}
                    </Link>
                ),
            },
            {
                id: 'person',
                accessorFn: (c) => c.person_name,
                header: 'Person',
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.person_name}
                    </span>
                ),
            },
            {
                id: 'type',
                accessorFn: (c) => c.case_type,
                header: 'Type',
                cell: ({ row }) => (
                    <Badge variant="secondary">
                        {row.original.case_type_label}
                    </Badge>
                ),
            },
            {
                id: 'status',
                accessorFn: (c) => c.status,
                header: 'Status',
                cell: ({ row }) => (
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusColors[row.original.status] ?? ''}`}
                    >
                        {row.original.status_label}
                    </span>
                ),
            },
            {
                id: 'counselor',
                header: 'Counselor',
                cell: ({ row }) => row.original.assigned_counselor?.name ?? '-',
            },
            {
                id: 'sessions',
                header: 'Sessions',
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.sessions_count}
                    </span>
                ),
            },
            {
                id: 'opened_at',
                accessorFn: (c) => c.opened_at,
                header: 'Opened',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {new Date(row.original.opened_at).toLocaleDateString()}
                    </span>
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
                                href={`/admin/counseling-cases/${row.original.id}`}
                                aria-label={`View case ${row.original.case_number}`}
                            >
                                <Eye className="size-4" />
                            </Link>
                        </Button>
                        {!isDeaconView && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    href={`/admin/counseling-cases/${row.original.id}/edit`}
                                    aria-label={`Edit case ${row.original.case_number}`}
                                >
                                    <Pencil className="size-4" />
                                </Link>
                            </Button>
                        )}
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCase(row.original)}
                                aria-label={`Delete case ${row.original.case_number}`}
                            >
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                ),
            },
        ],
        [isAdmin, isDeaconView],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Counseling Cases" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Counseling Cases</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage confidential counseling cases and sessions.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isDeaconView && (
                            <ExportDropdown baseUrl="/admin/exports/counseling-cases" />
                        )}
                        {!isDeaconView && (
                            <Button asChild>
                                <Link href="/admin/counseling-cases/create">
                                    <Plus className="mr-1 size-4" />
                                    New Case
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <DataTable
                    data={cases.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-counseling-cases"
                    meta={cases.meta}
                    itemLabel="cases"
                    empty={
                        <EmptyState
                            icon={HeartHandshake}
                            title="No counseling cases found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search by name or case #..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    applyFilters({
                                        search: e.target.value || undefined,
                                    });
                                }}
                                className="h-9 w-64"
                            />
                            <FacetedFilter
                                title="Status"
                                options={statuses}
                                selected={filters.status}
                                onChange={(status) => applyFilters({ status })}
                            />
                            <FacetedFilter
                                title="Type"
                                options={caseTypes}
                                selected={filters.case_type}
                                onChange={(case_type) =>
                                    applyFilters({ case_type })
                                }
                            />
                            {isAdmin && (
                                <FacetedFilter
                                    title="Counselor"
                                    options={counselorOptions}
                                    selected={filters.counselor_id}
                                    onChange={(counselor_id) =>
                                        applyFilters({ counselor_id })
                                    }
                                />
                            )}
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
