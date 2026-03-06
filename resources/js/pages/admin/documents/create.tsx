import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import { ImageUploader } from '@/components/admin/image-uploader';
import { RichEditor } from '@/components/admin/rich-editor';
import { TagInput } from '@/components/tag-input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import type { MediaItem } from '@/types/media';

type Props = {
    categories: Array<{ id: number; name: string }>;
    visibilities: Array<{ value: string; label: string }>;
    allTags: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/documents' },
    { title: 'Documents', href: '/admin/documents' },
    { title: 'Add', href: '/admin/documents/create' },
];

export default function DocumentCreate({ categories, visibilities, allTags }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm({
        title: '',
        description: '',
        document_file: null as File | null,
        thumbnail_image: null as File | null,
        library_media_id: null as number | null,
        visibility: 'public',
        category_id: '',
        is_published: false,
        tags: [] as string[],
    });

    const [libraryPreviewUrl, setLibraryPreviewUrl] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/documents');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Document" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/documents" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Documents</Link>
                    <h1 className="mt-2 text-2xl font-bold">Add Document</h1>
                    <p className="text-sm text-muted-foreground">Upload and organize a document for sharing.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Document Details" description="Title, description, and file upload.">
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
                            <Label htmlFor="document_file">Document File *</Label>
                            <Input
                                id="document_file"
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                                onChange={(e) => setData('document_file', e.target.files?.[0] ?? null)}
                            />
                            <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, or Image. Max 20MB.</p>
                            <InputError message={errors.document_file} />
                        </div>
                    </FormSection>

                    <FormSection title="Publishing" description="Visibility, category, and thumbnail.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="visibility">Visibility *</Label>
                                <Select value={data.visibility} onValueChange={(v) => setData('visibility', v)}>
                                    <SelectTrigger id="visibility"><SelectValue placeholder="Select visibility" /></SelectTrigger>
                                    <SelectContent>
                                        {visibilities.map((v) => (
                                            <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.visibility} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger id="category_id"><SelectValue placeholder="No category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <ImageUploader
                            label="Thumbnail Image"
                            currentUrl={libraryPreviewUrl}
                            onChange={(file) => {
                                setData('thumbnail_image', file);
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
                                setData('thumbnail_image', null);
                                setLibraryPreviewUrl(item.url);
                            }}
                            error={errors.thumbnail_image}
                        />

                        <div className="flex items-center gap-2">
                            <input id="is_published" type="checkbox" checked={data.is_published} onChange={(e) => setData('is_published', e.target.checked)} className="size-4 rounded border-input" />
                            <Label htmlFor="is_published">Published (visible to users)</Label>
                        </div>
                    </FormSection>

                    <FormSection title="Tags" description="Add tags for organization.">
                        <TagInput
                            value={data.tags}
                            onChange={(tags) => setData('tags', tags)}
                            suggestions={allTags}
                            error={errors.tags}
                        />
                    </FormSection>

                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Uploading...' : 'Add Document'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/documents">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
