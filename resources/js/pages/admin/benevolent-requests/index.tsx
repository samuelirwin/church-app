import { Head, Link, router } from '@inertiajs/react';
import { Eye, HandHeart, Plus, Trash2 } from 'lucide-react';
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

type RequestData = {
    id: number;
    requester_name: string;
    requester_contact: string | null;
    category: string;
    category_label: string;
    urgency: string;
    urgency_label: string;
    status: string;
    status_label: string;
    amount_requested: string | null;
    creator: { id: number; name: string } | null;
    reviews_count: number;
    created_at: string;
};

type Filters = {
    search?: string | null;
    status: string[];
    category: string[];
    urgency: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    requests: Paginated<RequestData>;
    filters: Filters;
    statuses: Option[];
    categories: Option[];
    urgencies: Option[];
    isStaffOrAbove: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/benevolent-requests' },
    { title: 'Benevolent Requests', href: '/admin/benevolent-requests' },
];

const urgencyColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusColors: Record<string, string> = {
    pending:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    under_review:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    approved:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    partially_approved:
        'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    disbursed:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const getRowId = (req: RequestData) => String(req.id);

const deleteRequest = async (req: RequestData) => {
    if (
        await confirmAction({
            title: `Delete benevolent request for "${req.requester_name}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/benevolent-requests/${req.id}`);
    }
};

export default function BenevolentRequestsIndex({
    requests,
    filters,
    statuses,
    categories,
    urgencies,
    isStaffOrAbove,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    // Filters and sorting live in the URL; the server does the work.
    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/benevolent-requests',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns = useMemo<DataTableColumn<RequestData>[]>(
        () => [
            {
                id: 'requester',
                accessorFn: (req) => req.requester_name,
                header: 'Requester',
                enableHiding: false,
                cell: ({ row }) => (
                    <div>
                        <Link
                            href={`/admin/benevolent-requests/${row.original.id}`}
                            className="font-medium hover:underline"
                        >
                            {row.original.requester_name}
                        </Link>
                        {row.original.requester_contact && (
                            <div className="text-xs text-muted-foreground">
                                {row.original.requester_contact}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: 'category',
                accessorFn: (req) => req.category,
                header: 'Category',
                cell: ({ row }) => (
                    <Badge variant="secondary">
                        {row.original.category_label}
                    </Badge>
                ),
            },
            {
                id: 'urgency',
                accessorFn: (req) => req.urgency,
                header: 'Urgency',
                cell: ({ row }) => (
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${urgencyColors[row.original.urgency] ?? ''}`}
                    >
                        {row.original.urgency_label}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (req) => req.status,
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
                id: 'amount',
                accessorFn: (req) => req.amount_requested,
                header: 'Amount',
                cell: ({ row }) => (
                    <span className="tabular-nums">
                        {row.original.amount_requested
                            ? `$${Number(row.original.amount_requested).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                            : '-'}
                    </span>
                ),
            },
            {
                id: 'creator',
                header: 'Created By',
                cell: ({ row }) => row.original.creator?.name ?? '-',
            },
            {
                id: 'created_at',
                accessorFn: (req) => req.created_at,
                header: 'Date',
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
                    <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href={`/admin/benevolent-requests/${row.original.id}`}
                                aria-label={`View request for ${row.original.requester_name}`}
                            >
                                <Eye className="size-4" />
                            </Link>
                        </Button>
                        {isStaffOrAbove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteRequest(row.original)}
                                aria-label={`Delete request for ${row.original.requester_name}`}
                            >
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                ),
            },
        ],
        [isStaffOrAbove],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Benevolent Requests" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Benevolent Requests
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage financial and material assistance requests.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isStaffOrAbove && (
                            <ExportDropdown baseUrl="/admin/exports/benevolent-requests" />
                        )}
                        <Button asChild>
                            <Link href="/admin/benevolent-requests/create">
                                <Plus className="mr-1 size-4" />
                                New Request
                            </Link>
                        </Button>
                    </div>
                </div>

                <DataTable
                    data={requests.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-benevolent-requests"
                    meta={requests.meta}
                    itemLabel="requests"
                    empty={
                        <EmptyState
                            icon={HandHeart}
                            title="No benevolent requests found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search by name or contact..."
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
                                title="Category"
                                options={categories}
                                selected={filters.category}
                                onChange={(category) =>
                                    applyFilters({ category })
                                }
                            />
                            <FacetedFilter
                                title="Urgency"
                                options={urgencies}
                                selected={filters.urgency}
                                onChange={(urgency) =>
                                    applyFilters({ urgency })
                                }
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
