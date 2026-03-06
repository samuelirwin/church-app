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

type Props = {
    caseTypes: EnumOption[];
    counselors: Array<{ id: number; name: string }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/counseling-cases' },
    { title: 'Counseling Cases', href: '/admin/counseling-cases' },
    { title: 'New', href: '/admin/counseling-cases/create' },
];

export default function CounselingCaseCreate({ caseTypes, counselors }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        person_name: '',
        person_contact: '',
        person_email: '',
        case_type: '',
        presenting_issue: '',
        background_notes: '',
        referral_source: '',
        assigned_counselor_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/counseling-cases');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Counseling Case" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/counseling-cases" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Cases</Link>
                    <h1 className="mt-2 text-2xl font-bold">New Counseling Case</h1>
                    <p className="text-sm text-muted-foreground">Open a new counseling case for a person.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Person Information" description="Basic details about the person.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="person_name">Name *</Label>
                                <Input id="person_name" value={data.person_name} onChange={(e) => setData('person_name', e.target.value)} />
                                <InputError message={errors.person_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="person_contact">Contact Info</Label>
                                <Input id="person_contact" value={data.person_contact} onChange={(e) => setData('person_contact', e.target.value)} placeholder="Phone or address" />
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
                                <Input id="referral_source" value={data.referral_source} onChange={(e) => setData('referral_source', e.target.value)} placeholder="How did they find us?" />
                                <InputError message={errors.referral_source} />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Case Details" description="Type and presenting issue.">
                        <div className="space-y-2">
                            <Label htmlFor="case_type">Case Type *</Label>
                            <Select value={data.case_type} onValueChange={(v) => setData('case_type', v)}>
                                <SelectTrigger id="case_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    {caseTypes.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.case_type} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="presenting_issue">Presenting Issue *</Label>
                            <RichEditor
                                id="presenting_issue"
                                value={data.presenting_issue}
                                onChange={(html) => setData('presenting_issue', html)}
                                error={errors.presenting_issue}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="background_notes">Background Notes</Label>
                            <textarea
                                id="background_notes"
                                value={data.background_notes}
                                onChange={(e) => setData('background_notes', e.target.value)}
                                rows={4}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <InputError message={errors.background_notes} />
                        </div>
                    </FormSection>

                    <FormSection title="Assignment" description="Assign a counselor to this case.">
                        <div className="space-y-2">
                            <Label htmlFor="assigned_counselor_id">Assigned Counselor</Label>
                            <Select value={data.assigned_counselor_id} onValueChange={(v) => setData('assigned_counselor_id', v)}>
                                <SelectTrigger id="assigned_counselor_id"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                <SelectContent>
                                    {counselors.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.assigned_counselor_id} />
                        </div>
                    </FormSection>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Case'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/counseling-cases">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
