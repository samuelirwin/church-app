import { Head, Link, router } from '@inertiajs/react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

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

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type EnumOption = { value: string; label: string };

type Props = {
    requests: PaginatedData<RequestData>;
    filters: { search?: string; status?: string; category?: string; urgency?: string };
    statuses: EnumOption[];
    categories: EnumOption[];
    urgencies: EnumOption[];
    isAdmin: boolean;
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
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    partially_approved: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    disbursed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function BenevolentRequestsIndex({ requests, filters, statuses, categories, urgencies, isAdmin, isStaffOrAbove }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/benevolent-requests', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/admin/benevolent-requests', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = (req: RequestData) => {
        if (confirm(`Delete benevolent request for "${req.requester_name}"?`)) {
            router.delete(`/admin/benevolent-requests/${req.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Benevolent Requests" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Benevolent Requests</h1>
                        <p className="text-sm text-muted-foreground">Manage financial and material assistance requests.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isStaffOrAbove && <ExportDropdown baseUrl="/admin/exports/benevolent-requests" />}
                        <Button asChild>
                            <Link href="/admin/benevolent-requests/create">
                                <Plus className="mr-1 size-4" />
                                New Request
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Input
                        placeholder="Search by name or contact..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-64"
                    />
                    <Select value={filters.status ?? ''} onValueChange={(v) => handleFilter('status', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {statuses.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.category ?? ''} onValueChange={(v) => handleFilter('category', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.urgency ?? ''} onValueChange={(v) => handleFilter('urgency', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All Urgencies" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Urgencies</SelectItem>
                            {urgencies.map((u) => (
                                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Requester</th>
                                <th className="px-4 py-3 text-left font-medium">Category</th>
                                <th className="px-4 py-3 text-left font-medium">Urgency</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-right font-medium">Amount</th>
                                <th className="px-4 py-3 text-left font-medium">Created By</th>
                                <th className="px-4 py-3 text-left font-medium">Date</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {requests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No benevolent requests found.</td>
                                </tr>
                            ) : (
                                requests.data.map((req) => (
                                    <tr key={req.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{req.requester_name}</div>
                                            {req.requester_contact && (
                                                <div className="text-xs text-muted-foreground">{req.requester_contact}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary">{req.category_label}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${urgencyColors[req.urgency] ?? ''}`}>
                                                {req.urgency_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[req.status] ?? ''}`}>
                                                {req.status_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {req.amount_requested ? `$${Number(req.amount_requested).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="px-4 py-3">{req.creator?.name ?? '-'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/benevolent-requests/${req.id}`}>
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                                {isStaffOrAbove && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(req)}>
                                                        <Trash2 className="size-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {requests.links.length > 3 && (
                    <div className="flex items-center justify-center gap-1">
                        {requests.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
