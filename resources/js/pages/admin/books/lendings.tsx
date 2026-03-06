import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

type LendingData = {
    id: number;
    book: { id: number; title: string; slug: string; author: string };
    user: { id: number; name: string; email: string };
    lender: { id: number; name: string };
    borrowed_at: string;
    due_at: string;
    returned_at: string | null;
    is_returned: boolean;
    is_overdue: boolean;
    notes: string | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    lendings: PaginatedData<LendingData>;
    filters: { status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/books' },
    { title: 'Books', href: '/admin/books' },
    { title: 'Lendings', href: '/admin/books-lendings' },
];

export default function BookLendings({ lendings, filters }: Props) {
    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/admin/books-lendings', newFilters, { preserveState: true, replace: true });
    };

    const handleReturn = (lending: LendingData) => {
        if (confirm(`Mark "${lending.book.title}" as returned from ${lending.user.name}?`)) {
            router.patch(`/admin/lendings/${lending.id}/return`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Book Lendings" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/books"><ArrowLeft className="size-4" /></Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Lendings</h1>
                    </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Select onValueChange={(v) => handleFilter('status', v)} defaultValue={filters.status ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Book</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Borrower</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Borrowed</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {lendings.data.map((lending) => (
                                <tr key={lending.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{lending.book.title}</div>
                                        <div className="text-xs text-muted-foreground">{lending.book.author}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>{lending.user.name}</div>
                                        <div className="text-xs text-muted-foreground">{lending.user.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(lending.borrowed_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(lending.due_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {lending.is_returned ? (
                                            <Badge variant="secondary">Returned</Badge>
                                        ) : lending.is_overdue ? (
                                            <Badge variant="destructive">Overdue</Badge>
                                        ) : (
                                            <Badge>Active</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {!lending.is_returned && (
                                            <Button variant="outline" size="sm" onClick={() => handleReturn(lending)}>
                                                Return
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {lendings.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No lendings found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
