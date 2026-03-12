import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import { ImageUploader } from '@/components/admin/image-uploader';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import type { MediaItem } from '@/types/media';

type SlideData = {
    id: number;
    title: string | null;
    subtitle: string | null;
    link_url: string | null;
    link_text: string | null;
    sort_order: number;
    is_active: boolean;
    image_url: string;
};

type Props = {
    slide: SlideData;
};

export default function HeroSlideEdit({ slide }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Site Settings', href: '/admin/site-settings' },
        { title: 'Hero Slides', href: '/admin/site-settings' },
        { title: slide.title || 'Edit', href: `/admin/hero-slides/${slide.id}/edit` },
    ];

    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'PUT' as const,
        image: null as File | null,
        title: slide.title ?? '',
        subtitle: slide.subtitle ?? '',
        link_url: slide.link_url ?? '',
        link_text: slide.link_text ?? '',
        sort_order: String(slide.sort_order),
        is_active: slide.is_active,
        remove_image: false,
        library_media_id: null as number | null,
    });

    const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(slide.image_url || undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/hero-slides/${slide.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Hero Slide${slide.title ? `: ${slide.title}` : ''}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/site-settings" className="text-sm text-muted-foreground hover:text-foreground">
                        &larr; Back to Site Settings
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Hero Slide</h1>
                    <p className="text-sm text-muted-foreground">Update the hero slide image and overlay content.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Image" description="The hero image displayed on the homepage. Recommended: 1920x700 or larger.">
                        <ImageUploader
                            label="Hero Image"
                            currentUrl={currentImageUrl}
                            onChange={(file) => {
                                setData('image', file);
                                if (file) {
                                    setData('remove_image', false);
                                    setData('library_media_id', null);
                                }
                            }}
                            onRemove={() => {
                                setData('remove_image', true);
                                setData('library_media_id', null);
                                setCurrentImageUrl(undefined);
                            }}
                            onSelectFromLibrary={(item: MediaItem) => {
                                setData('library_media_id', item.id);
                                setData('image', null);
                                setData('remove_image', false);
                                setCurrentImageUrl(item.url);
                            }}
                            error={errors.image}
                        />
                    </FormSection>

                    <FormSection title="Overlay Content" description="Optional text and call-to-action displayed over the image.">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                            <InputError message={errors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subtitle">Subtitle</Label>
                            <Input id="subtitle" value={data.subtitle} onChange={(e) => setData('subtitle', e.target.value)} />
                            <InputError message={errors.subtitle} />
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="link_url">Link URL</Label>
                                <Input
                                    id="link_url"
                                    type="url"
                                    placeholder="https://..."
                                    value={data.link_url}
                                    onChange={(e) => setData('link_url', e.target.value)}
                                />
                                <InputError message={errors.link_url} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="link_text">Link Text</Label>
                                <Input
                                    id="link_text"
                                    placeholder="Learn More"
                                    value={data.link_text}
                                    onChange={(e) => setData('link_text', e.target.value)}
                                />
                                <InputError message={errors.link_text} />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Display Settings" description="Sort order and active status.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="sort_order">Sort Order</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', e.target.value)}
                                />
                                <InputError message={errors.sort_order} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-input"
                            />
                            <Label htmlFor="is_active">Active</Label>
                            <InputError message={errors.is_active} />
                        </div>
                    </FormSection>

                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Slide'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/site-settings">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
