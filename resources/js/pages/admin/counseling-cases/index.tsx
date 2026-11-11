import { Head, Link, router } from '@inertiajs/react';
import { HeartHandshake, MousePointerClick, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    caseStatusColors,
    CounselingCaseDetail,
    type CounselingCaseDetailData,
    type CounselingCaseSummary,
} from '@/components/admin/counseling-case-detail';
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

type Filters = {
    search?: string | null;
    status: string[];
    case_type: string[];
    counselor_id: string[];
    sort?: string | null;
    direction?: SortDirection | null;
    selected?: string | null;
};

type Props = {
    cases: Paginated<CounselingCaseSummary>;
    filters: Filters;
    statuses: Option[];
    caseTypes: Option[];
    counselors: Array<{ id: number; name: string }>;
    isAdmin: boolean;
    isDeaconView: boolean;
    selected: CounselingCaseDetailData | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/counseling-cases' },
    { title: 'Counseling Cases', href: '/admin/counseling-cases' },
];

/** Sort keys match CounselingCaseController::SORTABLE. */
const SORT_OPTIONS: SortOption[] = [
    { sort: 'opened_at', direction: 'asc', label: 'Oldest opened first' },
    { sort: 'case_number', direction: 'asc', label: 'Case number' },
    { sort: 'person', direction: 'asc', label: 'Person (A–Z)' },
    { sort: 'type', direction: 'asc', label: 'Case type' },
    { sort: 'status', direction: 'asc', label: 'Status' },
];

export default function CounselingCasesIndex({
    cases,
    filters,
    statuses,
    caseTypes,
    counselors,
    isAdmin,
    isDeaconView,
    selected,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const { activeId, isLoading, select, previous, next, close } =
        useListSelection({
            url: '/admin/counseling-cases',
            filters,
            ids: cases.data.map((c) => c.id),
            selectedId: selected?.counselingCase.data.id ?? null,
        });

    // Filters and sorting live in the URL; the server applies them inside the user's visibility scope.
    const applyFilters = (nextFilters: Partial<Filters>) => {
        router.get(
            '/admin/counseling-cases',
            { ...filters, ...nextFilters },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const counselorOptions = useMemo(
        () => counselors.map((c) => ({ value: String(c.id), label: c.name })),
        [counselors],
    );

    const list = (
        <div className="flex flex-col gap-3">
            {cases.data.length === 0 ? (
                <div className="rounded-xl border bg-card">
                    <EmptyState
                        icon={HeartHandshake}
                        title="No counseling cases found"
                        description="Try a different search or filter."
                    />
                </div>
            ) : (
                <ul className="flex flex-col gap-2">
                    {cases.data.map((c) => (
                        <li key={c.id}>
                            <button
                                type="button"
                                onClick={() => select(c.id)}
                                aria-current={
                                    c.id === activeId ? 'true' : undefined
                                }
                                className={cn(
                                    'w-full rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40',
                                    c.id === activeId &&
                                        'border-primary/60 bg-primary/5 ring-1 ring-primary/30',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="min-w-0 truncate font-medium">
                                        {c.person_name}
                                    </span>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${caseStatusColors[c.status] ?? ''}`}
                                    >
                                        {c.status_label}
                                    </span>
                                </div>
                                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                                    <span className="font-mono">
                                        {c.case_number}
                                    </span>{' '}
                                    &middot; {c.case_type_label}
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <span className="truncate">
                                        {c.assigned_counselor?.name ??
                                            'Unassigned'}
                                    </span>
                                    <span className="shrink-0">
                                        Opened{' '}
                                        {new Date(
                                            c.opened_at,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination meta={cases.meta} itemLabel="cases" />
        </div>
    );

    const detail = isLoading ? (
        <DetailSkeleton />
    ) : (
        selected && (
            <CounselingCaseDetail
                key={selected.counselingCase.data.id}
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
            <Head title="Counseling Cases" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">Counseling Cases</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage confidential counseling cases and sessions.
                        </p>
                    </div>
                    {!isDeaconView && (
                        <div className="flex items-center gap-2">
                            <ExportDropdown baseUrl="/admin/exports/counseling-cases" />
                            <Button asChild>
                                <Link href="/admin/counseling-cases/create">
                                    <Plus className="mr-1 size-4" />
                                    New Case
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                        onChange={(case_type) => applyFilters({ case_type })}
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
                    <SortSelect
                        options={SORT_OPTIONS}
                        sort={filters.sort}
                        direction={filters.direction}
                        defaultLabel="Newest opened first"
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
                            title="Select a case"
                            description="Pick a case from the list to see its details, log a session, or add a goal. Use j and k to move between cases."
                            className="h-full py-24"
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
