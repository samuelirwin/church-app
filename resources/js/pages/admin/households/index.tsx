import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, House, Plus } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { AvatarStack } from '@/components/shared/avatar-stack';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Household, Paginated } from '@/types/members';

type Filters = {
    search?: string | null;
    sort?: string | null;
    direction?: SortDirection | null;
};

type Props = {
    households: Paginated<Household>;
    filters: Filters;
};

const getRowId = (household: Household) => String(household.id);

/** Column ids match the sort keys HouseholdController accepts. */
const columns: DataTableColumn<Household>[] = [
    {
        id: 'name',
        accessorFn: (household) => household.name,
        header: 'Name',
        enableHiding: false,
        cell: ({ row }) => (
            <Link
                href={`/admin/households/${row.original.id}`}
                className="font-medium hover:underline"
            >
                {row.original.name}
            </Link>
        ),
    },
    {
        id: 'head',
        header: 'Head',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.head?.full_name ?? '-'}
            </span>
        ),
    },
    {
        id: 'people',
        accessorFn: (household) => household.members_count,
        header: 'People',
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-muted-foreground">
                <AvatarStack
                    people={(row.original.members ?? []).map((m) => ({
                        id: m.id,
                        name: m.full_name,
                        photo_url: m.photo_url,
                    }))}
                />
                <span>{row.original.members_count}</span>
            </div>
        ),
    },
    {
        id: 'city',
        accessorFn: (household) => household.city,
        header: 'City',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.city ?? '-'}
            </span>
        ),
    },
    {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                    <Link
                        href={`/admin/households/${row.original.id}`}
                        aria-label={`View ${row.original.name}`}
                    >
                        <Eye className="size-3.5" />
                    </Link>
                </Button>
            </div>
        ),
    },
];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/members' },
    { title: 'Members', href: '/admin/members' },
    { title: 'Households', href: '/admin/households' },
];

export default function HouseholdsIndex({ households, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showCreate, setShowCreate] = useState(false);
    const createForm = useForm({ name: '' });

    // Search and sorting live in the URL; the server does the work.
    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/households',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.data.name.trim()) {
            createForm.setError('name', 'The household name is required.');
            return;
        }
        createForm.post('/admin/households');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Households" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin/members"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            &larr; Back to Members
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold">Households</h1>
                    </div>
                    <Button onClick={() => setShowCreate((v) => !v)}>
                        <Plus className="mr-1 size-4" />
                        Add Household
                    </Button>
                </div>

                {showCreate && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                New Household
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleCreate}
                                className="flex flex-col gap-4 sm:flex-row sm:items-start"
                                noValidate
                            >
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={createForm.data.name}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. The Tan Family"
                                    />
                                    <InputError
                                        message={createForm.errors.name}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="sm:mt-7"
                                    disabled={createForm.processing}
                                >
                                    Create
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <DataTable
                    data={households.data}
                    columns={columns}
                    getRowId={getRowId}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-households"
                    meta={households.meta}
                    itemLabel="households"
                    empty={
                        <EmptyState
                            icon={House}
                            title="No households found"
                            description="Try a different search or filter."
                        />
                    }
                    toolbar={
                        <Input
                            placeholder="Search households..."
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
