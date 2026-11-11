import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';

type PlanData = {
    id: number;
    title: string;
    slug: string;
    duration_days: number;
    is_published: boolean;
    enrollments_count: number;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    plans: PaginatedData<PlanData>;
    filters: { search?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/reading-plans' },
    { title: 'Reading Plans', href: '/admin/reading-plans' },
];

export default function ReadingPlansIndex({ plans, filters }: Props) {
    const { permissions } = usePage().props as { permissions: { isStaffOrAbove: boolean } };
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/reading-plans', { search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = async (plan: PlanData) => {
        if (await confirmAction({ title: `Delete reading plan "${plan.title}"?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/reading-plans/${plan.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Reading Plans" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Reading Plans</h1>
                    {permissions.isStaffOrAbove && (
                        <Button asChild>
                            <Link href="/admin/reading-plans/create">
                                <Plus className="mr-1 size-4" />
                                Add Plan
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search plans..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Enrolled</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {plans.data.map((plan) => (
                                <tr key={plan.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{plan.title}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{plan.duration_days} days</td>
                                    <td className="px-4 py-3 text-muted-foreground">{plan.enrollments_count}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={plan.is_published ? 'default' : 'secondary'}>
                                            {plan.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/reading-plans/${plan.id}`}>
                                                    <BookOpen className="size-3.5" />
                                                </Link>
                                            </Button>
                                            {permissions.isStaffOrAbove && (
                                                <>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/admin/reading-plans/${plan.id}/edit`}>
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(plan)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {plans.data.length === 0 && (
                                <TableEmptyRow colSpan={5} icon={BookOpen} title="No reading plans found" description="Try a different search or filter." />
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
