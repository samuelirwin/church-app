import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import { ImageUploader } from '@/components/admin/image-uploader';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichEditor } from '@/components/admin/rich-editor';
import type { BreadcrumbItem } from '@/types';
import type { MediaItem } from '@/types/media';

type HighlightData = {
    id: number;
    title: string;
    body: string;
    cover_url: string | null;
    type: string;
    priority: number;
    is_active: boolean;
    starts_at: string;
    ends_at: string | null;
};

type Props = {
    highlight: { data: HighlightData };
    types: Array<{ value: string; label: string }>;
};

export default function HighlightEdit({ highlight: { data: highlightData }, types }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/highlights' },
        { title: 'Highlights', href: '/admin/highlights' },
        { title: highlightData.title, href: `/admin/highlights/${highlightData.id}/edit` },
    ];

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().slice(0, 16);
    };

    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'PUT' as const,
        title: highlightData.title,
        body: highlightData.body,
        type: highlightData.type,
        priority: String(highlightData.priority),
        is_active: highlightData.is_active,
        starts_at: formatDate(highlightData.starts_at),
        ends_at: formatDate(highlightData.ends_at),
        cover_image: null as File | null,
        remove_cover: false,
        library_media_id: null as number | null,
    });

    const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(highlightData.cover_url ?? undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/highlights/${highlightData.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Highlight: ${highlightData.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/highlights" className="text-sm text-muted-foreground hover:text-foreground">
                        &larr; Back to Highlights
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Highlight</h1>
                    <p className="text-sm text-muted-foreground">Update highlight content and settings.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Content" description="Highlight title and body text.">
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
                            <Label htmlFor="body">Body *</Label>
                            <RichEditor
                                id="body"
                                value={data.body}
                                onChange={(html) => setData('body', html)}
                                error={errors.body}
                            />
                        </div>
                    </FormSection>


                    <FormSection title="Display Settings" description="Type, priority, and scheduling.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {types.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority (1-10) *</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={data.priority}
                                    onChange={(e) => setData('priority', e.target.value)}
                                />
                                <InputError message={errors.priority} />
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="starts_at">Start Date *</Label>
                                <Input
                                    id="starts_at"
                                    type="datetime-local"
                                    value={data.starts_at}
                                    onChange={(e) => setData('starts_at', e.target.value)}
                                />
                                <InputError message={errors.starts_at} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ends_at">End Date</Label>
                                <Input
                                    id="ends_at"
                                    type="datetime-local"
                                    value={data.ends_at}
                                    onChange={(e) => setData('ends_at', e.target.value)}
                                />
                                <InputError message={errors.ends_at} />
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
                            {processing ? 'Saving...' : 'Update Highlight'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/highlights">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
