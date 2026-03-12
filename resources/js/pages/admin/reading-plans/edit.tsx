import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import { ImageUploader } from '@/components/admin/image-uploader';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichEditor } from '@/components/admin/rich-editor';
import type { BreadcrumbItem } from '@/types';
import type { MediaItem } from '@/types/media';

type PlanData = {
    id: number;
    title: string;
    description: string | null;
    cover_url: string | null;
    duration_days: number;
    is_published: boolean;
};

type Props = {
    plan: { data: PlanData };
};

export default function ReadingPlanEdit({ plan: { data: planData } }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/reading-plans' },
        { title: 'Reading Plans', href: '/admin/reading-plans' },
        { title: planData.title, href: `/admin/reading-plans/${planData.id}/edit` },
    ];

    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'PUT' as const,
        title: planData.title,
        description: planData.description ?? '',
        duration_days: String(planData.duration_days),
        is_published: planData.is_published,
        cover_image: null as File | null,
        remove_cover: false,
        library_media_id: null as number | null,
    });

    const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(planData.cover_url ?? undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/reading-plans/${planData.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Plan: ${planData.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/reading-plans" className="text-sm text-muted-foreground hover:text-foreground">
                        &larr; Back to Reading Plans
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Reading Plan</h1>
                    <p className="text-sm text-muted-foreground">Update plan details.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Plan Details" description="Title, description, and duration.">
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
                            <Label htmlFor="description">Description</Label>
                            <RichEditor
                                id="description"
                                value={data.description}
                                onChange={(html) => setData('description', html)}
                                error={errors.description}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration_days">Duration (days) *</Label>
                            <Input
                                id="duration_days"
                                type="number"
                                min="1"
                                max="365"
                                value={data.duration_days}
                                onChange={(e) => setData('duration_days', e.target.value)}
                            />
                            <InputError message={errors.duration_days} />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="is_published"
                                type="checkbox"
                                checked={data.is_published}
                                onChange={(e) => setData('is_published', e.target.checked)}
                                className="size-4 rounded border-input"
                            />
                            <Label htmlFor="is_published">Published</Label>
                            <InputError message={errors.is_published} />
                        </div>
                    </FormSection>


                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Plan'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/reading-plans">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
