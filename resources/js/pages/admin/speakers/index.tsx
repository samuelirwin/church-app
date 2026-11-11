import { Head, Link, router } from '@inertiajs/react';
import { Mic2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';
import type { Paginated } from '@/types/members';

type Speaker = {
    id: number;
    name: string;
    slug: string;
    title: string | null;
    sermons_count?: number;
};

type Filters = {
    search?: string;
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    speakers: Paginated<Speaker>;
    filters: Filters;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/speakers' },
    { title: 'Speakers', href: '/admin/speakers' },
];

const getRowId = (speaker: Speaker) => String(speaker.id);

const deleteSpeaker = async (speaker: Speaker) => {
    if (
        await confirmAction({
            title: `Delete speaker "${speaker.name}"?`,
            confirmLabel: 'Delete',
            destructive: true,
        })
    ) {
        router.delete(`/admin/speakers/${speaker.id}`);
    }
};

const columns: DataTableColumn<Speaker>[] = [
    {
        id: 'name',
        accessorFn: (speaker) => speaker.name,
        header: 'Name',
        enableHiding: false,
        cell: ({ row }) => (
            <span className="font-medium">{row.original.name}</span>
        ),
    },
    {
        id: 'title',
        accessorFn: (speaker) => speaker.title,
        header: 'Title',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.title ?? '—'}
            </span>
        ),
    },
    {
        id: 'sermons',
        accessorFn: (speaker) => speaker.sermons_count ?? 0,
        header: 'Sermons',
        cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
                {row.original.sermons_count ?? 0}
            </span>
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
                        href={`/admin/speakers/${row.original.id}/edit`}
                        aria-label={`Edit ${row.original.name}`}
                    >
                        <Pencil className="size-3.5" />
                    </Link>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSpeaker(row.original)}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${row.original.name}`}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        ),
    },
];

export default function SpeakersIndex({ speakers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/speakers',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Speakers" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Speakers</h1>
                    <Button asChild>
                        <Link href="/admin/speakers/create">
                            <Plus className="mr-1 size-4" />
                            Add Speaker
                        </Link>
                    </Button>
                </div>

                <DataTable
                    data={speakers.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-speakers"
                    meta={speakers.meta}
                    itemLabel="speakers"
                    empty={
                        <EmptyState
                            icon={Mic2}
                            title="No speakers found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <Input
                            placeholder="Search speakers..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters({
                                    search: e.target.value || undefined,
                                });
                            }}
                            className="h-9 sm:max-w-xs"
                        />
                    }
                />
            </div>
        </AppLayout>
    );
}
