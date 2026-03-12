import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichEditor } from '@/components/admin/rich-editor';
import type { BreadcrumbItem } from '@/types';

type VolunteerRoleData = { id: number; name: string; description: string | null; ministry: { id: number; name: string } | null; is_active: boolean; };
type Props = { role: VolunteerRoleData; ministries: Array<{ id: number; name: string }> };

export default function VolunteerRoleEdit({ role: roleData, ministries }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' }, { title: 'Site Settings', href: '/admin/site-settings' }, { title: 'Edit Volunteer Role', href: `/admin/volunteer-roles/${roleData.id}/edit` },
    ];
    const { data, setData, put, processing, errors } = useForm({ name: roleData.name, description: roleData.description ?? '', ministry_id: roleData.ministry ? String(roleData.ministry.id) : '', is_active: roleData.is_active });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); put(`/admin/volunteer-roles/${roleData.id}`); };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Volunteer Role: ${roleData.name}`} />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/site-settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Site Settings</Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Volunteer Role</h1>
                    <p className="text-sm text-muted-foreground">Update role details.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Role Details" description="Name, description, and ministry.">
                        <div className="space-y-2"><Label htmlFor="name">Name *</Label><Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} /><InputError message={errors.name} /></div>
                        <div className="space-y-2"><Label htmlFor="description">Description</Label><RichEditor id="description" value={data.description} onChange={(html) => setData('description', html)} error={errors.description} /></div>
                        <div className="space-y-2">
                            <Label htmlFor="ministry_id">Ministry (optional)</Label>
                            <Select value={data.ministry_id} onValueChange={(v) => setData('ministry_id', v)}>
                                <SelectTrigger id="ministry_id"><SelectValue placeholder="No ministry" /></SelectTrigger>
                                <SelectContent>{ministries.map((m) => (<SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <InputError message={errors.ministry_id} />
                        </div>
                        <div className="flex items-center gap-2"><input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="size-4 rounded border-input" /><Label htmlFor="is_active">Active (available for scheduling)</Label></div>
                    </FormSection>
                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Update Role'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/site-settings">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
