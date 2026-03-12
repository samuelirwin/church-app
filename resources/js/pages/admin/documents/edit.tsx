import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FileText } from 'lucide-react';
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

type DocumentData = {
    id: number;
    title: string;
    description: string | null;
    visibility: string;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    file_mime_type: string | null;
    thumbnail_url: string | null;
    category: { id: number; name: string } | null;
    tags: string[];
    is_published: boolean;
};

type Props = {
    document: { data: DocumentData };
    categories: Array<{ id: number; name: string }>;
    visibilities: Array<{ value: string; label: string }>;
    allTags: string[];
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentEdit({ document: { data: docData }, categories, visibilities, allTags }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/documents' },
        { title: 'Documents', href: '/admin/documents' },
        { title: docData.title, href: `/admin/documents/${docData.id}/edit` },
    ];

    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'PUT' as const,
        title: docData.title,
        description: docData.description ?? '',
        document_file: null as File | null,
        thumbnail_image: null as File | null,
        remove_thumbnail: false,
        library_media_id: null as number | null,
        visibility: docData.visibility,
        category_id: docData.category ? String(docData.category.id) : '',
        is_published: docData.is_published,
        tags: docData.tags ?? [],
    });

    const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(docData.thumbnail_url ?? undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/documents/${docData.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Document: ${docData.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/documents" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Documents</Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Document</h1>
                    <p className="text-sm text-muted-foreground">Update document details and file.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Document Details" description="Title, description, and file.">
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

                        {docData.file_name && (
                            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
                                <FileText className="size-5 text-muted-foreground" />
                                <div className="flex-1 text-sm">
                                    <p className="font-medium">{docData.file_name}</p>
                                    {docData.file_size && <p className="text-muted-foreground">{formatFileSize(docData.file_size)}</p>}
                                </div>
                                {docData.file_url && (
                                    <a href={docData.file_url} download className="text-sm text-primary hover:underline">
                                        Download
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="document_file">Replace File</Label>
                            <Input
                                id="document_file"
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                                onChange={(e) => setData('document_file', e.target.files?.[0] ?? null)}
                            />
                            <p className="text-xs text-muted-foreground">Leave empty to keep current file. Max 20MB.</p>
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
                            currentUrl={currentImageUrl}
                            onChange={(file) => {
                                setData('thumbnail_image', file);
                                if (file) {
                                    setData('remove_thumbnail', false);
                                    setData('library_media_id', null);
                                }
                            }}
                            onRemove={() => {
                                setData('remove_thumbnail', true);
                                setData('library_media_id', null);
                                setCurrentImageUrl(undefined);
                            }}
                            onSelectFromLibrary={(item: MediaItem) => {
                                setData('library_media_id', item.id);
                                setData('thumbnail_image', null);
                                setData('remove_thumbnail', false);
                                setCurrentImageUrl(item.url);
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
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Update Document'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/documents">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
