import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Lock, Plus } from 'lucide-react';
import { useState } from 'react';
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
};

type Props = CareNeedOptions & {
    careNeeds: Paginated<CareNeed>;
    filters: Filters;
    counts: { active: number; mine: number; overdue: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/care-needs' },
    { title: 'Care Needs', href: '/admin/care-needs' },
];

export default function CareNeedsIndex({
    careNeeds,
    filters,
    counts,
    types,
    priorities,
    statuses,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Care Needs" />

            <div className="flex flex-col gap-6 p-4">
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

                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
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
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {types.map((t) => (
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
                        <SelectTrigger className="sm:w-[160px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            {priorities.map((p) => (
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
                        <SelectTrigger className="sm:w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Needs action</SelectItem>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Need
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Person
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Priority
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Assigned
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Follow up by
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {careNeeds.data.map((need) => (
                                <tr
                                    key={need.id}
                                    className={`hover:bg-muted/30 ${need.is_overdue ? 'bg-red-50 dark:bg-red-950/30' : ''}`}
                                >
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/care-needs/${need.id}`}
                                            className="flex items-center gap-1.5 font-medium hover:underline"
                                        >
                                            {need.is_confidential && (
                                                <Lock
                                                    className="size-3.5 text-muted-foreground"
                                                    aria-label="Confidential"
                                                />
                                            )}
                                            {need.title}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {need.type_label}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {need.person_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[need.priority] ?? ''}`}
                                        >
                                            {need.priority_label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${careStatusColors[need.status] ?? ''}`}
                                        >
                                            {need.status_label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {need.assignee?.name ?? 'Unassigned'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {need.due_on ? (
                                            <span
                                                className={`inline-flex items-center gap-1 ${need.is_overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}`}
                                            >
                                                {need.is_overdue && (
                                                    <AlertTriangle className="size-3.5" />
                                                )}
                                                {new Date(
                                                    need.due_on,
                                                ).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {careNeeds.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No care needs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={careNeeds.meta} itemLabel="care needs" />
            </div>
        </AppLayout>
    );
}
