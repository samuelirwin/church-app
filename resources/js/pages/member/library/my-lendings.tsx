import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';

type LendingData = {
    id: number;
    book: { id: number; title: string; slug: string; author: string };
    lender: { id: number; name: string };
    borrowed_at: string;
    due_at: string;
    returned_at: string | null;
    is_returned: boolean;
    is_overdue: boolean;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    lendings: PaginatedData<LendingData>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Library', href: '/library' },
    { title: 'My Lendings', href: '/library/my-lendings' },
];

export default function MyLendings({ lendings }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Lendings" />

            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-bold">My Borrowed Books</h1>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Book</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Borrowed</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {lendings.data.map((lending) => (
                                <tr key={lending.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <Link href={`/library/${lending.book.slug}`} className="font-medium hover:text-primary">
                                            {lending.book.title}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">{lending.book.author}</div>
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
                                </tr>
                            ))}
                            {lendings.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        You haven't borrowed any books yet.
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
