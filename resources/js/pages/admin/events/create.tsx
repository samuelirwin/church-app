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

type Props = {
    categories: Array<{ id: number; name: string }>;
    forms: Array<{ id: number; title: string }>;
    allTags: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/events' },
    { title: 'Events', href: '/admin/events' },
    { title: 'Create', href: '/admin/events/create' },
];

export default function EventCreate({ categories, forms, allTags }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm({
        title: '',
        description: '',
        body: '',
        cover_image: null as File | null,
        library_media_id: null as number | null,
        location: '',
        starts_at: '',
        ends_at: '',
        is_all_day: false,
        recurrence: 'none',
        max_attendees: '',
        category_id: '',
        form_id: '',
        is_published: false,
        tags: [] as string[],
    });

    const [libraryPreviewUrl, setLibraryPreviewUrl] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/events');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Event" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Events</Link>
                    <h1 className="mt-2 text-2xl font-bold">Create Event</h1>
                    <p className="text-sm text-muted-foreground">Schedule a new event.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Event Details" description="Title, description, and content.">
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
                            <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} placeholder="e.g. Main Sanctuary" />
                            <InputError message={errors.location} />
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
                                <InputError message={errors.max_attendees} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger id="category_id"><SelectValue placeholder="No category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </FormSection>


                    <FormSection title="Options" description="Registration form and visibility.">
                        <div className="space-y-2">
                            <Label htmlFor="form_id">Registration Form (optional)</Label>
                            <Select value={data.form_id} onValueChange={(v) => setData('form_id', v)}>
                                <SelectTrigger id="form_id"><SelectValue placeholder="No custom form" /></SelectTrigger>
                                <SelectContent>
                                    {forms.map((f) => (<SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>))}
                                </SelectContent>
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
                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Event'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/events">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
