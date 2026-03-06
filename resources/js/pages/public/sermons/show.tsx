import { Head, Link } from '@inertiajs/react';
import { BookOpen, Calendar, Download, Mic2, Play, Tag } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ResourceData = {
    id: number;
    title: string;
    download_url: string | null;
    file_type: string | null;
    file_size: string | null;
};

type SermonData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    notes: string | null;
    scripture_references: string[] | null;
    sermon_date: string;
    is_current_week: boolean;
    video_url: string | null;
    audio_url: string | null;
    cover_url: string | null;
    speaker: { id: number; name: string; slug: string; title: string | null; bio: string | null; photo_url: string | null } | null;
    series: { id: number; title: string; slug: string } | null;
    resources: ResourceData[];
    tags: string[] | null;
};

type RelatedSermon = {
    id: number;
    title: string;
    slug: string;
    sermon_date: string;
    cover_url: string | null;
    speaker: { name: string } | null;
};

type Props = {
    sermon: { data: SermonData };
    relatedSermons: { data: RelatedSermon[] };
};

function getYouTubeEmbedUrl(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function SermonShow({ sermon: { data: sermon }, relatedSermons }: Props) {
    const embedUrl = sermon.video_url ? getYouTubeEmbedUrl(sermon.video_url) : null;

    return (
        <PublicLayout title={sermon.title}>
            <Head title={sermon.title}>
                <meta name="description" content={sermon.description?.substring(0, 160) ?? ''} />
                <meta property="og:title" content={sermon.title} />
                <meta property="og:description" content={sermon.description?.substring(0, 160) ?? ''} />
                <meta property="og:type" content="article" />
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/sermons" className="hover:text-foreground">
                        Sermons
                    </Link>
                    {sermon.series && (
                        <>
                            <span className="mx-2">/</span>
                            <Link href={`/series/${sermon.series.slug}`} className="hover:text-foreground">
                                {sermon.series.title}
                            </Link>
                        </>
                    )}
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{sermon.title}</span>
                </nav>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Video Player */}
                        {embedUrl && (
                            <div className="mb-8 aspect-video overflow-hidden rounded-lg bg-black">
                                <iframe
                                    src={embedUrl}
                                    title={sermon.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="size-full"
                                />
                            </div>
                        )}

                        {/* Non-YouTube video link */}
                        {sermon.video_url && !embedUrl && (
                            <div className="mb-8">
                                <Button asChild>
                                    <a href={sermon.video_url} target="_blank" rel="noopener noreferrer">
                                        <Play className="mr-2 size-4" />
                                        Watch Video
                                    </a>
                                </Button>
                            </div>
                        )}

                        {/* Cover image when no video */}
                        {!sermon.video_url && sermon.cover_url && (
                            <div className="mb-8 aspect-video overflow-hidden rounded-lg">
                                <img
                                    src={sermon.cover_url}
                                    alt={sermon.title}
                                    className="size-full object-cover"
                                />
                            </div>
                        )}

                        {/* Title & Meta */}
                        <div className="mb-6">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                {sermon.is_current_week && <Badge>This Week</Badge>}
                                {sermon.series && (
                                    <Badge variant="outline">
                                        <Link href={`/series/${sermon.series.slug}`}>
                                            {sermon.series.title}
                                        </Link>
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold">{sermon.title}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                {sermon.speaker && (
                                    <span className="flex items-center gap-1">
                                        <Mic2 className="size-4" />
                                        {sermon.speaker.title ? `${sermon.speaker.title} ` : ''}
                                        {sermon.speaker.name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="size-4" />
                                    {new Date(sermon.sermon_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        {sermon.description && (
                            <div className="mb-8">
                                <p className="text-lg leading-relaxed text-muted-foreground">
                                    {sermon.description}
                                </p>
                            </div>
                        )}

                        {/* Scripture References */}
                        {sermon.scripture_references && sermon.scripture_references.length > 0 && (
                            <div className="mb-8">
                                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                    <BookOpen className="size-5" />
                                    Scripture References
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {sermon.scripture_references.map((ref, i) => (
                                        <Badge key={i} variant="secondary">
                                            {ref}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sermon Notes */}
                        {sermon.notes && (
                            <div className="mb-8">
                                <h2 className="mb-3 text-lg font-semibold">Sermon Notes</h2>
                                <div className="prose prose-sm max-w-none rounded-lg border border-border bg-muted/30 p-6" dangerouslySetInnerHTML={{ __html: sermon.notes }} />
                            </div>
                        )}

                        {/* Tags */}
                        {sermon.tags && sermon.tags.length > 0 && (
                            <div className="mb-8">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Tag className="size-4 text-muted-foreground" />
                                    {sermon.tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Audio Player */}
                        {sermon.audio_url && (
                            <div className="mb-8">
                                <h2 className="mb-3 text-lg font-semibold">Listen</h2>
                                <audio controls className="w-full" preload="metadata">
                                    <source src={sermon.audio_url} />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Speaker Info */}
                        {sermon.speaker && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Speaker</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        {sermon.speaker.photo_url ? (
                                            <img
                                                src={sermon.speaker.photo_url}
                                                alt={sermon.speaker.name}
                                                className="size-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <Mic2 className="size-5" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{sermon.speaker.name}</p>
                                            {sermon.speaker.title && (
                                                <p className="text-sm text-muted-foreground">
                                                    {sermon.speaker.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {sermon.speaker.bio && (
                                        <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                                            {sermon.speaker.bio}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Downloadable Resources */}
                        {sermon.resources && sermon.resources.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Resources</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {sermon.resources.map((resource) => (
                                            <li key={resource.id}>
                                                {resource.download_url ? (
                                                    <a
                                                        href={resource.download_url}
                                                        download
                                                        className="flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-muted"
                                                    >
                                                        <Download className="size-4 text-muted-foreground" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate font-medium">
                                                                {resource.title}
                                                            </p>
                                                            {resource.file_size && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {resource.file_size}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <span className="text-sm">{resource.title}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Related Sermons */}
                        {relatedSermons.data.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Related Sermons</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {relatedSermons.data.map((related) => (
                                            <li key={related.id}>
                                                <Link
                                                    href={`/sermons/${related.slug}`}
                                                    className="group flex gap-3"
                                                >
                                                    {related.cover_url ? (
                                                        <img
                                                            src={related.cover_url}
                                                            alt={related.title}
                                                            className="size-16 flex-shrink-0 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-16 flex-shrink-0 items-center justify-center rounded bg-muted">
                                                            <Play className="size-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                                                            {related.title}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {new Date(related.sermon_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
