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

type SermonData = {
    id: number;
    title: string;
    description: string | null;
    cover_url: string | null;
    notes: string | null;
    scripture_references: string[] | null;
    sermon_date: string;
    video_url: string | null;
    speaker: { id: number; name: string } | null;
    series: { id: number; title: string } | null;
    tags: string[] | null;
    published_at: string | null;
};

type Props = {
    sermon: { data: SermonData };
    speakers: Array<{ id: number; name: string }>;
    seriesList: Array<{ id: number; title: string }>;
    allTags: string[];
};

export default function SermonEdit({ sermon: { data: sermon }, speakers, seriesList, allTags }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/sermons' },
        { title: 'Sermons', href: '/admin/sermons' },
        { title: sermon.title, href: `/admin/sermons/${sermon.id}/edit` },
    ];

    const publishedDate = sermon.published_at ? new Date(sermon.published_at).toISOString().slice(0, 16) : '';

    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'PUT' as const,
        title: sermon.title,
        description: sermon.description ?? '',
        notes: sermon.notes ?? '',
        scripture_references: sermon.scripture_references?.length ? sermon.scripture_references : [''],
        sermon_date: sermon.sermon_date,
        video_url: sermon.video_url ?? '',
        speaker_id: sermon.speaker ? String(sermon.speaker.id) : '',
        series_id: sermon.series ? String(sermon.series.id) : '',
        published_at: publishedDate,
        tags: sermon.tags ?? [],
        cover_image: null as File | null,
        remove_cover: false,
        library_media_id: null as number | null,
    });

    const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(sermon.cover_url ?? undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/sermons/${sermon.id}`, {
            data: {
                ...data,
                scripture_references: data.scripture_references.filter(Boolean),
            },
        });
    };

    const addScriptureRef = () => setData('scripture_references', [...data.scripture_references, '']);
    const removeScriptureRef = (index: number) =>
        setData(
            'scripture_references',
            data.scripture_references.filter((_, i) => i !== index),
        );
    const updateScriptureRef = (index: number, value: string) => {
        const updated = [...data.scripture_references];
        updated[index] = value;
        setData('scripture_references', updated);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Sermon: ${sermon.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/sermons" className="text-sm text-muted-foreground hover:text-foreground">
                        &larr; Back to Sermons
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Sermon</h1>
                    <p className="text-sm text-muted-foreground">Update sermon information.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Sermon Details" description="Core information about the sermon.">
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

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="speaker_id">Speaker *</Label>
                                <Select value={data.speaker_id} onValueChange={(v) => setData('speaker_id', v)}>
                                    <SelectTrigger id="speaker_id">
                                        <SelectValue placeholder="Select speaker" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {speakers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.speaker_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="series_id">Series</Label>
                                <Select value={data.series_id} onValueChange={(v) => setData('series_id', v)}>
                                    <SelectTrigger id="series_id">
                                        <SelectValue placeholder="No series" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {seriesList.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.series_id} />
                            </div>
                        </div>
                    </FormSection>


                    <FormSection title="Schedule & Media" description="Dates and media links.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="sermon_date">Sermon Date *</Label>
                                <Input
                                    id="sermon_date"
                                    type="date"
                                    value={data.sermon_date}
                                    onChange={(e) => setData('sermon_date', e.target.value)}
                                />
                                <InputError message={errors.sermon_date} />
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

                        <div className="space-y-2">
                            <Label htmlFor="video_url">Video URL</Label>
                            <Input
                                id="video_url"
                                type="url"
                                value={data.video_url}
                                onChange={(e) => setData('video_url', e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                            <InputError message={errors.video_url} />
                        </div>
                    </FormSection>


                    <FormSection title="Content" description="Scripture references and sermon notes.">
                        <div className="space-y-2">
                            <Label>Scripture References</Label>
                            {data.scripture_references.map((ref, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        value={ref}
                                        onChange={(e) => updateScriptureRef(i, e.target.value)}
                                        placeholder="e.g. John 3:16"
                                    />
                                    {data.scripture_references.length > 1 && (
                                        <Button type="button" variant="outline" size="sm" onClick={() => removeScriptureRef(i)}>
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addScriptureRef}>
                                Add Reference
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Sermon Notes</Label>
                            <RichEditor
                                id="notes"
                                value={data.notes}
                                onChange={(html) => setData('notes', html)}
                                error={errors.notes}
                            />
                        </div>
                    </FormSection>


                    <FormSection title="Tags" description="Add tags to categorize this sermon.">
                        <TagInput
                            value={data.tags}
                            onChange={(tags) => setData('tags', tags)}
                            suggestions={allTags}
                            placeholder="e.g. faith"
                        />
                    </FormSection>


                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Update Sermon'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/admin/sermons">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
