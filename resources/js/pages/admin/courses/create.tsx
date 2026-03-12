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

type DifficultyOption = { value: string; label: string };
type CategoryOption = { id: number; name: string };

type Props = {
    categories: CategoryOption[];
    difficulties: DifficultyOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/courses' },
    { title: 'Courses', href: '/admin/courses' },
    { title: 'Create', href: '/admin/courses/create' },
];

export default function CourseCreate({ categories, difficulties }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm({
        title: '',
        description: '',
        cover_image: null as File | null,
        library_media_id: null as number | null,
        difficulty: 'beginner',
        estimated_hours: '',
        is_published: false,
        requires_enrollment: true,
        max_enrollments: '',
        category_id: '',
    });

    const [libraryPreviewUrl, setLibraryPreviewUrl] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/courses');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Course" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Courses</Link>
                    <h1 className="mt-2 text-2xl font-bold">Create Course</h1>
                    <p className="text-sm text-muted-foreground">Set up a new academy course.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Course Details" description="Title, description, and difficulty.">
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
                                placeholder="Describe what this course covers..."
                                error={errors.description}
                            />
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="difficulty">Difficulty *</Label>
                                <select id="difficulty" value={data.difficulty} onChange={(e) => setData('difficulty', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    {difficulties.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                                </select>
                                <InputError message={errors.difficulty} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                                <Input id="estimated_hours" type="number" step="0.5" min="0.5" value={data.estimated_hours} onChange={(e) => setData('estimated_hours', e.target.value)} />
                                <InputError message={errors.estimated_hours} />
                            </div>
                        </div>
                    </FormSection>


                    <FormSection title="Enrollment Settings" description="Category, capacity, and access controls.">
                        {categories.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Category</Label>
                                <select id="category_id" value={data.category_id} onChange={(e) => setData('category_id', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">No category</option>
                                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                </select>
                                <InputError message={errors.category_id} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="max_enrollments">Max Enrollments</Label>
                            <Input id="max_enrollments" type="number" min="1" value={data.max_enrollments} onChange={(e) => setData('max_enrollments', e.target.value)} placeholder="Leave empty for unlimited" />
                            <InputError message={errors.max_enrollments} />
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <input id="is_published" type="checkbox" checked={data.is_published} onChange={(e) => setData('is_published', e.target.checked)} className="size-4 rounded border-input" />
                                <Label htmlFor="is_published">Published</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="requires_enrollment" type="checkbox" checked={data.requires_enrollment} onChange={(e) => setData('requires_enrollment', e.target.checked)} className="size-4 rounded border-input" />
                                <Label htmlFor="requires_enrollment">Requires enrollment</Label>
                            </div>
                        </div>
                    </FormSection>


                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Course'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/courses">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
