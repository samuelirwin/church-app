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

type EventData = {
    id: number;
    title: string;
    description: string | null;
    body: string | null;
    cover_url: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    recurrence: string;
    max_attendees: number | null;
    is_published: boolean;
    category: { id: number; name: string } | null;
    form_id: number | null;
    tags: string[] | null;
};

type Props = {
    event: { data: EventData };
    categories: Array<{ id: number; name: string }>;
    forms: Array<{ id: number; title: string }>;
    allTags: string[];
};

function toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}

export default function EventEdit({ event: { data: event }, categories, forms, allTags }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/events' },
        { title: 'Events', href: '/admin/events' },
        { title: 'Edit', href: `/admin/events/${event.id}/edit` },
    ];

    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'PUT' as const,
        title: event.title,
        description: event.description ?? '',
        body: event.body ?? '',
        location: event.location ?? '',
        starts_at: toLocalDatetime(event.starts_at),
        ends_at: event.ends_at ? toLocalDatetime(event.ends_at) : '',
        is_all_day: event.is_all_day,
        recurrence: event.recurrence ?? 'none',
        max_attendees: event.max_attendees ? String(event.max_attendees) : '',
        category_id: event.category ? String(event.category.id) : '',
        form_id: event.form_id ? String(event.form_id) : '',
        is_published: event.is_published,
        tags: event.tags ?? [],
        cover_image: null as File | null,
        remove_cover: false,
        library_media_id: null as number | null,
    });

    const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(event.cover_url ?? undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/events/${event.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${event.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Events</Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Event</h1>
                    <p className="text-sm text-muted-foreground">Update event details and settings.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Event Details" description="Title, description, and content.">
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
                            <Label htmlFor="body">Body</Label>
                            <RichEditor
                                id="body"
                                value={data.body}
                                onChange={(html) => setData('body', html)}
                                error={errors.body}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} />
                        </div>
                    </FormSection>


                    <FormSection title="Schedule" description="Date, time, and recurrence.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="starts_at">Starts At *</Label>
                                <Input id="starts_at" type="datetime-local" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} />
                                <InputError message={errors.starts_at} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ends_at">Ends At</Label>
                                <Input id="ends_at" type="datetime-local" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} />
                                <InputError message={errors.ends_at} />
                            </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="recurrence">Recurrence</Label>
                                <Select value={data.recurrence} onValueChange={(v) => setData('recurrence', v)}>
                                    <SelectTrigger id="recurrence"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_attendees">Max Attendees</Label>
                                <Input id="max_attendees" type="number" min={1} value={data.max_attendees} onChange={(e) => setData('max_attendees', e.target.value)} placeholder="Unlimited" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger id="category_id"><SelectValue placeholder="No category" /></SelectTrigger>
                                    <SelectContent>{categories.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </FormSection>


                    <FormSection title="Options" description="Registration form and visibility.">
                        <div className="space-y-2">
                            <Label htmlFor="form_id">Registration Form</Label>
                            <Select value={data.form_id} onValueChange={(v) => setData('form_id', v)}>
                                <SelectTrigger id="form_id"><SelectValue placeholder="No custom form" /></SelectTrigger>
                                <SelectContent>{forms.map((f) => (<SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <input id="is_all_day" type="checkbox" checked={data.is_all_day} onChange={(e) => setData('is_all_day', e.target.checked)} className="size-4 rounded border-input" />
                                <Label htmlFor="is_all_day">All-day event</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="is_published" type="checkbox" checked={data.is_published} onChange={(e) => setData('is_published', e.target.checked)} className="size-4 rounded border-input" />
                                <Label htmlFor="is_published">Published</Label>
                            </div>
                        </div>
                    </FormSection>


                    <FormSection title="Tags" description="Add tags to categorize this event.">
                        <TagInput
                            value={data.tags}
                            onChange={(tags) => setData('tags', tags)}
                            suggestions={allTags}
                            placeholder="e.g. youth"
                        />
                    </FormSection>


                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save Changes'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/events">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
