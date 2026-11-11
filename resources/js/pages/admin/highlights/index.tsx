import { Head, Link, router, usePage } from '@inertiajs/react';
import { Highlighter, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';

type HighlightData = {
    id: number;
    title: string;
    slug: string;
    type: string;
    type_label: string;
    priority: number;
    is_active: boolean;
    starts_at: string;
    ends_at: string | null;
    author: { id: number; name: string } | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    highlights: PaginatedData<HighlightData>;
    filters: { search?: string; type?: string };
    types: Array<{ value: string; label: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/highlights' },
    { title: 'Highlights', href: '/admin/highlights' },
];

export default function HighlightsIndex({ highlights, filters, types }: Props) {
    const { permissions } = usePage().props as { permissions: { isStaffOrAbove: boolean } };
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/highlights', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/highlights', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = async (highlight: HighlightData) => {
        if (await confirmAction({ title: `Delete highlight "${highlight.title}"?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/highlights/${highlight.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Highlights" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Highlights</h1>
                    {permissions.isStaffOrAbove && (
                        <Button asChild>
                            <Link href="/admin/highlights/create">
                                <Plus className="mr-1 size-4" />
                                Add Highlight
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search highlights..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select onValueChange={(v) => handleFilter('type', v)} defaultValue={filters.type ?? 'all'}>
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
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dates</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {highlights.data.map((highlight) => (
                                <tr key={highlight.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{highlight.title}</div>
                                        <div className="text-xs text-muted-foreground">{highlight.author?.name ?? '—'}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">{highlight.type_label}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{highlight.priority}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        <div className="text-xs">
                                            {new Date(highlight.starts_at).toLocaleDateString()}
                                            {highlight.ends_at && (
                                                <> — {new Date(highlight.ends_at).toLocaleDateString()}</>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={highlight.is_active ? 'default' : 'secondary'}>
                                            {highlight.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {permissions.isStaffOrAbove && (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/highlights/${highlight.id}/edit`}>
                                                        <Pencil className="size-3.5" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(highlight)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {highlights.data.length === 0 && (
                                <TableEmptyRow colSpan={6} icon={Highlighter} title="No highlights found" description="Try a different search or filter." />
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
