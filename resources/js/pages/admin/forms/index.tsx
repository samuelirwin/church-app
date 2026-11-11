import { Head, Link, router, usePage } from '@inertiajs/react';
import { ClipboardList, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
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

type FormData = {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    is_active: boolean;
    allows_anonymous: boolean;
    responses_count: number;
    expires_at: string | null;
    creator: { id: number; name: string } | null;
};

type Filters = {
    search?: string;
    status: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    forms: Paginated<FormData>;
    filters: Filters;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/forms' },
    { title: 'Forms', href: '/admin/forms' },
];

const STATUS_OPTIONS = [
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
];

const getRowId = (form: FormData) => String(form.id);

const deleteForm = async (form: FormData) => {
    if (
        await confirmAction({
            title: `Delete form "${form.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/forms/${form.slug}`);
    }
};

export default function FormsIndex({ forms, filters }: Props) {
    const { permissions } = usePage().props as {
        permissions: { isStaffOrAbove: boolean };
    };
    const canManage = permissions.isStaffOrAbove;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/forms',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const columns = useMemo<DataTableColumn<FormData>[]>(
        () => [
            {
                id: 'title',
                accessorFn: (form) => form.title,
                header: 'Title',
                enableHiding: false,
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.title}</div>
                        <div className="text-xs text-muted-foreground">
                            /forms/{row.original.slug}
                        </div>
                    </div>
                ),
            },
            {
                id: 'creator',
                header: 'Created by',
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.creator?.name ?? '—'}
                    </span>
                ),
            },
            {
                id: 'responses',
                accessorFn: (form) => form.responses_count,
                header: 'Responses',
                cell: ({ row }) => (
                    <span className="text-muted-foreground tabular-nums">
                        {row.original.responses_count}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (form) => form.is_published,
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
                        {row.original.allows_anonymous && (
                            <Badge variant="outline">Anonymous</Badge>
                        )}
                        {row.original.expires_at &&
                            new Date(row.original.expires_at) < new Date() && (
                                <Badge variant="destructive">Expired</Badge>
                            )}
                    </div>
                ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href={`/admin/forms/${row.original.slug}/responses`}
                                aria-label={`View responses for ${row.original.title}`}
                            >
                                <Eye className="size-3.5" />
                            </Link>
                        </Button>
                        {canManage && (
                            <>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link
                                        href={`/admin/forms/${row.original.slug}/edit`}
                                        aria-label={`Edit ${row.original.title}`}
                                    >
                                        <Pencil className="size-3.5" />
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteForm(row.original)}
                                    className="text-destructive hover:text-destructive"
                                    aria-label={`Delete ${row.original.title}`}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </>
                        )}
                    </div>
                ),
            },
        ],
        [canManage],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Forms" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Forms</h1>
                    {canManage && (
                        <Button asChild>
                            <Link href="/admin/forms/create">
                                <Plus className="mr-1 size-4" />
                                Create Form
                            </Link>
                        </Button>
                    )}
                </div>

                <DataTable
                    data={forms.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-forms"
                    meta={forms.meta}
                    itemLabel="forms"
                    empty={
                        <EmptyState
                            icon={ClipboardList}
                            title="No forms found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search forms..."
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
                                title="Status"
                                options={STATUS_OPTIONS}
                                selected={filters.status}
                                onChange={(status) => applyFilters({ status })}
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
