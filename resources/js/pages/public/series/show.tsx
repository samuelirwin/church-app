import { Head, Link } from '@inertiajs/react';
import { Calendar, Mic2 } from 'lucide-react';
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
    end_date: string | null;
    is_active: boolean;
    sermons_count: number;
};

type SermonData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    sermon_date: string;
    is_current_week: boolean;
    cover_url: string | null;
    speaker: { name: string } | null;
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
    series: { data: SeriesData };
    sermons: PaginatedData<SermonData>;
};

export default function SeriesShow({ series: { data: series }, sermons }: Props) {
    return (
        <PublicLayout title={series.title}>
            <Head title={series.title} />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/sermons" className="hover:text-foreground">
                        Sermons
                    </Link>
                    <span className="mx-2">/</span>
                    <Link href="/series" className="hover:text-foreground">
                        Series
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{series.title}</span>
                </nav>

                {/* Series Header */}
                <div className="mb-8">
                    {series.cover_url && (
                        <div className="mb-6 aspect-[3/1] max-h-64 overflow-hidden rounded-lg">
                            <img
                                src={series.cover_url}
                                alt={series.title}
                                className="size-full object-cover"
                            />
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                        {series.is_active && <Badge>Active Series</Badge>}
                        {series.sermons_count > 0 && (
                            <Badge variant="outline">
                                {series.sermons_count} {series.sermons_count === 1 ? 'sermon' : 'sermons'}
                            </Badge>
                        )}
                    </div>

                    <h1 className="mt-3 text-3xl font-bold">{series.title}</h1>

                    {series.description && (
                        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
                            {series.description}
                        </p>
                    )}

                    {(series.start_date || series.end_date) && (
                        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="size-4" />
                            {series.start_date && new Date(series.start_date).toLocaleDateString()}
                            {series.end_date && (
                                <>
                                    <span className="mx-1">—</span>
                                    {new Date(series.end_date).toLocaleDateString()}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Sermons in Series */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sermons.data.map((sermon) => (
                        <Link key={sermon.id} href={`/sermons/${sermon.slug}`} className="group">
                            <Card className="h-full transition-shadow group-hover:shadow-lg">
                                {sermon.cover_url && (
                                    <div className="aspect-video overflow-hidden rounded-t-lg">
                                        <img
                                            src={sermon.cover_url}
                                            alt={sermon.title}
                                            className="size-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    {sermon.is_current_week && (
                                        <div>
                                            <Badge>This Week</Badge>
                                        </div>
                                    )}
                                    <CardTitle className="line-clamp-2 text-lg">{sermon.title}</CardTitle>
                                    {sermon.description && (
                                        <CardDescription className="line-clamp-2">
                                            {sermon.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {sermon.speaker && (
                                            <span className="flex items-center gap-1">
                                                <Mic2 className="size-3.5" />
                                                {sermon.speaker.name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="size-3.5" />
                                            {new Date(sermon.sermon_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {sermons.data.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        No sermons in this series yet. Check back soon!
                    </div>
                )}

                {sermons.last_page > 1 && (
                    <div className="mt-8">
                        <Pagination meta={sermons} />
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
