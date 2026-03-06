import { Head, Link } from '@inertiajs/react';
import { BookOpen, Calendar } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/shared/pagination';

type SeriesData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    cover_url: string | null;
    start_date: string | null;
    is_active: boolean;
    sermons_count: number;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Props = {
    series: PaginatedData<SeriesData>;
};

export default function SeriesIndex({ series }: Props) {
    return (
        <PublicLayout title="Sermon Series">
            <Head title="Sermon Series" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Sermon Series</h1>
                    <p className="mt-2 text-muted-foreground">
                        Explore our teaching series for in-depth study on various topics.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {series.data.map((s) => (
                        <Link key={s.id} href={`/series/${s.slug}`} className="group">
                            <Card className="h-full transition-shadow group-hover:shadow-lg">
                                {s.cover_url && (
                                    <div className="aspect-video overflow-hidden rounded-t-lg">
                                        <img
                                            src={s.cover_url}
                                            alt={s.title}
                                            className="size-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        {s.is_active && <Badge>Active</Badge>}
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg">{s.title}</CardTitle>
                                    {s.description && (
                                        <CardDescription className="line-clamp-2">
                                            {s.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="size-3.5" />
                                            {s.sermons_count} {s.sermons_count === 1 ? 'sermon' : 'sermons'}
                                        </span>
                                        {s.start_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-3.5" />
                                                {new Date(s.start_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {series.data.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        No sermon series found. Check back soon!
                    </div>
                )}

                {series.last_page > 1 && (
                    <div className="mt-8">
                        <Pagination meta={series} />
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
