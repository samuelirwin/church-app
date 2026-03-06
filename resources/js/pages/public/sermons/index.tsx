import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Mic2 } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type SermonData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    sermon_date: string;
    is_current_week: boolean;
    cover_url: string | null;
    speaker: { name: string } | null;
    series: { title: string; slug: string } | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    sermons: PaginatedData<SermonData>;
    filters: { search?: string };
};

export default function SermonsIndex({ sermons, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/sermons', { search: value || undefined }, { preserveState: true, replace: true });
    };

    return (
        <PublicLayout title="Sermons">
            <Head title="Sermons" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Sermons</h1>
                    <p className="mt-2 text-muted-foreground">
                        Watch and listen to our weekly sermons and teaching series.
                    </p>
                </div>

                <div className="mb-8">
                    <Input
                        placeholder="Search sermons by title or speaker..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="max-w-md"
                    />
                </div>

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
                                    <div className="flex items-center gap-2">
                                        {sermon.is_current_week && <Badge>This Week</Badge>}
                                        {sermon.series && (
                                            <Badge variant="outline">{sermon.series.title}</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg">{sermon.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {sermon.description}
                                    </CardDescription>
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
                        No sermons found. Check back soon!
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
