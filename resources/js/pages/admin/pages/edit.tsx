import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronDown, ExternalLink, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import { MultiImageUploader } from '@/components/admin/multi-image-uploader';
import { TagInput } from '@/components/tag-input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichEditor } from '@/components/admin/rich-editor';
import InputError from '@/components/input-error';
import { SectionList } from '@/components/admin/page-builder/section-list';
import { LayoutSelector } from '@/components/admin/page-builder/layout-selector';
import { PagePreview } from '@/components/admin/page-builder/page-preview';
import { useSectionBuilder } from '@/hooks/use-section-builder';
import type { BreadcrumbItem } from '@/types';
import type { MediaItem } from '@/types/media';
import type { PageSection, PageData } from '@/types/pages';

type Props = {
    page: { data: PageData };
    categories: Array<{ id: number; name: string }>;
    allTags: string[];
    publishedForms: Array<{ id: number; title: string; slug: string }>;
};

export default function PageEdit({ page: { data: pageData }, categories, allTags, publishedForms }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/pages' },
        { title: 'Pages', href: '/admin/pages' },
        { title: 'Edit', href: `/admin/pages/${pageData.id}/edit` },
    ];

    const redirectMode = useRef<'stay' | 'back'>('back');

    const { data, setData, post, processing, errors, progress, transform } = useForm({
        _method: 'PUT' as const,
        title: pageData.title,
        description: pageData.description ?? '',
        redirect_url: pageData.redirect_url ?? '',
        layout: pageData.layout,
        sections: (pageData.sections ?? []) as PageSection[],
        is_published: pageData.is_published,
        category_id: pageData.category?.id ? String(pageData.category.id) : '',
        sort_order: pageData.sort_order,
        tags: (pageData.tags ?? []) as string[],
        cover_images: [] as File[],
        remove_covers: [] as number[],
        library_media_ids: [] as number[],
    });

    // Track existing cover images using media IDs from the resource
    const [existingCovers, setExistingCovers] = useState<Array<{ id: number; url: string }>>(
        pageData.cover_media ?? (pageData.cover_urls ?? []).map((url, index) => ({ id: index, url })),
    );

    const [libraryPreviews, setLibraryPreviews] = useState<Array<{ id: number; url: string }>>([]);
    const [sectionFiles, setSectionFiles] = useState<Record<string, File>>({});

    const builder = useSectionBuilder(
        data.sections,
        setData as (key: 'sections', value: PageSection[]) => void,
    );

    transform((formData) => ({
        ...formData,
        section_images: sectionFiles,
        _redirect: redirectMode.current,
    }));

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        post(`/admin/pages/${pageData.id}`, {
            forceFormData: true,
            preserveScroll: redirectMode.current === 'stay',
        });
    };

    const submitWith = (mode: 'stay' | 'back') => {
        redirectMode.current = mode;
        handleSubmit();
    };

    const handleRemoveCover = (mediaId: number) => {
        setExistingCovers((prev) => prev.filter((c) => c.id !== mediaId));
        setData('remove_covers', [...data.remove_covers, mediaId]);
    };

    const handleSelectFromLibrary = (items: MediaItem[]) => {
        const newIds = items.map((i) => i.id);
        const newPreviews = items.map((i) => ({ id: i.id, url: i.url }));

        setData('library_media_ids', [...data.library_media_ids, ...newIds]);
        setLibraryPreviews((prev) => [...prev, ...newPreviews]);
    };

    const handleRemoveLibraryItem = (mediaId: number) => {
        setData('library_media_ids', data.library_media_ids.filter((id) => id !== mediaId));
        setLibraryPreviews((prev) => prev.filter((p) => p.id !== mediaId));
    };

    const handleSectionFileChange = (index: number, file: File | null) => {
        const sectionId = data.sections[index]?.id;
        if (!sectionId) return;

        setSectionFiles((prev) => {
            const next = { ...prev };
            if (file) {
                next[sectionId] = file;
            } else {
                delete next[sectionId];
            }
            return next;
        });
    };

    const editorPanel = (
        <div className="space-y-6">
            <FormSection title="Details" description="Page title, description, layout, and category.">
                <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                    />
                    <InputError message={errors.title} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <RichEditor
                        id="description"
                        value={data.description}
                        onChange={(html) => setData('description', html)}
                        placeholder="A brief description of this page..."
                        error={errors.description}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="redirect_url">Redirect URL</Label>
                    <Input
                        id="redirect_url"
                        type="url"
                        value={data.redirect_url}
                        onChange={(e) => setData('redirect_url', e.target.value)}
                        placeholder="https://example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                        If set, visitors will be redirected to this URL instead of viewing the page content.
                    </p>
                    <InputError message={errors.redirect_url} />
                </div>
                <LayoutSelector
                    value={data.layout}
                    onChange={(layout) => setData('layout', layout)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                            value={data.category_id ? String(data.category_id) : 'none'}
                            onValueChange={(v) => setData('category_id', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.category_id} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sort_order">Sort Order</Label>
                        <Input
                            id="sort_order"
                            type="number"
                            min={0}
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', Number(e.target.value))}
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Hero / Cover" description="Upload new images or browse existing media. Multiple images create a carousel.">
                <MultiImageUploader
                    label="Cover Images"
                    currentUrls={existingCovers}
                    onFilesChange={(files) => setData('cover_images', files)}
                    onRemove={handleRemoveCover}
                    onSelectFromLibrary={handleSelectFromLibrary}
                    error={errors.cover_images as unknown as string}
                />

                {libraryPreviews.length > 0 && (
                    <div className="space-y-2">
                        <Label>Selected from library</Label>
                        <div className="flex flex-wrap gap-3">
                            {libraryPreviews.map((item) => (
                                <div key={item.id} className="relative inline-block">
                                    <img
                                        src={item.url}
                                        alt="Library selection"
                                        className="h-32 w-32 rounded-lg border object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLibraryItem(item.id)}
                                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white shadow-sm transition-colors hover:bg-destructive"
                                    >
                                        <Trash2 className="size-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </FormSection>

            <FormSection title="Content Sections" description="Build your page content with different section types.">
                <SectionList
                    sections={data.sections}
                    publishedForms={publishedForms}
                    errors={errors as Record<string, string>}
                    onMoveSection={builder.moveSection}
                    onUpdateSectionData={builder.updateSectionData}
                    onUpdateSectionAlignment={builder.updateSectionAlignment}
                    onRemoveSection={builder.removeSection}
                    onDuplicateSection={builder.duplicateSection}
                    onAddSection={builder.addSection}
                    onSectionFileChange={handleSectionFileChange}
                />
            </FormSection>

            <FormSection title="Tags" description="Add tags to categorize this page.">
                <TagInput
                    value={data.tags}
                    onChange={(tags) => setData('tags', tags)}
                    suggestions={allTags}
                    placeholder="e.g. about"
                />
            </FormSection>

            <FormSection title="Publishing" description="Control page visibility.">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={data.is_published}
                        onChange={(e) => setData('is_published', e.target.checked)}
                        className="size-4 rounded border-input"
                    />
                    <Label>Published</Label>
                </div>
            </FormSection>
        </div>
    );

    const previewPanel = (
        <PagePreview
            title={data.title}
            description={data.description}
            layout={data.layout}
            sections={data.sections}
            coverUrls={[...existingCovers.map((c) => c.url), ...libraryPreviews.map((p) => p.url)]}
        />
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${pageData.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <Link href="/admin/pages" className="text-sm text-muted-foreground hover:text-foreground">
                            &larr; Back to Pages
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold">Edit Page</h1>
                        <p className="text-sm text-muted-foreground">Update "{pageData.title}".</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/pages/${pageData.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1.5 size-4" />
                            Preview Page
                        </a>
                    </Button>
                </div>

                {/* Desktop: side-by-side layout */}
                <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
                    <form onSubmit={handleSubmit} className="col-span-3 space-y-6">
                        {editorPanel}
                        {progress && (
                            <div className="h-2 rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="inline-flex rounded-md shadow-sm">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-r-none"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            disabled={processing}
                                            className="rounded-l-none border-l border-l-primary-foreground/20 px-2"
                                        >
                                            <ChevronDown className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => submitWith('stay')}>
                                            Save & Stay
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => submitWith('back')}>
                                            Save & Back to Pages
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/admin/pages">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                    <div className="col-span-2">
                        <div className="sticky top-4">
                            <p className="mb-2 text-sm font-medium text-muted-foreground">Live Preview</p>
                            {previewPanel}
                        </div>
                    </div>
                </div>

                {/* Mobile: tabbed layout */}
                <div className="lg:hidden">
                    <Tabs defaultValue="editor">
                        <TabsList>
                            <TabsTrigger value="editor">Editor</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="editor">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {editorPanel}
                                {progress && (
                                    <div className="h-2 rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className="inline-flex rounded-md shadow-sm">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-r-none"
                                        >
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    disabled={processing}
                                                    className="rounded-l-none border-l border-l-primary-foreground/20 px-2"
                                                >
                                                    <ChevronDown className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => submitWith('stay')}>
                                                    Save & Stay
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => submitWith('back')}>
                                                    Save & Back to Pages
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <Button variant="outline" asChild>
                                        <Link href="/admin/pages">Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                        <TabsContent value="preview">
                            {previewPanel}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
