import { Head, router } from '@inertiajs/react';
import { MessageSquare, MousePointerClick, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { VisitorDetail } from '@/components/admin/visitor-detail';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { DetailSkeleton } from '@/components/shared/skeletons';
import { SplitView } from '@/components/shared/split-view';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useListSelection } from '@/hooks/use-list-selection';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { Option, Paginated } from '@/types/members';
import {
    visitorStatusColors,
    type Visitor,
    type VisitorDetailData,
} from '@/types/visitors';

type Filters = { search?: string; status?: string; selected?: string };

type Props = {
    visitors: Paginated<Visitor>;
    filters: Filters;
    statuses: Option[];
    isStaffOrAbove: boolean;
    selected: VisitorDetailData | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/visitors' },
    { title: 'Visitors', href: '/admin/visitors' },
];

export default function VisitorsIndex({
    visitors,
    filters,
    statuses,
    isStaffOrAbove,
    selected,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const { activeId, isLoading, select, previous, next, close } =
        useListSelection({
            url: '/admin/visitors',
            filters,
            ids: visitors.data.map((visitor) => visitor.id),
            selectedId: selected?.visitor.data.id ?? null,
        });

    const applyFilters = (nextFilters: Partial<Filters>) => {
        router.get(
            '/admin/visitors',
            { ...filters, ...nextFilters },
            { preserveState: true, replace: true },
        );
    };

    const list = (
        <div className="flex flex-col gap-3">
            {visitors.data.length === 0 ? (
                <div className="rounded-xl border bg-card">
                    <EmptyState
                        icon={UserPlus}
                        title="No visitors found"
                        description="Try a different search or filter."
                    />
                </div>
            ) : (
                <ul className="flex flex-col gap-2">
                    {visitors.data.map((visitor) => (
                        <li key={visitor.id}>
                            <button
                                type="button"
                                onClick={() => select(visitor.id)}
                                aria-current={
                                    visitor.id === activeId ? 'true' : undefined
                                }
                                className={cn(
                                    'w-full rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40',
                                    visitor.id === activeId &&
                                        'border-primary/60 bg-primary/5 ring-1 ring-primary/30',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="truncate font-medium">
                                        {visitor.name}
                                    </span>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${visitorStatusColors[visitor.status] ?? ''}`}
                                    >
                                        {visitor.status_label}
                                    </span>
                                </div>
                                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                                    {visitor.email ??
                                        visitor.phone ??
                                        'No contact details'}
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <span>
                                        First visit{' '}
                                        {new Date(
                                            visitor.first_visit_date,
                                        ).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="size-3" />
                                        {visitor.follow_ups_count ?? 0}
                                        {visitor.assigned_user &&
                                            ` · ${visitor.assigned_user.name}`}
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination meta={visitors.meta} itemLabel="visitors" />
        </div>
    );

    const detail = isLoading ? (
        <DetailSkeleton />
    ) : (
        selected && (
            <VisitorDetail
                key={selected.visitor.data.id}
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
            <Head title="Visitors" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Visitors</h1>
                    {isStaffOrAbove && (
                        <ExportDropdown baseUrl="/admin/exports/visitors" />
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            applyFilters({
                                search: e.target.value || undefined,
                            });
                        }}
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
                </div>

                <SplitView
                    list={list}
                    detail={detail}
                    hasSelection={activeId !== null}
                    placeholder={
                        <EmptyState
                            icon={MousePointerClick}
                            title="Select a visitor"
                            description="Pick someone from the list to see their details and log a follow-up. Use j and k to move between visitors."
                            className="h-full py-24"
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
