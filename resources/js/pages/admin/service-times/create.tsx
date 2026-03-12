import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Site Settings', href: '/admin/site-settings' },
    { title: 'Create Service Time', href: '/admin/service-times/create' },
];

export default function ServiceTimeCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        start_time: '',
        end_time: '',
        sort_order: '0',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/service-times');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Service Time" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/site-settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Site Settings</Link>
                    <h1 className="mt-2 text-2xl font-bold">Create Service Time</h1>
                    <p className="text-sm text-muted-foreground">Define a new service time slot.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Service Time Details" description="Name, time range, and display order.">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="start_time">Start Time</Label>
                                <Input id="start_time" type="time" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} />
                                <InputError message={errors.start_time} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_time">End Time</Label>
                                <Input id="end_time" type="time" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} />
                                <InputError message={errors.end_time} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input id="sort_order" type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                            <InputError message={errors.sort_order} />
                        </div>

                        <div className="flex items-center gap-2">
                            <input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="size-4 rounded border-input" />
                            <Label htmlFor="is_active">Active (available for scheduling)</Label>
                        </div>
                    </FormSection>


                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Service Time'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/site-settings">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
