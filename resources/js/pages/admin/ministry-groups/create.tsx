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

type Props = { ministries: Array<{ id: number; name: string }>; users: Array<{ id: number; name: string }> };
const DAYS_OF_WEEK = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/ministry-groups' }, { title: 'Ministry Groups', href: '/admin/ministry-groups' }, { title: 'Add', href: '/admin/ministry-groups/create' },
];

export default function MinistryGroupCreate({ ministries, users }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', description: '', ministry_id: '', leader_id: '', max_members: '', meeting_day: '', meeting_time: '', meeting_location: '', is_active: true,
    });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); post('/admin/ministry-groups'); };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Ministry Group" />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/ministry-groups" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Ministry Groups</Link>
                    <h1 className="mt-2 text-2xl font-bold">Add Ministry Group</h1>
                    <p className="text-sm text-muted-foreground">Create a new group within a ministry.</p>
                </div>
                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Group Details" description="Name and description.">
                        <div className="space-y-2"><Label htmlFor="name">Name *</Label><Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} /><InputError message={errors.name} /></div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <RichEditor
                                id="description"
                                value={data.description}
                                onChange={(html) => setData('description', html)}
                                error={errors.description}
                            />
                        </div>
                    </FormSection>
                    <FormSection title="Assignment" description="Ministry, leader, and capacity.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ministry_id">Ministry *</Label>
                                <Select value={data.ministry_id} onValueChange={(v) => setData('ministry_id', v)}>
                                    <SelectTrigger id="ministry_id"><SelectValue placeholder="Select ministry" /></SelectTrigger>
                                    <SelectContent>{ministries.map((m) => (<SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>))}</SelectContent>
                                </Select>
                                <InputError message={errors.ministry_id} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="leader_id">Leader</Label>
                                <Select value={data.leader_id} onValueChange={(v) => setData('leader_id', v)}>
                                    <SelectTrigger id="leader_id"><SelectValue placeholder="No leader" /></SelectTrigger>
                                    <SelectContent>{users.map((u) => (<SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>))}</SelectContent>
                                </Select>
                                <InputError message={errors.leader_id} />
                            </div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="max_members">Max Members</Label><Input id="max_members" type="number" min={1} value={data.max_members} onChange={(e) => setData('max_members', e.target.value)} placeholder="Unlimited" /><InputError message={errors.max_members} /></div>
                    </FormSection>
                    <FormSection title="Meeting Schedule" description="Day, time, and location.">
                        <div className="grid gap-6 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="meeting_day">Meeting Day</Label>
                                <Select value={data.meeting_day} onValueChange={(v) => setData('meeting_day', v)}>
                                    <SelectTrigger id="meeting_day"><SelectValue placeholder="No day" /></SelectTrigger>
                                    <SelectContent>{DAYS_OF_WEEK.map((day) => (<SelectItem key={day} value={day}>{day}</SelectItem>))}</SelectContent>
                                </Select>
                                <InputError message={errors.meeting_day} />
                            </div>
                            <div className="space-y-2"><Label htmlFor="meeting_time">Meeting Time</Label><Input id="meeting_time" type="time" value={data.meeting_time} onChange={(e) => setData('meeting_time', e.target.value)} /><InputError message={errors.meeting_time} /></div>
                            <div className="space-y-2"><Label htmlFor="meeting_location">Meeting Location</Label><Input id="meeting_location" value={data.meeting_location} onChange={(e) => setData('meeting_location', e.target.value)} placeholder="e.g. Room 3B" /><InputError message={errors.meeting_location} /></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="size-4 rounded border-input" />
                            <Label htmlFor="is_active">Active (visible to members)</Label>
                        </div>
                    </FormSection>
                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Adding...' : 'Add Group'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/ministry-groups">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
