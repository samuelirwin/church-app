import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

type ServiceTimeData = {
    id: number;
    name: string;
    slug: string;
    start_time: string | null;
    end_time: string | null;
    sort_order: number;
    is_active: boolean;
};

type Props = {
    serviceTime: ServiceTimeData;
};

export default function ServiceTimeEdit({ serviceTime }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Site Settings', href: '/admin/site-settings' },
        { title: 'Edit Service Time', href: `/admin/service-times/${serviceTime.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: serviceTime.name,
        start_time: serviceTime.start_time?.slice(0, 5) ?? '',
        end_time: serviceTime.end_time?.slice(0, 5) ?? '',
        sort_order: String(serviceTime.sort_order),
        is_active: serviceTime.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/service-times/${serviceTime.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Service Time: ${serviceTime.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/site-settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Site Settings</Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Service Time</h1>
                    <p className="text-sm text-muted-foreground">Update service time details.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
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
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Update Service Time'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/site-settings">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
