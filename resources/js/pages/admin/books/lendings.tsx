import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { FacetedFilter } from '@/components/shared/data-table/faceted-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/members';

type LendingData = {
    id: number;
    book: { id: number; title: string; slug: string; author: string };
    user: { id: number; name: string; email: string };
    lender: { id: number; name: string };
    borrowed_at: string;
    due_at: string;
    returned_at: string | null;
    is_returned: boolean;
    is_overdue: boolean;
    notes: string | null;
};

type Filters = {
    status: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    lendings: Paginated<LendingData>;
    filters: Filters;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/books' },
    { title: 'Books', href: '/admin/books' },
    { title: 'Lendings', href: '/admin/books-lendings' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'returned', label: 'Returned' },
];

const markReturned = async (lending: LendingData) => {
    if (
        await confirmAction({
            title: `Mark "${lending.book.title}" as returned from ${lending.user.name}?`,
            confirmLabel: 'Mark',
        })
    ) {
        router.patch(`/admin/lendings/${lending.id}/return`);
    }
};

const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : '-';

/** Lendings table columns; sortable ids match the server's sort keys. */
const columns: DataTableColumn<LendingData>[] = [
    {
        id: 'book',
        header: 'Book',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
            <div>
                <div className="font-medium">{row.original.book.title}</div>
                <div className="text-xs text-muted-foreground">
                    {row.original.book.author}
                </div>
            </div>
        ),
    },
    {
        id: 'borrower',
        header: 'Borrower',
        enableSorting: false,
        cell: ({ row }) => (
            <div>
                <div>{row.original.user.name}</div>
                <div className="text-xs text-muted-foreground">
                    {row.original.user.email}
                </div>
            </div>
        ),
    },
    {
        id: 'borrowed_at',
        accessorFn: (lending) => lending.borrowed_at,
        header: 'Borrowed',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {formatDate(row.original.borrowed_at)}
            </span>
        ),
    },
    {
        id: 'due_at',
        accessorFn: (lending) => lending.due_at,
        header: 'Due',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {formatDate(row.original.due_at)}
            </span>
        ),
    },
    {
        id: 'returned_at',
        accessorFn: (lending) => lending.returned_at,
        header: 'Status',
        cell: ({ row }) =>
            row.original.is_returned ? (
                <Badge variant="secondary">Returned</Badge>
            ) : row.original.is_overdue ? (
                <Badge variant="destructive">Overdue</Badge>
            ) : (
                <Badge>Active</Badge>
            ),
    },
    {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) =>
            !row.original.is_returned ? (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markReturned(row.original)}
                    >
                        Return
                    </Button>
                </div>
            ) : null,
    },
];

const getRowId = (lending: LendingData) => String(lending.id);

export default function BookLendings({ lendings, filters }: Props) {
    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/books-lendings',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Book Lendings" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href="/admin/books"
                                aria-label="Back to books"
                            >
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Lendings</h1>
                    </div>
                    <ExportDropdown baseUrl="/admin/exports/book-lendings" />
                </div>

                <DataTable
                    data={lendings.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-book-lendings"
                    meta={lendings.meta}
                    itemLabel="lendings"
                    empty={
                        <EmptyState
                            icon={BookOpen}
                            title="No lendings found"
                            description="Try a different filter."
                        />
                    }
                    toolbar={
                        <FacetedFilter
                            title="Status"
                            options={STATUS_OPTIONS}
                            selected={filters.status}
                            onChange={(status) => applyFilters({ status })}
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
