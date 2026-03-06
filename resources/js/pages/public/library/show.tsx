import { Head, Link } from '@inertiajs/react';
import { BookOpen, MapPin } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { stripHtml } from '@/lib/utils';

type BookData = {
    id: number;
    title: string;
    slug: string;
    author: string;
    isbn: string | null;
    publisher: string | null;
    description: string | null;
    cover_url: string | null;
    category: { id: number; name: string } | null;
    total_copies: number;
    available_copies: number;
    is_available: boolean;
    location: string | null;
};

type Props = {
    book: { data: BookData };
};

export default function LibraryShow({ book: { data: book } }: Props) {
    return (
        <PublicLayout title={book.title}>
            <Head title={book.title}>
                <meta name="description" content={book.description ? stripHtml(book.description).substring(0, 160) : ''} />
                <meta property="og:title" content={book.title} />
                <meta property="og:description" content={book.description ? stripHtml(book.description).substring(0, 160) : ''} />
                <meta property="og:type" content="article" />
            </Head>

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/library" className="hover:text-foreground">Library</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{book.title}</span>
                </nav>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-1">
                        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {book.cover_url ? (
                                <img src={book.cover_url} alt={book.title} className="size-full object-cover" />
                            ) : (
                                <BookOpen className="size-16 text-muted-foreground/50" />
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="mb-4 flex flex-wrap gap-2">
                            {book.category && <Badge variant="outline">{book.category.name}</Badge>}
                            <Badge variant={book.is_available ? 'default' : 'destructive'}>
                                {book.is_available ? `${book.available_copies} of ${book.total_copies} available` : 'All copies lent out'}
                            </Badge>
                        </div>

                        <h1 className="text-3xl font-bold">{book.title}</h1>
                        <p className="mt-1 text-lg text-muted-foreground">by {book.author}</p>

                        <Card className="mt-6">
                            <CardContent className="p-4">
                                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                                    {book.publisher && (
                                        <div>
                                            <dt className="font-medium text-muted-foreground">Publisher</dt>
                                            <dd>{book.publisher}</dd>
                                        </div>
                                    )}
                                    {book.isbn && (
                                        <div>
                                            <dt className="font-medium text-muted-foreground">ISBN</dt>
                                            <dd>{book.isbn}</dd>
                                        </div>
                                    )}
                                    {book.location && (
                                        <div>
                                            <dt className="font-medium text-muted-foreground">Location</dt>
                                            <dd className="flex items-center gap-1">
                                                <MapPin className="size-3.5" />
                                                {book.location}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>

                        {book.description && (
                            <div className="mt-6">
                                <h2 className="mb-3 text-lg font-semibold">About this Book</h2>
                                <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: book.description }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
