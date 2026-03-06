import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';

type LessonData = {
    id: number;
    title: string;
    slug: string;
    content_type: string;
    content_type_label: string;
    duration_minutes: number | null;
    is_free_preview: boolean;
    sort_order: number;
};

type ModuleData = {
    id: number;
    title: string;
    description: string | null;
    sort_order: number;
    lessons: LessonData[];
};

type CourseData = {
    id: number;
    title: string;
    modules: ModuleData[];
};

type Props = {
    course: { data: CourseData };
};

export default function CourseModules({ course: { data: course } }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/courses' },
        { title: 'Courses', href: '/admin/courses' },
        { title: course.title, href: `/admin/courses/${course.id}` },
        { title: 'Modules', href: `/admin/courses/${course.id}` },
    ];

    const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set(course.modules.map(m => m.id)));
    const [editingModule, setEditingModule] = useState<ModuleData | null>(null);
    const [addingLessonToModule, setAddingLessonToModule] = useState<number | null>(null);
    const [editingLesson, setEditingLesson] = useState<{ moduleId: number; lesson: LessonData } | null>(null);

    const moduleForm = useForm({
        title: '',
        description: '',
        sort_order: String(course.modules.length),
    });

    const lessonForm = useForm({
        title: '',
        content_type: 'text',
        body: '',
        video_url: '',
        duration_minutes: '',
        sort_order: '0',
        is_free_preview: false,
    });

    const toggleModule = (id: number) => {
        const next = new Set(expandedModules);
        next.has(id) ? next.delete(id) : next.add(id);
        setExpandedModules(next);
    };

    // Module CRUD
    const handleAddModule = (e: React.FormEvent) => {
        e.preventDefault();
        moduleForm.post(`/admin/courses/${course.id}/modules`, {
            onSuccess: () => {
                moduleForm.reset();
                moduleForm.setData('sort_order', String(course.modules.length + 1));
            },
        });
    };

    const startEditingModule = (mod: ModuleData) => {
        setEditingModule(mod);
        moduleForm.setData({
            title: mod.title,
            description: mod.description ?? '',
            sort_order: String(mod.sort_order),
        });
    };

    const handleEditModule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingModule) return;
        moduleForm.put(`/admin/courses/${course.id}/modules/${editingModule.id}`, {
            onSuccess: () => {
                setEditingModule(null);
                moduleForm.reset();
            },
        });
    };

    const cancelEditModule = () => {
        setEditingModule(null);
        moduleForm.reset();
        moduleForm.setData('sort_order', String(course.modules.length));
    };

    const handleDeleteModule = (mod: ModuleData) => {
        if (confirm(`Delete module "${mod.title}" and all its lessons?`)) {
            router.delete(`/admin/courses/${course.id}/modules/${mod.id}`);
        }
    };

    // Lesson CRUD
    const startAddingLesson = (moduleId: number) => {
        setAddingLessonToModule(moduleId);
        setEditingLesson(null);
        lessonForm.reset();
        const mod = course.modules.find(m => m.id === moduleId);
        lessonForm.setData('sort_order', String(mod?.lessons.length ?? 0));
    };

    const handleAddLesson = (e: React.FormEvent) => {
        e.preventDefault();
        if (!addingLessonToModule) return;
        lessonForm.post(`/admin/courses/${course.id}/modules/${addingLessonToModule}/lessons`, {
            onSuccess: () => {
                setAddingLessonToModule(null);
                lessonForm.reset();
            },
        });
    };

    const startEditingLesson = (moduleId: number, lesson: LessonData) => {
        setEditingLesson({ moduleId, lesson });
        setAddingLessonToModule(null);
        lessonForm.setData({
            title: lesson.title,
            content_type: lesson.content_type,
            body: '',
            video_url: '',
            duration_minutes: lesson.duration_minutes ? String(lesson.duration_minutes) : '',
            sort_order: String(lesson.sort_order),
            is_free_preview: lesson.is_free_preview,
        });
    };

    const handleEditLesson = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLesson) return;
        lessonForm.put(`/admin/courses/${course.id}/modules/${editingLesson.moduleId}/lessons/${editingLesson.lesson.id}`, {
            onSuccess: () => {
                setEditingLesson(null);
                lessonForm.reset();
            },
        });
    };

    const handleDeleteLesson = (moduleId: number, lesson: LessonData) => {
        if (confirm(`Delete lesson "${lesson.title}"?`)) {
            router.delete(`/admin/courses/${course.id}/modules/${moduleId}/lessons/${lesson.id}`);
        }
    };

    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${course.title} - Modules`} />

            <div className="mx-auto max-w-5xl p-4">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{course.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {course.modules.length} modules, {totalLessons} lessons
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/admin/courses">Back to Courses</Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Module Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingModule ? `Edit Module` : 'Add Module'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={editingModule ? handleEditModule : handleAddModule} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mod_title">Title *</Label>
                                    <Input
                                        id="mod_title"
                                        value={moduleForm.data.title}
                                        onChange={(e) => moduleForm.setData('title', e.target.value)}
                                        placeholder="e.g. Introduction"
                                    />
                                    {moduleForm.errors.title && <p className="text-sm text-red-500">{moduleForm.errors.title}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mod_desc">Description</Label>
                                    <textarea
                                        id="mod_desc"
                                        value={moduleForm.data.description}
                                        onChange={(e) => moduleForm.setData('description', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mod_order">Sort Order</Label>
                                    <Input
                                        id="mod_order"
                                        type="number"
                                        min="0"
                                        value={moduleForm.data.sort_order}
                                        onChange={(e) => moduleForm.setData('sort_order', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="submit" disabled={moduleForm.processing}>
                                        {editingModule ? 'Update Module' : 'Add Module'}
                                    </Button>
                                    {editingModule && (
                                        <Button type="button" variant="outline" onClick={cancelEditModule}>Cancel</Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Modules & Lessons List */}
                    <div className="space-y-4 lg:col-span-2">
                        {course.modules.length === 0 && (
                            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                                No modules added yet. Use the form to add course modules.
                            </div>
                        )}
                        {course.modules.map((mod) => (
                            <Card key={mod.id} className={editingModule?.id === mod.id ? 'ring-2 ring-primary' : ''}>
                                <CardContent className="p-0">
                                    {/* Module header */}
                                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                        <button
                                            onClick={() => toggleModule(mod.id)}
                                            className="flex items-center gap-2 font-medium"
                                        >
                                            {expandedModules.has(mod.id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                            {mod.title}
                                            <span className="text-xs text-muted-foreground">({mod.lessons.length} lessons)</span>
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => startAddingLesson(mod.id)}>
                                                <Plus className="size-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => startEditingModule(mod)}>
                                                <Pencil className="size-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteModule(mod)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Lessons list */}
                                    {expandedModules.has(mod.id) && (
                                        <div className="divide-y divide-border">
                                            {mod.lessons.map((lesson) => (
                                                <div key={lesson.id} className={`flex items-center justify-between px-4 py-2 pl-10 ${editingLesson?.lesson.id === lesson.id ? 'bg-primary/5' : ''}`}>
                                                    <div>
                                                        <span className="text-sm font-medium">{lesson.title}</span>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Badge variant="outline" className="text-xs">{lesson.content_type_label}</Badge>
                                                            {lesson.duration_minutes && <span>{lesson.duration_minutes}min</span>}
                                                            {lesson.is_free_preview && <Badge variant="secondary" className="text-xs">Free Preview</Badge>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => startEditingLesson(mod.id, lesson)}>
                                                            <Pencil className="size-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteLesson(mod.id, lesson)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {mod.lessons.length === 0 && (
                                                <div className="px-4 py-4 pl-10 text-sm text-muted-foreground">
                                                    No lessons yet. Click + to add one.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Inline lesson form */}
                                    {(addingLessonToModule === mod.id || editingLesson?.moduleId === mod.id) && (
                                        <div className="border-t border-border bg-muted/30 p-4">
                                            <form onSubmit={editingLesson ? handleEditLesson : handleAddLesson} className="space-y-3">
                                                <p className="text-sm font-medium">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</p>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="l_title">Title *</Label>
                                                        <Input
                                                            id="l_title"
                                                            value={lessonForm.data.title}
                                                            onChange={(e) => lessonForm.setData('title', e.target.value)}
                                                        />
                                                        {lessonForm.errors.title && <p className="text-sm text-red-500">{lessonForm.errors.title}</p>}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="l_type">Type *</Label>
                                                        <select
                                                            id="l_type"
                                                            value={lessonForm.data.content_type}
                                                            onChange={(e) => lessonForm.setData('content_type', e.target.value)}
                                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="video">Video</option>
                                                            <option value="mixed">Mixed</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="l_duration">Duration (min)</Label>
                                                        <Input
                                                            id="l_duration"
                                                            type="number"
                                                            min="1"
                                                            value={lessonForm.data.duration_minutes}
                                                            onChange={(e) => lessonForm.setData('duration_minutes', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex items-end gap-2 pb-1">
                                                        <input
                                                            id="l_preview"
                                                            type="checkbox"
                                                            checked={lessonForm.data.is_free_preview}
                                                            onChange={(e) => lessonForm.setData('is_free_preview', e.target.checked)}
                                                            className="size-4 rounded border-input"
                                                        />
                                                        <Label htmlFor="l_preview">Free preview</Label>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button type="submit" size="sm" disabled={lessonForm.processing}>
                                                        {editingLesson ? 'Update' : 'Add Lesson'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setAddingLessonToModule(null); setEditingLesson(null); lessonForm.reset(); }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
