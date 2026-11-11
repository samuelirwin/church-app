import { Head, Link, router, usePage } from '@inertiajs/react';
import { Mic2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';

type SermonData = {
    id: number;
    title: string;
    slug: string;
    sermon_date: string;
    is_published: boolean;
    is_current_week: boolean;
    speaker: { id: number; name: string } | null;
    series: { id: number; title: string } | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    sermons: PaginatedData<SermonData>;
    filters: { search?: string; series_id?: string; speaker_id?: string };
    speakers: Array<{ id: number; name: string }>;
    seriesList: Array<{ id: number; title: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/sermons' },
    { title: 'Sermons', href: '/admin/sermons' },
];

export default function SermonsIndex({ sermons, filters, speakers, seriesList }: Props) {
    const { permissions } = usePage().props as { permissions: { isAdmin: boolean; isStaffOrAbove: boolean; isLeaderOrAbove: boolean; isDeacon: boolean } };
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/sermons', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/sermons', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = async (sermon: SermonData) => {
        if (await confirmAction({ title: `Delete sermon "${sermon.title}"?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/sermons/${sermon.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Sermons" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Sermons</h1>
                    {permissions.isStaffOrAbove && (
                        <Button asChild>
                            <Link href="/admin/sermons/create">
                                <Plus className="mr-1 size-4" />
                                Add Sermon
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search sermons..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select onValueChange={(v) => handleFilter('speaker_id', v)} defaultValue={filters.speaker_id ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Speaker" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Speakers</SelectItem>
                            {speakers.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={(v) => handleFilter('series_id', v)} defaultValue={filters.series_id ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Series" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Series</SelectItem>
                            {seriesList.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Speaker</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {sermons.data.map((sermon) => (
                                <tr key={sermon.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{sermon.title}</div>
                                        {sermon.series && (
                                            <div className="text-xs text-muted-foreground">{sermon.series.title}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{sermon.speaker?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(sermon.sermon_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <Badge variant={sermon.is_published ? 'default' : 'secondary'}>
                                                {sermon.is_published ? 'Published' : 'Draft'}
                                            </Badge>
                                            {sermon.is_current_week && <Badge variant="outline">This Week</Badge>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {permissions.isStaffOrAbove && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/sermons/${sermon.id}/edit`}>
                                                        <Pencil className="size-3.5" />
                                                    </Link>
                                                </Button>
                                            )}
                                            {permissions.isStaffOrAbove && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(sermon)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sermons.data.length === 0 && (
                                <TableEmptyRow colSpan={5} icon={Mic2} title="No sermons found" description="Try a different search or filter." />
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
