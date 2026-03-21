import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

type DocumentData = {
    id: number;
    title: string;
    slug: string;
    visibility: string;
    visibility_label: string;
    file_name: string | null;
    file_mime_type: string | null;
    is_published: boolean;
    category: { id: number; name: string } | null;
    uploader: { id: number; name: string } | null;
    created_at: string;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    documents: PaginatedData<DocumentData>;
    filters: { search?: string; category_id?: string; visibility?: string };
    categories: Array<{ id: number; name: string }>;
    visibilities: Array<{ value: string; label: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/documents' },
    { title: 'Documents', href: '/admin/documents' },
];

function visibilityVariant(visibility: string): 'default' | 'secondary' | 'destructive' {
    switch (visibility) {
        case 'public':
            return 'default';
        case 'members':
            return 'secondary';
        default:
            return 'destructive';
    }
}

export default function DocumentsIndex({ documents, filters, categories, visibilities }: Props) {
    const { permissions } = usePage().props as { permissions: { isStaffOrAbove: boolean } };
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/documents', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/documents', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = (doc: DocumentData) => {
        if (confirm(`Delete document "${doc.title}"?`)) {
            router.delete(`/admin/documents/${doc.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Documents" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Documents</h1>
                    {permissions.isStaffOrAbove && (
                        <Button asChild>
                            <Link href="/admin/documents/create">
                                <Plus className="mr-1 size-4" />
                                Add Document
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search by title..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select onValueChange={(v) => handleFilter('category_id', v)} defaultValue={filters.category_id ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={(v) => handleFilter('visibility', v)} defaultValue={filters.visibility ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Visibility" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Visibility</SelectItem>
                            {visibilities.map((v) => (
                                <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">File</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Visibility</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {documents.data.map((doc) => (
                                <tr key={doc.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{doc.title}</div>
                                        {doc.category && <div className="text-xs text-muted-foreground">{doc.category.name}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <FileText className="size-3.5" />
                                            <span className="max-w-[160px] truncate text-xs">{doc.file_name ?? 'No file'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={visibilityVariant(doc.visibility)}>
                                            {doc.visibility_label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={doc.is_published ? 'default' : 'secondary'}>
                                            {doc.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {permissions.isStaffOrAbove && (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/documents/${doc.id}/edit`}><Pencil className="size-3.5" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)} className="text-destructive hover:text-destructive">
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {documents.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No documents found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {documents.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {documents.links.map((link, i) => (
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
