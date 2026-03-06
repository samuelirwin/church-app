import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

type Speaker = {
    id: number;
    name: string;
    slug: string;
    title: string | null;
    sermons_count?: number;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    speakers: PaginatedData<Speaker>;
    filters: { search?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/speakers' },
    { title: 'Speakers', href: '/admin/speakers' },
];

export default function SpeakersIndex({ speakers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/speakers', { search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = (speaker: Speaker) => {
        if (confirm(`Delete speaker "${speaker.name}"?`)) {
            router.delete(`/admin/speakers/${speaker.id}`);
        }
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

                <Input
                    placeholder="Search speakers..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-xs"
                />

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sermons</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {speakers.data.map((speaker) => (
                                <tr key={speaker.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{speaker.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{speaker.title ?? '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{speaker.sermons_count ?? 0}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/speakers/${speaker.id}/edit`}>
                                                    <Pencil className="size-3.5" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(speaker)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {speakers.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        No speakers found.
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
