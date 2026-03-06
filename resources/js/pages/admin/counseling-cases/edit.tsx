import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import { RichEditor } from '@/components/admin/rich-editor';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

type EnumOption = { value: string; label: string };

type CounselingCaseData = {
    id: number;
    case_number: string;
    person_name: string;
    person_contact: string | null;
    person_email: string | null;
    case_type: string;
    status: string;
    presenting_issue: string;
    background_notes: string | null;
    referral_source: string | null;
    closure_reason: string | null;
    assigned_counselor: { id: number; name: string } | null;
};

type Props = {
    counselingCase: CounselingCaseData;
    caseTypes: EnumOption[];
    statuses: EnumOption[];
    counselors: Array<{ id: number; name: string }>;
    isAdmin: boolean;
};

export default function CounselingCaseEdit({ counselingCase: c, caseTypes, statuses, counselors, isAdmin }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/counseling-cases' },
        { title: 'Counseling Cases', href: '/admin/counseling-cases' },
        { title: c.case_number, href: `/admin/counseling-cases/${c.id}` },
        { title: 'Edit', href: `/admin/counseling-cases/${c.id}/edit` },
    ];

    const isClosed = ['closed_resolved', 'closed_referred', 'closed_unresolved'].includes(c.status);

    const { data, setData, put, processing, errors } = useForm({
        person_name: c.person_name,
        person_contact: c.person_contact ?? '',
        person_email: c.person_email ?? '',
        case_type: c.case_type,
        status: c.status,
        presenting_issue: c.presenting_issue,
        background_notes: c.background_notes ?? '',
        referral_source: c.referral_source ?? '',
        closure_reason: c.closure_reason ?? '',
        assigned_counselor_id: c.assigned_counselor ? String(c.assigned_counselor.id) : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/counseling-cases/${c.id}`);
    };

    const showClosureSection = ['closed_resolved', 'closed_referred', 'closed_unresolved'].includes(data.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Case: ${c.case_number}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href={`/admin/counseling-cases/${c.id}`} className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Case</Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Case: {c.case_number}</h1>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Person Information" description="Update person details.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="person_name">Name *</Label>
                                <Input id="person_name" value={data.person_name} onChange={(e) => setData('person_name', e.target.value)} />
                                <InputError message={errors.person_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="person_contact">Contact Info</Label>
                                <Input id="person_contact" value={data.person_contact} onChange={(e) => setData('person_contact', e.target.value)} />
                                <InputError message={errors.person_contact} />
                            </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="person_email">Email</Label>
                                <Input id="person_email" type="email" value={data.person_email} onChange={(e) => setData('person_email', e.target.value)} />
                                <InputError message={errors.person_email} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="referral_source">Referral Source</Label>
                                <Input id="referral_source" value={data.referral_source} onChange={(e) => setData('referral_source', e.target.value)} />
                                <InputError message={errors.referral_source} />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Case Details" description="Update case type, status, and details.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="case_type">Case Type *</Label>
                                <Select value={data.case_type} onValueChange={(v) => setData('case_type', v)}>
                                    <SelectTrigger id="case_type"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {caseTypes.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.case_type} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="presenting_issue">Presenting Issue *</Label>
                            <RichEditor id="presenting_issue" value={data.presenting_issue} onChange={(html) => setData('presenting_issue', html)} error={errors.presenting_issue} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="background_notes">Background Notes</Label>
                            <textarea id="background_notes" value={data.background_notes} onChange={(e) => setData('background_notes', e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                            <InputError message={errors.background_notes} />
                        </div>
                    </FormSection>

                    {showClosureSection && (
                        <FormSection title="Closure" description="Reason for closing the case.">
                            <div className="space-y-2">
                                <Label htmlFor="closure_reason">Closure Reason</Label>
                                <textarea id="closure_reason" value={data.closure_reason} onChange={(e) => setData('closure_reason', e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                                <InputError message={errors.closure_reason} />
                            </div>
                        </FormSection>
                    )}

                    {isAdmin && (
                        <FormSection title="Assignment" description="Change the assigned counselor.">
                            <div className="space-y-2">
                                <Label htmlFor="assigned_counselor_id">Assigned Counselor</Label>
                                <Select value={data.assigned_counselor_id || 'none'} onValueChange={(v) => setData('assigned_counselor_id', v === 'none' ? '' : v)}>
                                    <SelectTrigger id="assigned_counselor_id"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {counselors.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.assigned_counselor_id} />
                            </div>
                        </FormSection>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save Changes'}</Button>
                        <Button variant="outline" asChild><Link href={`/admin/counseling-cases/${c.id}`}>Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
