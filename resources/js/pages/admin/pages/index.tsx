import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, PanelTop, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { FacetedFilter } from '@/components/shared/data-table/faceted-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/members';
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

type Filters = {
    search?: string;
    category_id: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    pages: Paginated<PageData>;
    filters: Filters;
    categories: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/pages' },
    { title: 'Pages', href: '/admin/pages' },
];

// CMS pages are served by the public catch-all route at /{slug}.
const publicUrl = (page: PageData) => page.redirect_url ?? `/${page.slug}`;

const getLayoutLabel = (value: string) =>
    PAGE_LAYOUTS.find((l) => l.value === value)?.label ?? value;

const getRowId = (page: PageData) => String(page.id);

const deletePage = async (page: PageData) => {
    if (
        await confirmAction({
            title: `Delete page "${page.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/pages/${page.id}`);
    }
};

const columns: DataTableColumn<PageData>[] = [
    {
        id: 'title',
        accessorFn: (page) => page.title,
        header: 'Title',
        enableHiding: false,
        cell: ({ row }) => (
            <div>
                <div className="font-medium">{row.original.title}</div>
                <a
                    href={publicUrl(row.original)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                    {row.original.redirect_url
                        ? 'Redirects to external link'
                        : `/${row.original.slug}`}
                    <ExternalLink className="size-3" />
                </a>
            </div>
        ),
    },
    {
        id: 'layout',
        accessorFn: (page) => page.layout,
        header: 'Layout',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {getLayoutLabel(row.original.layout)}
            </span>
        ),
    },
    {
        id: 'sections',
        header: 'Sections',
        cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
                {row.original.sections?.length ?? 0}
            </span>
        ),
    },
    {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.category?.name ?? '—'}
            </span>
        ),
    },
    {
        id: 'status',
        accessorFn: (page) => page.is_published,
        header: 'Status',
        cell: ({ row }) => (
            <Badge
                variant={row.original.is_published ? 'default' : 'secondary'}
            >
                {row.original.is_published ? 'Published' : 'Draft'}
            </Badge>
        ),
    },
    {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" asChild>
                    <a
                        href={publicUrl(row.original)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={
                            row.original.redirect_url
                                ? 'Visit redirect URL'
                                : 'Visit page'
                        }
                        aria-label={
                            row.original.redirect_url
                                ? 'Visit redirect URL'
                                : 'Visit page'
                        }
                    >
                        <ExternalLink className="size-3.5" />
                    </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                    <Link
                        href={`/admin/pages/${row.original.id}/edit`}
                        aria-label={`Edit ${row.original.title}`}
                    >
                        <Pencil className="size-3.5" />
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePage(row.original)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${row.original.title}`}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        ),
    },
];

export default function PagesIndex({ pages, filters, categories }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/pages',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

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

                <DataTable
                    data={pages.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-pages"
                    meta={pages.meta}
                    itemLabel="pages"
                    empty={
                        <EmptyState
                            icon={PanelTop}
                            title="No pages found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search pages..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    applyFilters({
                                        search: e.target.value || undefined,
                                    });
                                }}
                                className="h-9 sm:max-w-xs"
                            />
                            <FacetedFilter
                                title="Category"
                                options={categories.map((c) => ({
                                    value: String(c.id),
                                    label: c.name,
                                }))}
                                selected={filters.category_id}
                                onChange={(category_id) =>
                                    applyFilters({ category_id })
                                }
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
