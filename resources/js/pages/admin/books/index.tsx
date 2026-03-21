import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

type BookData = {
    id: number;
    title: string;
    slug: string;
    author: string;
    total_copies: number;
    available_copies: number;
    is_available: boolean;
    is_published: boolean;
    category: { id: number; name: string } | null;
    location: string | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    books: PaginatedData<BookData>;
    filters: { search?: string; category_id?: string };
    categories: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/books' },
    { title: 'Books', href: '/admin/books' },
];

export default function BooksIndex({ books, filters, categories }: Props) {
    const { permissions } = usePage().props as { permissions: { isStaffOrAbove: boolean } };
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/admin/books', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/books', newFilters, { preserveState: true, replace: true });
    };

    const handleDelete = (book: BookData) => {
        if (confirm(`Delete book "${book.title}"?`)) {
            router.delete(`/admin/books/${book.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Books" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Library</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/books-lendings">Lendings</Link>
                        </Button>
                        {permissions.isStaffOrAbove && (
                            <Button asChild>
                                <Link href="/admin/books/create">
                                    <Plus className="mr-1 size-4" />
                                    Add Book
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search by title or author..."
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
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Author</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Copies</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {books.data.map((book) => (
                                <tr key={book.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{book.title}</div>
                                        {book.location && <div className="text-xs text-muted-foreground">{book.location}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{book.author}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{book.available_copies}/{book.total_copies}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <Badge variant={book.is_published ? 'default' : 'secondary'}>
                                                {book.is_published ? 'Published' : 'Draft'}
                                            </Badge>
                                            {!book.is_available && <Badge variant="destructive">Unavailable</Badge>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {permissions.isStaffOrAbove && (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/books/${book.id}/edit`}><Pencil className="size-3.5" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(book)} className="text-destructive hover:text-destructive">
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {books.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No books found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
