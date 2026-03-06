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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/reading-plans' },
    { title: 'Reading Plans', href: '/admin/reading-plans' },
    { title: 'Create', href: '/admin/reading-plans/create' },
];

export default function ReadingPlanCreate() {
    const { data, setData, post, processing, errors, progress } = useForm({
        title: '',
        description: '',
        cover_image: null as File | null,
        library_media_id: null as number | null,
        duration_days: '7',
        is_published: false,
    });

    const [libraryPreviewUrl, setLibraryPreviewUrl] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/reading-plans');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Reading Plan" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/reading-plans" className="text-sm text-muted-foreground hover:text-foreground">
                        &larr; Back to Reading Plans
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Create Reading Plan</h1>
                    <p className="text-sm text-muted-foreground">Set up a new reading plan for members.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Plan Details" description="Title, description, and duration.">
                        <ImageUploader
                            label="Cover Image"
                            currentUrl={libraryPreviewUrl}
                            onChange={(file) => {
                                setData('cover_image', file);
                                if (file) {
                                    setData('library_media_id', null);
                                    setLibraryPreviewUrl(null);
                                }
                            }}
                            onRemove={() => {
                                setData('library_media_id', null);
                                setLibraryPreviewUrl(null);
                            }}
                            onSelectFromLibrary={(item: MediaItem) => {
                                setData('library_media_id', item.id);
                                setData('cover_image', null);
                                setLibraryPreviewUrl(item.url);
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
                                placeholder="Describe what this reading plan covers..."
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
                            {processing ? 'Creating...' : 'Create Plan'}
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
