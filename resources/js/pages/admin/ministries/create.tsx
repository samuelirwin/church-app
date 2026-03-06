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

type Props = { users: Array<{ id: number; name: string }> };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/ministries' },
    { title: 'Ministries', href: '/admin/ministries' },
    { title: 'Add', href: '/admin/ministries/create' },
];

export default function MinistryCreate({ users }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm({
        name: '', description: '', body: '', cover_image: null as File | null, library_media_id: null as number | null, leader_id: '', is_active: true, sort_order: '0', meeting_schedule: '', meeting_location: '',
    });

    const [libraryPreviewUrl, setLibraryPreviewUrl] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); post('/admin/ministries'); };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Ministry" />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/ministries" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Ministries</Link>
                    <h1 className="mt-2 text-2xl font-bold">Add Ministry</h1>
                    <p className="text-sm text-muted-foreground">Create a new ministry.</p>
                </div>
                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Ministry Details" description="Name, description, and content.">
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
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            <InputError message={errors.name} />
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
                    </FormSection>
                    <FormSection title="Leadership & Display" description="Leader assignment and ordering.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="leader_id">Leader</Label>
                                <Select value={data.leader_id} onValueChange={(v) => setData('leader_id', v)}>
                                    <SelectTrigger id="leader_id"><SelectValue placeholder="No leader" /></SelectTrigger>
                                    <SelectContent>{users.map((u) => (<SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>))}</SelectContent>
                                </Select>
                                <InputError message={errors.leader_id} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sort_order">Sort Order</Label>
                                <Input id="sort_order" type="number" min={0} value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                                <InputError message={errors.sort_order} />
                            </div>
                        </div>
                    </FormSection>
                    <FormSection title="Meeting Info" description="Schedule and location details.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="meeting_schedule">Meeting Schedule</Label>
                                <Input id="meeting_schedule" value={data.meeting_schedule} onChange={(e) => setData('meeting_schedule', e.target.value)} placeholder="e.g. Every Sunday at 9am" />
                                <InputError message={errors.meeting_schedule} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meeting_location">Meeting Location</Label>
                                <Input id="meeting_location" value={data.meeting_location} onChange={(e) => setData('meeting_location', e.target.value)} placeholder="e.g. Main Hall" />
                                <InputError message={errors.meeting_location} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="size-4 rounded border-input" />
                            <Label htmlFor="is_active">Active (visible to members)</Label>
                        </div>
                    </FormSection>
                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Adding...' : 'Add Ministry'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/ministries">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
