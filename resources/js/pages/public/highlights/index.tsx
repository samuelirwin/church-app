import { Head } from '@inertiajs/react';
import { Calendar, Megaphone } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type HighlightData = {
    id: number;
    title: string;
    slug: string;
    body: string;
    cover_url: string | null;
    type: string;
    type_label: string;
    priority: number;
    is_active: boolean;
    starts_at: string;
    ends_at: string | null;
    author: { name: string } | null;
};

type Props = {
    highlights: { data: HighlightData[] };
};

export default function HighlightsIndex({ highlights }: Props) {
    return (
        <PublicLayout title="Highlights">
            <Head title="Highlights" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Highlights</h1>
                    <p className="mt-2 text-muted-foreground">
                        Important announcements, events, campaigns, and testimonies.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {highlights.data.map((highlight) => (
                        <Card key={highlight.id} className="h-full">
                            {highlight.cover_url && (
                                <div className="aspect-video overflow-hidden rounded-t-lg">
                                    <img
                                        src={highlight.cover_url}
                                        alt={highlight.title}
                                        className="size-full object-cover"
                                    />
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{highlight.type_label}</Badge>
                                    <Badge variant="default">Active</Badge>
                                </div>
                                <CardTitle className="line-clamp-2 text-lg">{highlight.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                                    {highlight.body}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="size-3.5" />
                                        {new Date(highlight.starts_at).toLocaleDateString()}
                                        {highlight.ends_at && (
                                            <> — {new Date(highlight.ends_at).toLocaleDateString()}</>
                                        )}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {highlights.data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Megaphone className="mb-3 size-10" />
                        <p>No active highlights right now. Check back soon!</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
