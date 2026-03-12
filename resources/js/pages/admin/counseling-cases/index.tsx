import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

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

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type EnumOption = { value: string; label: string };

type Props = {
    cases: PaginatedData<CaseData>;
    filters: { search?: string; status?: string; case_type?: string; counselor_id?: string };
    statuses: EnumOption[];
    caseTypes: EnumOption[];
    counselors: Array<{ id: number; name: string }>;
    isAdmin: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/counseling-cases' },
    { title: 'Counseling Cases', href: '/admin/counseling-cases' },
];

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    closed_resolved: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    closed_referred: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    closed_unresolved: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function CounselingCasesIndex({ cases, filters, statuses, caseTypes, counselors, isAdmin }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/counseling-cases', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get('/admin/counseling-cases', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = (c: CaseData) => {
        if (confirm(`Delete case ${c.case_number}? This action cannot be undone.`)) {
            router.delete(`/admin/counseling-cases/${c.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Counseling Cases" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Counseling Cases</h1>
                        <p className="text-sm text-muted-foreground">Manage confidential counseling cases and sessions.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ExportDropdown baseUrl="/admin/exports/counseling-cases" />
                        <Button asChild>
                            <Link href="/admin/counseling-cases/create">
                                <Plus className="mr-1 size-4" />
                                New Case
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Input
                        placeholder="Search by name or case #..."
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
                    <Select value={filters.case_type ?? ''} onValueChange={(v) => handleFilter('case_type', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {caseTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {isAdmin && (
                        <Select value={filters.counselor_id ?? ''} onValueChange={(v) => handleFilter('counselor_id', v)}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="All Counselors" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Counselors</SelectItem>
                                {counselors.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Case #</th>
                                <th className="px-4 py-3 text-left font-medium">Person</th>
                                <th className="px-4 py-3 text-left font-medium">Type</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Counselor</th>
                                <th className="px-4 py-3 text-right font-medium">Sessions</th>
                                <th className="px-4 py-3 text-left font-medium">Opened</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {cases.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No counseling cases found.</td>
                                </tr>
                            ) : (
                                cases.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-sm">{c.case_number}</td>
                                        <td className="px-4 py-3 font-medium">{c.person_name}</td>
                                        <td className="px-4 py-3"><Badge variant="secondary">{c.case_type_label}</Badge></td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] ?? ''}`}>
                                                {c.status_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{c.assigned_counselor?.name ?? '-'}</td>
                                        <td className="px-4 py-3 text-right">{c.sessions_count}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(c.opened_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/counseling-cases/${c.id}`}><Eye className="size-4" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/counseling-cases/${c.id}/edit`}><Pencil className="size-4" /></Link>
                                                </Button>
                                                {isAdmin && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}>
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

                {cases.links.length > 3 && (
                    <div className="flex items-center justify-center gap-1">
                        {cases.links.map((link, i) => (
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
