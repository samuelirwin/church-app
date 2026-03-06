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
    { title: 'Admin', href: '/admin/speakers' },
    { title: 'Speakers', href: '/admin/speakers' },
    { title: 'Create', href: '/admin/speakers/create' },
];

export default function SpeakerCreate() {
    const { data, setData, post, processing, errors, progress } = useForm({
        name: '',
        title: '',
        bio: '',
        photo_image: null as File | null,
        library_media_id: null as number | null,
    });

    const [libraryPreviewUrl, setLibraryPreviewUrl] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/speakers');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Speaker" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/speakers" className="text-sm text-muted-foreground hover:text-foreground">
                        &larr; Back to Speakers
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Create Speaker</h1>
                    <p className="text-sm text-muted-foreground">Add a new speaker to the system.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Speaker Details" description="Basic information about the speaker.">
                        <ImageUploader
                            label="Photo"
                            currentUrl={libraryPreviewUrl}
                            onChange={(file) => {
                                setData('photo_image', file);
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
                                setData('photo_image', null);
                                setLibraryPreviewUrl(item.url);
                            }}
                            error={errors.photo_image}
                        />

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Pastor, Elder, Guest Speaker"
                                />
                                <InputError message={errors.title} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <RichEditor
                                id="bio"
                                value={data.bio}
                                onChange={(html) => setData('bio', html)}
                                error={errors.bio}
                            />
                        </div>
                    </FormSection>

                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Speaker'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/speakers">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
