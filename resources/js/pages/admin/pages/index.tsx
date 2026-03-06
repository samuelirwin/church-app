import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import { PAGE_LAYOUTS } from '@/types/pages';

type PageData = {
    id: number;
    title: string;
    slug: string;
    redirect_url: string | null;
    layout: string;
    sections: unknown[] | null;
    is_published: boolean;
    category: { id: number; name: string } | null;
    creator: { id: number; name: string } | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    pages: PaginatedData<PageData>;
    filters: { search?: string; category_id?: string };
    categories: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/pages' },
    { title: 'Pages', href: '/admin/pages' },
];

export default function PagesIndex({ pages, filters, categories }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/pages', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/pages', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = (page: PageData) => {
        if (confirm(`Delete page "${page.title}"?`)) {
            router.delete(`/admin/pages/${page.id}`);
        }
    };

    const getLayoutLabel = (value: string) =>
        PAGE_LAYOUTS.find((l) => l.value === value)?.label ?? value;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Pages" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Pages</h1>
                    <Button asChild>
                        <Link href="/admin/pages/create">
                            <Plus className="mr-1 size-4" />
                            Add Page
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search pages..."
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
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}
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
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Layout</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sections</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {pages.data.map((page) => (
                                <tr key={page.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{page.title}</div>
                                        {page.redirect_url ? (
                                            <a
                                                href={page.redirect_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                                            >
                                                Redirects to external link
                                                <ExternalLink className="size-3" />
                                            </a>
                                        ) : (
                                            <a
                                                href={`/pages/${page.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                                            >
                                                /pages/{page.slug}
                                                <ExternalLink className="size-3" />
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{getLayoutLabel(page.layout)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{page.sections?.length ?? 0}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{page.category?.name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={page.is_published ? 'default' : 'secondary'}>
                                            {page.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a
                                                    href={page.redirect_url ?? `/pages/${page.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={page.redirect_url ? 'Visit redirect URL' : 'Visit page'}
                                                >
                                                    <ExternalLink className="size-3.5" />
                                                </a>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/pages/${page.id}/edit`}>
                                                    <Pencil className="size-3.5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(page)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pages.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No pages found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
