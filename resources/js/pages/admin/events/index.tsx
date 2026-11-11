import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Pencil, Plus, Trash2, Users } from 'lucide-react';
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

type EventData = {
    id: number;
    title: string;
    slug: string;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    is_published: boolean;
    registrations_count: number;
    category: { id: number; name: string } | null;
};

type Filters = {
    search?: string;
    category_id: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    events: Paginated<EventData>;
    filters: Filters;
    categories: Array<{ id: number; name: string }>;
    isStaffOrAbove: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/events' },
    { title: 'Events', href: '/admin/events' },
];

function formatDate(dateStr: string, isAllDay: boolean): string {
    const d = new Date(dateStr);
    if (isAllDay) {
        return d.toLocaleDateString();
    }
    return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

const deleteEvent = async (event: EventData) => {
    if (
        await confirmAction({
            title: `Delete event "${event.title}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/events/${event.id}`);
    }
};

/** Column ids match the sort keys EventController accepts. */
const columns: DataTableColumn<EventData>[] = [
    {
        id: 'title',
        header: 'Title',
        accessorFn: (event) => event.title,
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-medium">{row.original.title}</span>
        ),
    },
    {
        id: 'starts_at',
        header: 'Date',
        accessorFn: (event) => event.starts_at,
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {formatDate(row.original.starts_at, row.original.is_all_day)}
            </span>
        ),
    },
    {
        id: 'location',
        header: 'Location',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.location ?? '-'}
            </span>
        ),
    },
    {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.category?.name ?? '-'}
            </span>
        ),
    },
    {
        id: 'registrations',
        header: 'Registrations',
        accessorFn: (event) => event.registrations_count,
        cell: ({ row }) => (
            <Link
                href={`/admin/events/${row.original.id}/registrations`}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
                <Users className="size-3.5" />
                {row.original.registrations_count}
            </Link>
        ),
    },
    {
        id: 'status',
        header: 'Status',
        accessorFn: (event) => event.is_published,
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
                    <Link
                        href={`/admin/events/${row.original.id}/edit`}
                        aria-label={`Edit ${row.original.title}`}
                    >
                        <Pencil className="size-3.5" />
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEvent(row.original)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${row.original.title}`}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        ),
    },
];

export default function EventsIndex({ events, filters, categories }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/events',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Events" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Events</h1>
                    <Button asChild>
                        <Link href="/admin/events/create">
                            <Plus className="mr-1 size-4" />
                            Add Event
                        </Link>
                    </Button>
                </div>

                <DataTable
                    data={events.data}
                    columns={columns}
                    getRowId={(event) => String(event.id)}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-events"
                    defaultHidden={['category']}
                    meta={events.meta}
                    itemLabel="events"
                    empty={
                        <EmptyState
                            icon={Calendar}
                            title="No events found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <>
                            <Input
                                placeholder="Search by title or location..."
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
