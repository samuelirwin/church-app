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
    categories: EnumOption[];
    urgencies: EnumOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/benevolent-requests' },
    { title: 'Benevolent Requests', href: '/admin/benevolent-requests' },
    { title: 'New', href: '/admin/benevolent-requests/create' },
];

export default function BenevolentRequestCreate({ categories, urgencies }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm({
        requester_name: '',
        requester_contact: '',
        category: '',
        description: '',
        amount_requested: '',
        urgency: '',
        evidence: [] as File[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/benevolent-requests', {
            forceFormData: true,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setData('evidence', Array.from(files));
        }
    };

    const removeFile = (index: number) => {
        setData('evidence', data.evidence.filter((_, i) => i !== index));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Benevolent Request" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/benevolent-requests" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Requests</Link>
                    <h1 className="mt-2 text-2xl font-bold">New Benevolent Request</h1>
                    <p className="text-sm text-muted-foreground">Create a request for financial or material assistance.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Requester Information" description="Details about the person requesting assistance.">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="requester_name">Name *</Label>
                                <Input id="requester_name" value={data.requester_name} onChange={(e) => setData('requester_name', e.target.value)} />
                                <InputError message={errors.requester_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="requester_contact">Contact Info</Label>
                                <Input id="requester_contact" value={data.requester_contact} onChange={(e) => setData('requester_contact', e.target.value)} placeholder="Phone, email, or address" />
                                <InputError message={errors.requester_contact} />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Request Details" description="Category, urgency, and description of the need.">
                        <div className="grid gap-6 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                                    <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.category} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="urgency">Urgency *</Label>
                                <Select value={data.urgency} onValueChange={(v) => setData('urgency', v)}>
                                    <SelectTrigger id="urgency"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                                    <SelectContent>
                                        {urgencies.map((u) => (
                                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.urgency} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount_requested">Amount Requested</Label>
                                <Input id="amount_requested" type="number" step="0.01" min="0" value={data.amount_requested} onChange={(e) => setData('amount_requested', e.target.value)} placeholder="0.00" />
                                <InputError message={errors.amount_requested} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <RichEditor
                                id="description"
                                value={data.description}
                                onChange={(html) => setData('description', html)}
                                error={errors.description}
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Evidence Files" description="Upload supporting documents (max 10 files, 20MB each).">
                        <div className="space-y-2">
                            <Input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-muted-foreground">PDF, Word documents, or images. Max 20MB per file.</p>
                            <InputError message={errors.evidence} />
                        </div>

                        {data.evidence.length > 0 && (
                            <div className="space-y-2">
                                {data.evidence.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                        <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormSection>

                    {progress && (
                        <div className="h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Request'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/benevolent-requests">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
