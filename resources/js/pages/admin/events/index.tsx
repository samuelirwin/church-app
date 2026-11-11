import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';

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

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    events: PaginatedData<EventData>;
    filters: { search?: string; category_id?: string };
    categories: Array<{ id: number; name: string }>;
    isStaffOrAbove: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/events' },
    { title: 'Events', href: '/admin/events' },
];

function formatDate(dateStr: string, isAllDay: boolean): string {
    const d = new Date(dateStr);
    if (isAllDay) return d.toLocaleDateString();
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function EventsIndex({ events, filters, categories, isStaffOrAbove }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/events', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/events', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = async (event: EventData) => {
        if (await confirmAction({ title: `Delete event "${event.title}"?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/events/${event.id}`);
        }
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

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search by title or location..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select onValueChange={(v) => handleFilter('category_id', v)} defaultValue={filters.category_id ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registrations</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {events.data.map((event) => (
                                <tr key={event.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{event.title}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(event.starts_at, event.is_all_day)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{event.location ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/events/${event.id}/registrations`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                            <Users className="size-3.5" />
                                            {event.registrations_count}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={event.is_published ? 'default' : 'secondary'}>
                                            {event.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/events/${event.id}/edit`}><Pencil className="size-3.5" /></Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(event)} className="text-destructive hover:text-destructive">
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {events.data.length === 0 && (
                                <TableEmptyRow colSpan={6} icon={Calendar} title="No events found" description="Try a different search or filter." />
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
