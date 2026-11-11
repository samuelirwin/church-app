import { Head, Link, router, usePage } from '@inertiajs/react';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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

type Filters = {
    search?: string;
    category_id: string[];
    visibility: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    documents: Paginated<DocumentData>;
    filters: Filters;
    categories: Array<{ id: number; name: string }>;
    visibilities: Array<{ value: string; label: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/documents' },
    { title: 'Documents', href: '/admin/documents' },
];

function visibilityVariant(
    visibility: string,
): 'default' | 'secondary' | 'destructive' {
    switch (visibility) {
        case 'public':
            return 'default';
        case 'members':
            return 'secondary';
        default:
            return 'destructive';
    }
}

const getRowId = (doc: DocumentData) => String(doc.id);

const deleteDocument = async (doc: DocumentData) => {
    if (
        await confirmAction({
            title: `Delete document "${doc.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/documents/${doc.id}`);
    }
};

export default function DocumentsIndex({
    documents,
    filters,
    categories,
    visibilities,
}: Props) {
    const { permissions } = usePage().props as {
        permissions: { isStaffOrAbove: boolean };
    };
    const canManage = permissions.isStaffOrAbove;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/documents',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns = useMemo<DataTableColumn<DocumentData>[]>(
        () => [
            {
                id: 'title',
                accessorFn: (doc) => doc.title,
                header: 'Title',
                enableHiding: false,
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.title}</div>
                        {row.original.category && (
                            <div className="text-xs text-muted-foreground">
                                {row.original.category.name}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: 'file',
                header: 'File',
                cell: ({ row }) => (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="size-3.5" />
                        <span className="max-w-[160px] truncate text-xs">
                            {row.original.file_name ?? 'No file'}
                        </span>
                    </div>
                ),
            },
            {
                id: 'visibility',
                accessorFn: (doc) => doc.visibility,
                header: 'Visibility',
                cell: ({ row }) => (
                    <Badge variant={visibilityVariant(row.original.visibility)}>
                        {row.original.visibility_label}
                    </Badge>
                ),
            },
            {
                id: 'status',
                accessorFn: (doc) => doc.is_published,
                header: 'Status',
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.original.is_published ? 'default' : 'secondary'
                        }
                    >
                        {row.original.is_published ? 'Published' : 'Draft'}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                enableHiding: false,
                cell: ({ row }) =>
                    canManage && (
                        <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    href={`/admin/documents/${row.original.id}/edit`}
                                    aria-label={`Edit ${row.original.title}`}
                                >
                                    <Pencil className="size-3.5" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteDocument(row.original)}
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete ${row.original.title}`}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ),
            },
        ],
        [canManage],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Documents" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Documents</h1>
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/documents/create">
                                <Plus className="mr-1 size-4" />
                                Add Document
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    data={documents.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-documents"
                    meta={documents.meta}
                    itemLabel="documents"
                    empty={
                        <EmptyState
                            icon={FileText}
                            title="No documents found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search by title..."
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
                            <FacetedFilter
                                title="Visibility"
                                options={visibilities}
                                selected={filters.visibility}
                                onChange={(visibility) =>
                                    applyFilters({ visibility })
                                }
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
