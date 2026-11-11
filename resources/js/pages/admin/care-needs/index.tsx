import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    HandHelping,
    Lock,
    MousePointerClick,
    Plus,
} from 'lucide-react';
import { useState } from 'react';
import {
    CareNeedDetail,
    type CareNeedDetailData,
} from '@/components/admin/care-need-detail';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { DetailSkeleton } from '@/components/shared/skeletons';
import { SplitView } from '@/components/shared/split-view';
import { Button } from '@/components/ui/button';
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
import {
    careStatusColors,
    priorityColors,
    type CareNeed,
    type CareNeedOptions,
} from '@/types/care-needs';
import type { Paginated } from '@/types/members';

type Filters = {
    status: string;
    type?: string;
    priority?: string;
    assigned?: string;
    overdue?: string;
    search?: string;
    selected?: string;
};

type Props = CareNeedOptions & {
    careNeeds: Paginated<CareNeed>;
    filters: Filters;
    counts: { active: number; mine: number; overdue: number };
    selected: CareNeedDetailData | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/care-needs' },
    { title: 'Care Needs', href: '/admin/care-needs' },
];

export default function CareNeedsIndex({
    careNeeds,
    filters,
    counts,
    selected,
    ...options
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const selectedId = selected?.careNeed.data.id ?? null;
    const { activeId, isLoading, select, previous, next, close } =
        useListSelection({
            url: '/admin/care-needs',
            filters,
            ids: careNeeds.data.map((need) => need.id),
            selectedId,
        });

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/care-needs',
            { ...filters, ...next },
            { preserveState: true, replace: true },
        );
    };

    const quickFilters = [
        {
            label: `Needs action (${counts.active})`,
            active:
                filters.status === 'active' &&
                !filters.assigned &&
                !filters.overdue,
            apply: {
                status: 'active',
                assigned: undefined,
                overdue: undefined,
            },
        },
        {
            label: `Assigned to me (${counts.mine})`,
            active: filters.assigned === 'me',
            apply: { status: 'active', assigned: 'me', overdue: undefined },
        },
        {
            label: `Overdue (${counts.overdue})`,
            active: filters.overdue === '1',
            apply: { status: 'active', assigned: undefined, overdue: '1' },
        },
        {
            label: 'All',
            active: filters.status === 'all',
            apply: { status: 'all', assigned: undefined, overdue: undefined },
        },
    ];

    const list = (
        <div className="flex flex-col gap-3">
            {careNeeds.data.length === 0 ? (
                <div className="rounded-xl border bg-card">
                    <EmptyState
                        icon={HandHelping}
                        title="No care needs found"
                        description="Try a different search or filter."
                    />
                </div>
            ) : (
                <ul className="flex flex-col gap-2">
                    {careNeeds.data.map((need) => (
                        <li key={need.id}>
                            <button
                                type="button"
                                onClick={() => select(need.id)}
                                aria-current={
                                    need.id === activeId ? 'true' : undefined
                                }
                                className={cn(
                                    'w-full rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40',
                                    need.id === activeId &&
                                        'border-primary/60 bg-primary/5 ring-1 ring-primary/30',
                                    need.is_overdue &&
                                        need.id !== activeId &&
                                        'border-red-200 dark:border-red-900',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="flex min-w-0 items-center gap-1.5 font-medium">
                                        {need.is_confidential && (
                                            <Lock
                                                className="size-3.5 shrink-0 text-muted-foreground"
                                                aria-label="Confidential"
                                            />
                                        )}
                                        <span className="truncate">
                                            {need.title}
                                        </span>
                                    </span>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityColors[need.priority] ?? ''}`}
                                    >
                                        {need.priority_label}
                                    </span>
                                </div>
                                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                                    {need.person_name} &middot;{' '}
                                    {need.type_label}
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                                    <span
                                        className={`rounded-full px-2 py-0.5 font-medium ${careStatusColors[need.status] ?? ''}`}
                                    >
                                        {need.status_label}
                                    </span>
                                    <span
                                        className={cn(
                                            'flex items-center gap-1 text-muted-foreground',
                                            need.is_overdue &&
                                                'font-medium text-red-600 dark:text-red-400',
                                        )}
                                    >
                                        {need.is_overdue && (
                                            <AlertTriangle className="size-3" />
                                        )}
                                        {need.due_on
                                            ? `Due ${new Date(need.due_on).toLocaleDateString()}`
                                            : (need.assignee?.name ??
                                              'Unassigned')}
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination meta={careNeeds.meta} itemLabel="needs" />
        </div>
    );

    const detail = isLoading ? (
        <DetailSkeleton />
    ) : (
        selected && (
            <CareNeedDetail
                key={selected.careNeed.data.id}
                {...selected}
                {...options}
                variant="panel"
                onClose={close}
                onPrevious={previous}
                onNext={next}
            />
        )
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Care Needs" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Care Needs</h1>
                    <Button asChild>
                        <Link href="/admin/care-needs/create">
                            <Plus className="mr-1 size-4" />
                            Add Care Need
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {quickFilters.map((f) => (
                        <Button
                            key={f.label}
                            variant={f.active ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => applyFilters(f.apply)}
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Input
                        placeholder="Search title or person..."
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
                            applyFilters({ type: v === 'all' ? undefined : v })
                        }
                        defaultValue={filters.type ?? 'all'}
                    >
                        <SelectTrigger className="sm:w-[170px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {options.types.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={(v) =>
                            applyFilters({
                                priority: v === 'all' ? undefined : v,
                            })
                        }
                        defaultValue={filters.priority ?? 'all'}
                    >
                        <SelectTrigger className="sm:w-[150px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            {options.priorities.map((p) => (
                                <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={(v) => applyFilters({ status: v })}
                        value={filters.status}
                    >
                        <SelectTrigger className="sm:w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Needs action</SelectItem>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {options.statuses.map((s) => (
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
                            title="Select a care need"
                            description="Pick one from the list to see its details, log a contact, or add a task. Use j and k to move between needs."
                            className="h-full py-24"
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
