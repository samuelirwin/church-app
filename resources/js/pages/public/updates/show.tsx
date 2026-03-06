import { Head, Link } from '@inertiajs/react';
import { Calendar, Tag, User as UserIcon } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { stripHtml } from '@/lib/utils';

type PostData = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    body: string;
    cover_url: string | null;
    is_featured: boolean;
    author: { id: number; name: string } | null;
    category: { id: number; name: string; slug: string } | null;
    tags: string[] | null;
    published_at: string;
};

type RelatedPost = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_url: string | null;
    published_at: string;
    author: { name: string } | null;
};

type Props = {
    post: { data: PostData };
    relatedPosts: { data: RelatedPost[] };
};

export default function UpdateShow({ post: { data: post }, relatedPosts }: Props) {
    return (
        <PublicLayout title={post.title}>
            <Head title={post.title}>
                <meta name="description" content={post.excerpt ? stripHtml(post.excerpt).substring(0, 160) : ''} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt ? stripHtml(post.excerpt).substring(0, 160) : ''} />
                <meta property="og:type" content="article" />
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/updates" className="hover:text-foreground">
                        Updates
                    </Link>
                    {post.category && (
                        <>
                            <span className="mx-2">/</span>
                            <span className="hover:text-foreground">{post.category.name}</span>
                        </>
                    )}
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{post.title}</span>
                </nav>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        {post.cover_url && (
                            <div className="mb-8 aspect-video overflow-hidden rounded-lg">
                                <img
                                    src={post.cover_url}
                                    alt={post.title}
                                    className="size-full object-cover"
                                />
                            </div>
                        )}

                        <div className="mb-6">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                {post.is_featured && <Badge>Featured</Badge>}
                                {post.category && (
                                    <Badge variant="outline">{post.category.name}</Badge>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold">{post.title}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                {post.author && (
                                    <span className="flex items-center gap-1">
                                        <UserIcon className="size-4" />
                                        {post.author.name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="size-4" />
                                    {new Date(post.published_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>

                        {post.excerpt && (
                            <div className="mb-8 prose prose-sm max-w-none text-muted-foreground italic" dangerouslySetInnerHTML={{ __html: post.excerpt }} />
                        )}

                        <div className="prose prose-sm max-w-none mb-8" dangerouslySetInnerHTML={{ __html: post.body }} />

                        {post.tags && post.tags.length > 0 && (
                            <div className="mb-8">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Tag className="size-4 text-muted-foreground" />
                                    {post.tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {relatedPosts.data.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Related Updates</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {relatedPosts.data.map((related) => (
                                            <li key={related.id}>
                                                <Link
                                                    href={`/updates/${related.slug}`}
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
                                                            <Calendar className="size-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                                                            {related.title}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {new Date(related.published_at).toLocaleDateString()}
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
