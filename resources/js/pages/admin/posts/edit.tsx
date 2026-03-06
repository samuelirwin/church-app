import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import { ImageUploader } from '@/components/admin/image-uploader';
import InputError from '@/components/input-error';
import { TagInput } from '@/components/tag-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichEditor } from '@/components/admin/rich-editor';
import type { BreadcrumbItem } from '@/types';
import type { MediaItem } from '@/types/media';

type PostData = {
    id: number;
    title: string;
    excerpt: string | null;
    body: string;
    cover_url: string | null;
    category: { id: number; name: string } | null;
    is_featured: boolean;
    published_at: string | null;
    tags: string[] | null;
};

type Props = {
    post: { data: PostData };
    categories: Array<{ id: number; name: string }>;
    allTags: string[];
};

export default function PostEdit({ post: { data: postData }, categories, allTags }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/posts' },
        { title: 'Posts', href: '/admin/posts' },
        { title: postData.title, href: `/admin/posts/${postData.id}/edit` },
    ];

    const publishedDate = postData.published_at ? new Date(postData.published_at).toISOString().slice(0, 16) : '';

    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'PUT' as const,
        title: postData.title,
        excerpt: postData.excerpt ?? '',
        body: postData.body,
        category_id: postData.category ? String(postData.category.id) : '',
        is_featured: postData.is_featured,
        published_at: publishedDate,
        tags: postData.tags ?? [],
        cover_image: null as File | null,
        remove_cover: false,
        library_media_id: null as number | null,
    });

    const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(postData.cover_url ?? undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/posts/${postData.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Post: ${postData.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/posts" className="text-sm text-muted-foreground hover:text-foreground">
                        &larr; Back to Posts
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Post</h1>
                    <p className="text-sm text-muted-foreground">Update post content and settings.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Post Content" description="Title, excerpt, and body text.">
                        <ImageUploader
                            label="Cover Image"
                            currentUrl={currentImageUrl}
                            onChange={(file) => {
                                setData('cover_image', file);
                                if (file) {
                                    setData('remove_cover', false);
                                    setData('library_media_id', null);
                                }
                            }}
                            onRemove={() => {
                                setData('remove_cover', true);
                                setData('library_media_id', null);
                                setCurrentImageUrl(undefined);
                            }}
                            onSelectFromLibrary={(item: MediaItem) => {
                                setData('library_media_id', item.id);
                                setData('cover_image', null);
                                setData('remove_cover', false);
                                setCurrentImageUrl(item.url);
                            }}
                            error={errors.cover_image}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                            <InputError message={errors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Excerpt</Label>
                            <RichEditor
                                id="excerpt"
                                value={data.excerpt}
                                onChange={(html) => setData('excerpt', html)}
                                placeholder="A short summary of the post..."
                                error={errors.excerpt}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="body">Body *</Label>
                            <RichEditor
                                id="body"
                                value={data.body}
                                onChange={(html) => setData('body', html)}
                                error={errors.body}
                            />
                        </div>
                    </FormSection>


                    <FormSection title="Publishing" description="Category, publish date, and visibility.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger id="category_id">
                                        <SelectValue placeholder="No category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.category_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="published_at">Publish Date</Label>
                                <Input
                                    id="published_at"
                                    type="datetime-local"
                                    value={data.published_at}
                                    onChange={(e) => setData('published_at', e.target.value)}
                                />
                                <InputError message={errors.published_at} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="is_featured"
                                type="checkbox"
                                checked={data.is_featured}
                                onChange={(e) => setData('is_featured', e.target.checked)}
                                className="size-4 rounded border-input"
                            />
                            <Label htmlFor="is_featured">Featured Post</Label>
                            <InputError message={errors.is_featured} />
                        </div>
                    </FormSection>


                    <FormSection title="Tags" description="Add tags to categorize this post.">
                        <TagInput
                            value={data.tags}
                            onChange={(tags) => setData('tags', tags)}
                            suggestions={allTags}
                            placeholder="e.g. worship"
                        />
                    </FormSection>


                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Post'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/posts">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
