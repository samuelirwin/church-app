import { Head, Link, router } from '@inertiajs/react';
import { HandHeart, MousePointerClick, Plus } from 'lucide-react';
import { useState } from 'react';
import {
    BenevolentRequestDetail,
    benevolentStatusColors,
    type BenevolentRequestDetailData,
} from '@/components/admin/benevolent-request-detail';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import type { SortDirection } from '@/components/shared/data-table/data-table';
import { FacetedFilter } from '@/components/shared/data-table/faceted-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { DetailSkeleton } from '@/components/shared/skeletons';
import { SortSelect, type SortOption } from '@/components/shared/sort-select';
import { SplitView } from '@/components/shared/split-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useListSelection } from '@/hooks/use-list-selection';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { Option, Paginated } from '@/types/members';

type RequestData = {
    id: number;
    requester_name: string;
    category: string;
    category_label: string;
    urgency: string;
    urgency_label: string;
    status: string;
    status_label: string;
    amount_requested: string | null;
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
    selected?: string | null;
};

type Props = {
    requests: Paginated<RequestData>;
    filters: Filters;
    statuses: Option[];
    categories: Option[];
    urgencies: Option[];
    isStaffOrAbove: boolean;
    selected: BenevolentRequestDetailData | null;
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

/** Matches the controller's SORTABLE keys; the server default is newest first. */
const SORT_OPTIONS: SortOption[] = [
    { sort: 'created_at', direction: 'asc', label: 'Oldest first' },
    { sort: 'urgency', direction: 'desc', label: 'Urgency' },
    { sort: 'amount', direction: 'desc', label: 'Amount (high to low)' },
    { sort: 'amount', direction: 'asc', label: 'Amount (low to high)' },
    { sort: 'requester', direction: 'asc', label: 'Requester (A–Z)' },
    { sort: 'status', direction: 'asc', label: 'Status' },
    { sort: 'category', direction: 'asc', label: 'Category' },
];

const formatAmount = (amount: string | null) =>
    amount
        ? `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'No amount';

export default function BenevolentRequestsIndex({
    requests,
    filters,
    statuses,
    categories,
    urgencies,
    isStaffOrAbove,
    selected,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const { activeId, isLoading, select, previous, next, close } =
        useListSelection({
            url: '/admin/benevolent-requests',
            filters,
            ids: requests.data.map((request) => request.id),
            selectedId: selected?.benevolentRequest.data.id ?? null,
        });

    const applyFilters = (nextFilters: Partial<Filters>) => {
        router.get(
            '/admin/benevolent-requests',
            { ...filters, ...nextFilters },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const list = (
        <div className="flex flex-col gap-3">
            {requests.data.length === 0 ? (
                <div className="rounded-xl border bg-card">
                    <EmptyState
                        icon={HandHeart}
                        title="No benevolent requests found"
                        description="Try a different search or filter."
                    />
                </div>
            ) : (
                <ul className="flex flex-col gap-2">
                    {requests.data.map((request) => (
                        <li key={request.id}>
                            <button
                                type="button"
                                onClick={() => select(request.id)}
                                aria-current={
                                    request.id === activeId ? 'true' : undefined
                                }
                                className={cn(
                                    'w-full rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40',
                                    request.id === activeId &&
                                        'border-primary/60 bg-primary/5 ring-1 ring-primary/30',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="truncate font-medium">
                                        {request.requester_name}
                                    </span>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${urgencyColors[request.urgency] ?? ''}`}
                                    >
                                        {request.urgency_label}
                                    </span>
                                </div>
                                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                                    {request.category_label} &middot;{' '}
                                    {formatAmount(request.amount_requested)}
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                                    <span
                                        className={`rounded-full px-2 py-0.5 font-medium ${benevolentStatusColors[request.status] ?? ''}`}
                                    >
                                        {request.status_label}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {new Date(
                                            request.created_at,
                                        ).toLocaleDateString()}
                                        {request.reviews_count > 0 &&
                                            ` · ${request.reviews_count} ${request.reviews_count === 1 ? 'review' : 'reviews'}`}
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination meta={requests.meta} itemLabel="requests" />
        </div>
    );

    const detail = isLoading ? (
        <DetailSkeleton />
    ) : (
        selected && (
            <BenevolentRequestDetail
                key={selected.benevolentRequest.data.id}
                {...selected}
                variant="panel"
                onClose={close}
                onPrevious={previous}
                onNext={next}
            />
        )
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Benevolent Requests" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
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

                <div className="flex flex-wrap items-center gap-2">
                    <Input
                        placeholder="Search requester or contact..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            applyFilters({
                                search: e.target.value || undefined,
                            });
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
                        title="Category"
                        options={categories}
                        selected={filters.category}
                        onChange={(category) => applyFilters({ category })}
                    />
                    <FacetedFilter
                        title="Urgency"
                        options={urgencies}
                        selected={filters.urgency}
                        onChange={(urgency) => applyFilters({ urgency })}
                    />
                    <SortSelect
                        options={SORT_OPTIONS}
                        sort={filters.sort}
                        direction={filters.direction}
                        defaultLabel="Newest first"
                        onChange={(sort, direction) =>
                            applyFilters({ sort, direction })
                        }
                    />
                </div>

                <SplitView
                    list={list}
                    detail={detail}
                    hasSelection={activeId !== null}
                    placeholder={
                        <EmptyState
                            icon={MousePointerClick}
                            title="Select a request"
                            description="Pick one from the list to review it, record a decision, or add a disbursement. Use j and k to move between requests."
                            className="h-full py-24"
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
