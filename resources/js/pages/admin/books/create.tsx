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

type Props = {
    categories: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/books' },
    { title: 'Books', href: '/admin/books' },
    { title: 'Add', href: '/admin/books/create' },
];

export default function BookCreate({ categories }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm({
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        description: '',
        cover_image: null as File | null,
        library_media_id: null as number | null,
        category_id: '',
        total_copies: '1',
        available_copies: '1',
        location: '',
        is_published: false,
    });

    const [libraryPreviewUrl, setLibraryPreviewUrl] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/books');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Book" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/books" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Books</Link>
                    <h1 className="mt-2 text-2xl font-bold">Add Book</h1>
                    <p className="text-sm text-muted-foreground">Add a new book to the library.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Book Details" description="Title, author, and description.">
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

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                                <InputError message={errors.title} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="author">Author *</Label>
                                <Input id="author" value={data.author} onChange={(e) => setData('author', e.target.value)} />
                                <InputError message={errors.author} />
                            </div>
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
                                <Label htmlFor="isbn">ISBN</Label>
                                <Input id="isbn" value={data.isbn} onChange={(e) => setData('isbn', e.target.value)} />
                                <InputError message={errors.isbn} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="publisher">Publisher</Label>
                                <Input id="publisher" value={data.publisher} onChange={(e) => setData('publisher', e.target.value)} />
                                <InputError message={errors.publisher} />
                            </div>
                        </div>
                    </FormSection>


                    <FormSection title="Inventory" description="Category, copies, and location.">
                        <div className="grid gap-6 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger id="category_id"><SelectValue placeholder="No category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="total_copies">Total Copies</Label>
                                <Input id="total_copies" type="number" min={0} value={data.total_copies} onChange={(e) => setData('total_copies', e.target.value)} />
                                <InputError message={errors.total_copies} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="available_copies">Available</Label>
                                <Input id="available_copies" type="number" min={0} value={data.available_copies} onChange={(e) => setData('available_copies', e.target.value)} />
                                <InputError message={errors.available_copies} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} placeholder="e.g. Shelf A3" />
                        </div>

                        <div className="flex items-center gap-2">
                            <input id="is_published" type="checkbox" checked={data.is_published} onChange={(e) => setData('is_published', e.target.checked)} className="size-4 rounded border-input" />
                            <Label htmlFor="is_published">Published (visible in catalog)</Label>
                        </div>
                    </FormSection>


                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Adding...' : 'Add Book'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/books">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
