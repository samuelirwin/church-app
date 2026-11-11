import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
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

type BookData = {
    id: number;
    title: string;
    slug: string;
    author: string;
    total_copies: number;
    available_copies: number;
    is_available: boolean;
    is_published: boolean;
    category: { id: number; name: string } | null;
    location: string | null;
};

type Filters = {
    search?: string;
    category_id: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    books: Paginated<BookData>;
    filters: Filters;
    categories: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/books' },
    { title: 'Books', href: '/admin/books' },
];

const getRowId = (book: BookData) => String(book.id);

const deleteBook = async (book: BookData) => {
    if (
        await confirmAction({
            title: `Delete book "${book.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/books/${book.id}`);
    }
};

export default function BooksIndex({ books, filters, categories }: Props) {
    const { permissions } = usePage().props as {
        permissions: { isStaffOrAbove: boolean };
    };
    const canManage = permissions.isStaffOrAbove;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/books',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const categoryOptions = useMemo(
        () => categories.map((c) => ({ value: String(c.id), label: c.name })),
        [categories],
    );

    const columns = useMemo<DataTableColumn<BookData>[]>(
        () => [
            {
                id: 'title',
                accessorFn: (book) => book.title,
                header: 'Title',
                enableHiding: false,
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.title}</div>
                        {row.original.location && (
                            <div className="text-xs text-muted-foreground">
                                {row.original.location}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: 'author',
                accessorFn: (book) => book.author,
                header: 'Author',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.author}
                    </span>
                ),
            },
            {
                id: 'copies',
                accessorFn: (book) => book.available_copies,
                header: 'Copies',
                cell: ({ row }) => (
                    <span className="text-muted-foreground tabular-nums">
                        {row.original.available_copies}/
                        {row.original.total_copies}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (book) => book.is_published,
                header: 'Status',
                cell: ({ row }) => (
                    <div className="flex gap-1">
                        <Badge
                            variant={
                                row.original.is_published
                                    ? 'default'
                                    : 'secondary'
                            }
                        >
                            {row.original.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {!row.original.is_available && (
                            <Badge variant="destructive">Unavailable</Badge>
                        )}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) =>
                    canManage ? (
                        <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    href={`/admin/books/${row.original.id}/edit`}
                                    aria-label={`Edit ${row.original.title}`}
                                >
                                    <Pencil className="size-3.5" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteBook(row.original)}
                                className="text-destructive hover:text-destructive"
                                aria-label={`Delete ${row.original.title}`}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ) : null,
            },
        ],
        [canManage],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Books" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Library</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/books-lendings">Lendings</Link>
                        </Button>
                        {canManage && (
                            <Button asChild>
                                <Link href="/admin/books/create">
                                    <Plus className="mr-1 size-4" />
                                    Add Book
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <DataTable
                    data={books.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-books"
                    meta={books.meta}
                    itemLabel="books"
                    empty={
                        <EmptyState
                            icon={BookOpen}
                            title="No books found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search by title or author..."
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
                                options={categoryOptions}
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
