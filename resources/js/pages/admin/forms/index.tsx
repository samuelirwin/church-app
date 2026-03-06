import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

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

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    forms: PaginatedData<FormData>;
    filters: { search?: string; status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/forms' },
    { title: 'Forms', href: '/admin/forms' },
];

export default function FormsIndex({ forms, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/forms', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/forms', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = (form: FormData) => {
        if (confirm(`Delete form "${form.title}"?`)) {
            router.delete(`/admin/forms/${form.slug}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Forms" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Forms</h1>
                    <Button asChild>
                        <Link href="/admin/forms/create">
                            <Plus className="mr-1 size-4" />
                            Create Form
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search forms..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select onValueChange={(v) => handleFilter('status', v)} defaultValue={filters.status ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Creator</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responses</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {forms.data.map((form) => (
                                <tr key={form.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{form.title}</div>
                                        <div className="text-xs text-muted-foreground">/forms/{form.slug}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{form.creator?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{form.responses_count}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <Badge variant={form.is_published ? 'default' : 'secondary'}>
                                                {form.is_published ? 'Published' : 'Draft'}
                                            </Badge>
                                            {form.allows_anonymous && <Badge variant="outline">Anonymous</Badge>}
                                            {form.expires_at && new Date(form.expires_at) < new Date() && (
                                                <Badge variant="destructive">Expired</Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/forms/${form.slug}/responses`}>
                                                    <Eye className="size-3.5" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/forms/${form.slug}/edit`}>
                                                    <Pencil className="size-3.5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(form)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {forms.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No forms found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
