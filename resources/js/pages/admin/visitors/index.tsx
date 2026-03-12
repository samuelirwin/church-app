import { Head, Link, router } from '@inertiajs/react';
import { Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

type VisitorData = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    first_visit_date: string;
    status: string;
    status_label: string;
    assigned_user: { id: number; name: string } | null;
    follow_ups_count: number;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type StatusOption = {
    value: string;
    label: string;
};

type Props = {
    visitors: PaginatedData<VisitorData>;
    filters: { search?: string; status?: string };
    statuses: StatusOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Visitors', href: '/admin/visitors' },
];

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    follow_up: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    connected: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export default function VisitorsIndex({ visitors, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/visitors', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/visitors', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = (visitor: VisitorData) => {
        if (confirm(`Delete visitor "${visitor.name}"? This action cannot be undone.`)) {
            router.delete(`/admin/visitors/${visitor.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Visitors" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Visitors</h1>
                    <ExportDropdown baseUrl="/admin/exports/visitors" />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select onValueChange={(v) => handleFilter('status', v)} defaultValue={filters.status ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Visit Date</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned To</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Follow-ups</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {visitors.data.map((visitor) => (
                                <tr key={visitor.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{visitor.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{visitor.email ?? '-'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{visitor.phone ?? '-'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(visitor.first_visit_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[visitor.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                            {visitor.status_label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {visitor.assigned_user?.name ?? '-'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {visitor.follow_ups_count}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/visitors/${visitor.id}`}>
                                                    <Eye className="size-3.5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(visitor)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {visitors.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No visitors found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {visitors.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {visitors.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveState
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
