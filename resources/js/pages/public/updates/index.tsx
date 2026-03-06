import { Head, Link, router } from '@inertiajs/react';
import { Calendar, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PostData = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_url: string | null;
    is_featured: boolean;
    author: { name: string } | null;
    category: { name: string; slug: string } | null;
    published_at: string;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    posts: PaginatedData<PostData>;
    filters: { search?: string; category?: string };
    categories: Array<{ id: number; name: string; slug: string }>;
};

export default function UpdatesIndex({ posts, filters, categories }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/updates', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleCategoryFilter = (value: string) => {
        const newFilters = { ...filters, category: value === 'all' ? undefined : value };
        router.get('/updates', newFilters, { preserveState: true, replace: true });
    };

    return (
        <PublicLayout title="Updates">
            <Head title="Updates" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Updates</h1>
                    <p className="mt-2 text-muted-foreground">
                        Stay informed with the latest news and updates from our church.
                    </p>
                </div>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                    <Input
                        placeholder="Search updates..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="max-w-md"
                    />
                    {categories.length > 0 && (
                        <Select onValueChange={handleCategoryFilter} defaultValue={filters.category ?? 'all'}>
                            <SelectTrigger className="sm:w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.slug}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.data.map((post) => (
                        <Link key={post.id} href={`/updates/${post.slug}`} className="group">
                            <Card className="h-full transition-shadow group-hover:shadow-lg">
                                {post.cover_url && (
                                    <div className="aspect-video overflow-hidden rounded-t-lg">
                                        <img
                                            src={post.cover_url}
                                            alt={post.title}
                                            className="size-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        {post.is_featured && <Badge>Featured</Badge>}
                                        {post.category && (
                                            <Badge variant="outline">{post.category.name}</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                                    {post.excerpt && (
                                        <CardDescription className="line-clamp-2">
                                            {post.excerpt}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {post.author && (
                                            <span className="flex items-center gap-1">
                                                <UserIcon className="size-3.5" />
                                                {post.author.name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="size-3.5" />
                                            {new Date(post.published_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {posts.data.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        No updates found. Check back soon!
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
