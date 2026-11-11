import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, House, Plus } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { AvatarStack } from '@/components/shared/avatar-stack';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Household, Paginated } from '@/types/members';

type Props = {
    households: Paginated<Household>;
    filters: { search?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/members' },
    { title: 'Members', href: '/admin/members' },
    { title: 'Households', href: '/admin/households' },
];

export default function HouseholdsIndex({ households, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [showCreate, setShowCreate] = useState(false);
    const createForm = useForm({ name: '' });

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/admin/households',
            { search: value || undefined },
            { preserveState: true, replace: true },
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

                <Input
                    placeholder="Search households..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="sm:max-w-xs"
                />

                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Head
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    People
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    City
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {households.data.map((household) => (
                                <tr
                                    key={household.id}
                                    className="hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {household.name}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {household.head?.full_name ?? '-'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <AvatarStack
                                                people={(
                                                    household.members ?? []
                                                ).map((m) => ({
                                                    id: m.id,
                                                    name: m.full_name,
                                                    photo_url: m.photo_url,
                                                }))}
                                            />
                                            <span>
                                                {household.members_count}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {household.city ?? '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/admin/households/${household.id}`}
                                            >
                                                <Eye className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {households.data.length === 0 && (
                                <TableEmptyRow
                                    colSpan={5}
                                    icon={House}
                                    title="No households found"
                                    description="Try a different search or filter."
                                />
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={households.meta} itemLabel="households" />
            </div>
        </AppLayout>
    );
}
