import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar } from 'lucide-react';
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
import type { BreadcrumbItem } from '@/types';
import type { Option, Paginated } from '@/types/members';

type Registration = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    status_label: string;
    is_guest: boolean;
    registered_at: string;
};

type EventData = {
    id: number;
    title: string;
};

type Filters = {
    status: string[];
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    event: { data: EventData };
    registrations: Paginated<Registration>;
    filters: Filters;
    statuses: Option[];
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    registered: 'default',
    waitlisted: 'secondary',
    cancelled: 'destructive',
};

/** Column ids match the sort keys EventController::registrations accepts. */
const columns: DataTableColumn<Registration>[] = [
    {
        id: 'name',
        header: 'Name',
        accessorFn: (reg) => reg.name,
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
        ),
    },
    {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.email}</span>
        ),
    },
    {
        id: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.phone ?? '-'}
            </span>
        ),
    },
    {
        id: 'status',
        header: 'Status',
        accessorFn: (reg) => reg.status,
        cell: ({ row }) => (
            <Badge variant={statusVariant[row.original.status] ?? 'secondary'}>
                {row.original.status_label}
            </Badge>
        ),
    },
    {
        id: 'registered_at',
        header: 'Registered',
        accessorFn: (reg) => reg.registered_at,
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {new Date(row.original.registered_at).toLocaleString(
                    undefined,
                    { dateStyle: 'medium', timeStyle: 'short' },
                )}
            </span>
        ),
    },
    {
        id: 'type',
        header: 'Type',
        cell: ({ row }) =>
            row.original.is_guest ? (
                <Badge variant="outline">Guest</Badge>
            ) : (
                <Badge variant="secondary">Member</Badge>
            ),
    },
];

export default function EventRegistrations({
    event: { data: event },
    registrations,
    filters,
    statuses,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/events' },
        { title: 'Events', href: '/admin/events' },
        {
            title: 'Registrations',
            href: `/admin/events/${event.id}/registrations`,
        },
    ];

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            `/admin/events/${event.id}/registrations`,
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Registrations: ${event.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/events">
                                <ArrowLeft className="mr-1 size-4" />
                                Back
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">
                            Registrations for {event.title}
                        </h1>
                    </div>
                    <ExportDropdown
                        baseUrl={`/admin/exports/events/${event.id}/registrations`}
                    />
                </div>

                <DataTable
                    data={registrations.data}
                    columns={columns}
                    getRowId={(reg) => String(reg.id)}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-event-registrations"
                    meta={registrations.meta}
                    itemLabel="registrations"
                    empty={
                        <EmptyState
                            icon={Calendar}
                            title="No registrations yet"
                        />
                    }
                    toolbar={
                        <FacetedFilter
                            title="Status"
                            options={statuses}
                            selected={filters.status}
                            onChange={(status) => applyFilters({ status })}
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
