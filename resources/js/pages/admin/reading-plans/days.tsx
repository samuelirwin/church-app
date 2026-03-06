import { Head, Link, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

type DayData = {
    id: number;
    day_number: number;
    title: string;
    scripture_reference: string;
    reflection: string | null;
};

type PlanData = {
    id: number;
    title: string;
    duration_days: number;
    days: DayData[];
};

type Props = {
    plan: { data: PlanData };
};

export default function ReadingPlanDays({ plan: { data: plan } }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/reading-plans' },
        { title: 'Reading Plans', href: '/admin/reading-plans' },
        { title: plan.title, href: `/admin/reading-plans/${plan.id}` },
        { title: 'Days', href: `/admin/reading-plans/${plan.id}` },
    ];

    const [editingDay, setEditingDay] = useState<DayData | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        day_number: String(plan.days.length + 1),
        title: '',
        scripture_reference: '',
        reflection: '',
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/reading-plans/${plan.id}/days`, {
            onSuccess: () => {
                reset();
                setData('day_number', String(plan.days.length + 2));
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDay) return;
        put(`/admin/reading-plans/${plan.id}/days/${editingDay.id}`, {
            onSuccess: () => {
                setEditingDay(null);
                reset();
            },
        });
    };

    const startEditing = (day: DayData) => {
        setEditingDay(day);
        setData({
            day_number: String(day.day_number),
            title: day.title,
            scripture_reference: day.scripture_reference,
            reflection: day.reflection ?? '',
        });
    };

    const cancelEditing = () => {
        setEditingDay(null);
        reset();
        setData('day_number', String(plan.days.length + 1));
    };

    const handleDelete = (day: DayData) => {
        if (confirm(`Delete Day ${day.day_number}: "${day.title}"?`)) {
            router.delete(`/admin/reading-plans/${plan.id}/days/${day.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${plan.title} - Days`} />

            <div className="mx-auto max-w-4xl p-4">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{plan.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {plan.days.length} of {plan.duration_days} days configured
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/admin/reading-plans">Back to Plans</Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Day Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{editingDay ? `Edit Day ${editingDay.day_number}` : 'Add Day'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={editingDay ? handleEdit : handleAdd} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="day_number">Day # *</Label>
                                        <Input
                                            id="day_number"
                                            type="number"
                                            min="1"
                                            value={data.day_number}
                                            onChange={(e) => setData('day_number', e.target.value)}
                                        />
                                        {errors.day_number && <p className="text-sm text-red-500">{errors.day_number}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scripture_reference">Scripture *</Label>
                                        <Input
                                            id="scripture_reference"
                                            value={data.scripture_reference}
                                            onChange={(e) => setData('scripture_reference', e.target.value)}
                                            placeholder="e.g. Genesis 1:1-31"
                                        />
                                        {errors.scripture_reference && <p className="text-sm text-red-500">{errors.scripture_reference}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g. In the Beginning"
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reflection">Reflection</Label>
                                    <textarea
                                        id="reflection"
                                        value={data.reflection}
                                        onChange={(e) => setData('reflection', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Optional reflection or study notes..."
                                    />
                                    {errors.reflection && <p className="text-sm text-red-500">{errors.reflection}</p>}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button type="submit" disabled={processing}>
                                        {editingDay ? 'Update Day' : 'Add Day'}
                                    </Button>
                                    {editingDay && (
                                        <Button type="button" variant="outline" onClick={cancelEditing}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Days List */}
                    <div className="space-y-3">
                        {plan.days.length === 0 && (
                            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                                No days added yet. Use the form to add daily readings.
                            </div>
                        )}
                        {plan.days.map((day) => (
                            <Card key={day.id} className={editingDay?.id === day.id ? 'ring-2 ring-primary' : ''}>
                                <CardContent className="flex items-start justify-between gap-3 py-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {day.day_number}
                                            </span>
                                            <span className="font-medium">{day.title}</span>
                                        </div>
                                        <p className="mt-1 pl-9 text-sm text-muted-foreground">{day.scripture_reference}</p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => startEditing(day)}>
                                            <Pencil className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(day)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
