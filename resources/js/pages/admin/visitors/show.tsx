import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

type FollowUpData = {
    id: number;
    type: string;
    type_label: string;
    notes: string | null;
    followed_up_at: string;
    user: { id: number; name: string } | null;
};

type VisitorData = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    first_visit_date: string;
    how_heard: string | null;
    prayer_requests: string | null;
    notes: string | null;
    status: string;
    status_label: string;
    assigned_to: number | null;
    assigned_user: { id: number; name: string } | null;
    converted_user: { id: number; name: string } | null;
    follow_ups: FollowUpData[];
};

type UserOption = {
    id: number;
    name: string;
};

type StatusOption = {
    value: string;
    label: string;
};

type FollowUpTypeOption = {
    value: string;
    label: string;
};

type Props = {
    visitor: VisitorData;
    users: UserOption[];
    statuses: StatusOption[];
    followUpTypes: FollowUpTypeOption[];
    isStaffOrAbove: boolean;
    canConvert: boolean;
};

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    follow_up: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    connected: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const followUpTypeColors: Record<string, string> = {
    call: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    email: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    visit: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    text: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
};

export default function VisitorShow({ visitor, users, statuses, followUpTypes, isStaffOrAbove, canConvert: canConvertProp }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Visitors', href: '/admin/visitors' },
        { title: visitor.name, href: `/admin/visitors/${visitor.id}` },
    ];

    const updateForm = useForm({
        notes: visitor.notes ?? '',
        status: visitor.status,
        assigned_to: visitor.assigned_to ? String(visitor.assigned_to) : '',
    });

    const followUpForm = useForm({
        type: '',
        notes: '',
        followed_up_at: new Date().toISOString().split('T')[0],
    });

    const convertForm = useForm({});

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateForm.patch(`/admin/visitors/${visitor.id}`);
    };

    const handleFollowUp = (e: React.FormEvent) => {
        e.preventDefault();
        followUpForm.post(`/admin/visitors/${visitor.id}/follow-up`, {
            onSuccess: () => {
                followUpForm.reset();
                followUpForm.setData('followed_up_at', new Date().toISOString().split('T')[0]);
            },
        });
    };

    const handleConvert = () => {
        if (confirm(`Convert "${visitor.name}" to a member? This will create a user account with their email address.`)) {
            convertForm.post(`/admin/visitors/${visitor.id}/convert`);
        }
    };

    const canConvert = canConvertProp && !visitor.converted_user && visitor.email;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Visitor: ${visitor.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/visitors">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{visitor.name}</h1>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[visitor.status] ?? 'bg-gray-100 text-gray-800'}`}>
                        {visitor.status_label}
                    </span>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column - Visitor Details */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Visitor Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                                        <dd className="mt-1 text-sm">{visitor.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                                        <dd className="mt-1 text-sm">{visitor.email ?? '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                                        <dd className="mt-1 text-sm">{visitor.phone ?? '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                                        <dd className="mt-1 text-sm">{visitor.address ?? '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">First Visit Date</dt>
                                        <dd className="mt-1 text-sm">{new Date(visitor.first_visit_date).toLocaleDateString()}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">How They Heard About Us</dt>
                                        <dd className="mt-1 text-sm">{visitor.how_heard ?? '-'}</dd>
                                    </div>
                                    {visitor.prayer_requests && (
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">Prayer Requests</dt>
                                            <dd className="mt-1 whitespace-pre-wrap text-sm">{visitor.prayer_requests}</dd>
                                        </div>
                                    )}
                                    {visitor.converted_user && (
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">Converted to Member</dt>
                                            <dd className="mt-1 text-sm">
                                                <Badge variant="default">{visitor.converted_user.name}</Badge>
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Update Visitor</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={updateForm.data.status}
                                            onValueChange={(v) => updateForm.setData('status', v)}
                                        >
                                            <SelectTrigger id="status">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {updateForm.errors.status && <p className="text-sm text-red-500">{updateForm.errors.status}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="assigned_to">Assigned To</Label>
                                        <Select
                                            value={updateForm.data.assigned_to || 'none'}
                                            onValueChange={(v) => updateForm.setData('assigned_to', v === 'none' ? '' : v)}
                                        >
                                            <SelectTrigger id="assigned_to">
                                                <SelectValue placeholder="Unassigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Unassigned</SelectItem>
                                                {users.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {updateForm.errors.assigned_to && <p className="text-sm text-red-500">{updateForm.errors.assigned_to}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <textarea
                                            id="notes"
                                            value={updateForm.data.notes}
                                            onChange={(e) => updateForm.setData('notes', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        {updateForm.errors.notes && <p className="text-sm text-red-500">{updateForm.errors.notes}</p>}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isStaffOrAbove && (
                                            <Button type="submit" disabled={updateForm.processing}>
                                                {updateForm.processing ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        )}

                                        {canConvert && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleConvert}
                                                disabled={convertForm.processing}
                                            >
                                                <UserPlus className="mr-1 size-4" />
                                                {convertForm.processing ? 'Converting...' : 'Convert to Member'}
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Follow-up Timeline */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Follow-up</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleFollowUp} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="follow_up_type">Type *</Label>
                                        <Select
                                            value={followUpForm.data.type}
                                            onValueChange={(v) => followUpForm.setData('type', v)}
                                        >
                                            <SelectTrigger id="follow_up_type">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {followUpTypes.map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {followUpForm.errors.type && <p className="text-sm text-red-500">{followUpForm.errors.type}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="follow_up_notes">Notes</Label>
                                        <textarea
                                            id="follow_up_notes"
                                            value={followUpForm.data.notes}
                                            onChange={(e) => followUpForm.setData('notes', e.target.value)}
                                            rows={3}
                                            placeholder="Details about the follow-up..."
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        {followUpForm.errors.notes && <p className="text-sm text-red-500">{followUpForm.errors.notes}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="followed_up_at">Date *</Label>
                                        <Input
                                            id="followed_up_at"
                                            type="date"
                                            value={followUpForm.data.followed_up_at}
                                            onChange={(e) => followUpForm.setData('followed_up_at', e.target.value)}
                                        />
                                        {followUpForm.errors.followed_up_at && <p className="text-sm text-red-500">{followUpForm.errors.followed_up_at}</p>}
                                    </div>

                                    <Button type="submit" disabled={followUpForm.processing}>
                                        {followUpForm.processing ? 'Adding...' : 'Add Follow-up'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Follow-up History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {visitor.follow_ups.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No follow-ups recorded yet.</p>
                                ) : (
                                    <div className="relative space-y-0">
                                        {visitor.follow_ups.map((followUp, index) => (
                                            <div key={followUp.id} className="relative pb-6 last:pb-0">
                                                {index < visitor.follow_ups.length - 1 && (
                                                    <span className="absolute left-3.5 top-8 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                                                )}
                                                <div className="relative flex items-start gap-3">
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
                                                        <div className="size-2 rounded-full bg-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${followUpTypeColors[followUp.type] ?? 'bg-gray-100 text-gray-800'}`}>
                                                                {followUp.type_label}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(followUp.followed_up_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {followUp.notes && (
                                                            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{followUp.notes}</p>
                                                        )}
                                                        {followUp.user && (
                                                            <p className="mt-1 text-xs text-muted-foreground">by {followUp.user.name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
