import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, Trash2, Upload } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { RichEditor } from '@/components/admin/rich-editor';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

type ReviewData = {
    id: number;
    recommendation: string;
    recommendation_label: string;
    amount_recommended: string | null;
    comments: string | null;
    reviewed_at: string;
    reviewer: { id: number; name: string } | null;
};

type DisbursementData = {
    id: number;
    amount: string;
    method: string;
    method_label: string;
    reference_number: string | null;
    disbursed_at: string;
    notes: string | null;
    disbursed_by: { id: number; name: string } | null;
};

type EvidenceFile = {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    url: string;
};

type BenevolentRequestData = {
    id: number;
    requester_name: string;
    requester_contact: string | null;
    category: string;
    category_label: string;
    description: string;
    amount_requested: string | null;
    urgency: string;
    urgency_label: string;
    status: string;
    status_label: string;
    amount_approved: string | null;
    final_decision_notes: string | null;
    final_decision_at: string | null;
    final_decision_by: { id: number; name: string } | null;
    creator: { id: number; name: string } | null;
    reviews: ReviewData[];
    disbursements: DisbursementData[];
    evidence: EvidenceFile[];
    total_disbursed: number;
    created_at: string;
};

type EnumOption = { value: string; label: string };

type Props = {
    benevolentRequest: BenevolentRequestData;
    statuses: EnumOption[];
    recommendations: EnumOption[];
    disbursementMethods: EnumOption[];
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    partially_approved: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    disbursed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const recommendationColors: Record<string, string> = {
    approve: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    deny: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    needs_more_info: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function BenevolentRequestShow({ benevolentRequest: rawReq, statuses, recommendations, disbursementMethods }: Props) {
    const req = {
        ...rawReq,
        evidence: rawReq.evidence ?? [],
        reviews: rawReq.reviews ?? [],
        disbursements: rawReq.disbursements ?? [],
    };
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/benevolent-requests' },
        { title: 'Benevolent Requests', href: '/admin/benevolent-requests' },
        { title: req.requester_name, href: `/admin/benevolent-requests/${req.id}` },
    ];

    const reviewForm = useForm({
        recommendation: '',
        amount_recommended: '',
        comments: '',
        reviewed_at: new Date().toISOString().split('T')[0],
    });

    const decisionForm = useForm({
        status: '',
        amount_approved: req.amount_approved ?? '',
        final_decision_notes: '',
    });

    const disburseForm = useForm({
        amount: '',
        method: '',
        reference_number: '',
        disbursed_at: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const attachForm = useForm({
        evidence: [] as File[],
    });

    const handleReview = (e: React.FormEvent) => {
        e.preventDefault();
        reviewForm.post(`/admin/benevolent-requests/${req.id}/review`, {
            onSuccess: () => reviewForm.reset(),
        });
    };

    const handleDecision = (e: React.FormEvent) => {
        e.preventDefault();
        decisionForm.post(`/admin/benevolent-requests/${req.id}/decide`);
    };

    const handleDisburse = (e: React.FormEvent) => {
        e.preventDefault();
        disburseForm.post(`/admin/benevolent-requests/${req.id}/disburse`, {
            onSuccess: () => disburseForm.reset(),
        });
    };

    const handleAttach = (e: React.FormEvent) => {
        e.preventDefault();
        attachForm.post(`/admin/benevolent-requests/${req.id}/attachments`, {
            forceFormData: true,
            onSuccess: () => attachForm.reset(),
        });
    };

    const handleDelete = () => {
        if (confirm(`Delete benevolent request for "${req.requester_name}"?`)) {
            router.delete(`/admin/benevolent-requests/${req.id}`);
        }
    };

    const isApproved = ['approved', 'partially_approved'].includes(req.status);
    const isDecided = ['approved', 'partially_approved', 'denied', 'closed'].includes(req.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Request: ${req.requester_name}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/benevolent-requests">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{req.requester_name}</h1>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[req.status] ?? ''}`}>
                        {req.status_label}
                    </span>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column (2/3) */}
                    <div className="flex flex-col gap-6 lg:col-span-2">
                        {/* Request Details */}
                        <Card>
                            <CardHeader><CardTitle>Request Details</CardTitle></CardHeader>
                            <CardContent>
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Requester</dt>
                                        <dd className="mt-1 text-sm">{req.requester_name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Contact</dt>
                                        <dd className="mt-1 text-sm">{req.requester_contact ?? '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                                        <dd className="mt-1"><Badge variant="secondary">{req.category_label}</Badge></dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Urgency</dt>
                                        <dd className="mt-1"><Badge variant="outline">{req.urgency_label}</Badge></dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Amount Requested</dt>
                                        <dd className="mt-1 text-sm">{req.amount_requested ? `$${Number(req.amount_requested).toFixed(2)}` : '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Created By</dt>
                                        <dd className="mt-1 text-sm">{req.creator?.name ?? '-'}</dd>
                                    </div>
                                </dl>
                                {req.description && (
                                    <div className="mt-4 border-t pt-4">
                                        <dt className="mb-2 text-sm font-medium text-muted-foreground">Description</dt>
                                        <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: req.description }} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Evidence Files */}
                        <Card>
                            <CardHeader><CardTitle>Evidence Files</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {req.evidence.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No evidence files uploaded.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {req.evidence.map((file) => (
                                            <div key={file.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                                <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="size-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={handleAttach} className="flex items-end gap-3 border-t pt-4">
                                    <div className="flex-1 space-y-2">
                                        <Label>Add Files</Label>
                                        <Input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                                            onChange={(e) => attachForm.setData('evidence', e.target.files ? Array.from(e.target.files) : [])}
                                        />
                                        <InputError message={attachForm.errors.evidence} />
                                    </div>
                                    <Button type="submit" disabled={attachForm.processing || attachForm.data.evidence.length === 0} size="sm">
                                        <Upload className="mr-1 size-4" />
                                        Upload
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Committee Reviews */}
                        <Card>
                            <CardHeader><CardTitle>Committee Reviews ({req.reviews.length})</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {req.reviews.length > 0 && (
                                    <div className="space-y-3">
                                        {req.reviews.map((review) => (
                                            <div key={review.id} className="rounded border p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm">{review.reviewer?.name ?? 'Unknown'}</span>
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${recommendationColors[review.recommendation] ?? ''}`}>
                                                            {review.recommendation_label}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{new Date(review.reviewed_at).toLocaleDateString()}</span>
                                                </div>
                                                {review.amount_recommended && (
                                                    <p className="mt-1 text-sm">Recommended: ${Number(review.amount_recommended).toFixed(2)}</p>
                                                )}
                                                {review.comments && (
                                                    <p className="mt-1 text-sm text-muted-foreground">{review.comments}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={handleReview} className="space-y-4 border-t pt-4">
                                    <h4 className="font-medium text-sm">Add Your Review</h4>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Recommendation *</Label>
                                            <Select value={reviewForm.data.recommendation} onValueChange={(v) => reviewForm.setData('recommendation', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    {recommendations.map((r) => (
                                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={reviewForm.errors.recommendation} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount Recommended</Label>
                                            <Input type="number" step="0.01" min="0" value={reviewForm.data.amount_recommended} onChange={(e) => reviewForm.setData('amount_recommended', e.target.value)} placeholder="0.00" />
                                            <InputError message={reviewForm.errors.amount_recommended} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Comments</Label>
                                        <textarea
                                            value={reviewForm.data.comments}
                                            onChange={(e) => reviewForm.setData('comments', e.target.value)}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        <InputError message={reviewForm.errors.comments} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Review Date *</Label>
                                        <Input type="date" value={reviewForm.data.reviewed_at} onChange={(e) => reviewForm.setData('reviewed_at', e.target.value)} />
                                        <InputError message={reviewForm.errors.reviewed_at} />
                                    </div>
                                    <Button type="submit" disabled={reviewForm.processing} size="sm">
                                        {reviewForm.processing ? 'Submitting...' : 'Submit Review'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Disbursements */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Disbursements</CardTitle>
                                    {req.total_disbursed > 0 && (
                                        <span className="text-sm font-medium">Total: ${req.total_disbursed.toFixed(2)}</span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {req.disbursements.length > 0 && (
                                    <div className="overflow-x-auto rounded border">
                                        <table className="w-full text-sm">
                                            <thead className="border-b bg-muted/50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium">Amount</th>
                                                    <th className="px-3 py-2 text-left font-medium">Method</th>
                                                    <th className="px-3 py-2 text-left font-medium">Reference</th>
                                                    <th className="px-3 py-2 text-left font-medium">Date</th>
                                                    <th className="px-3 py-2 text-left font-medium">By</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {req.disbursements.map((d) => (
                                                    <tr key={d.id}>
                                                        <td className="px-3 py-2">${Number(d.amount).toFixed(2)}</td>
                                                        <td className="px-3 py-2"><Badge variant="outline">{d.method_label}</Badge></td>
                                                        <td className="px-3 py-2">{d.reference_number ?? '-'}</td>
                                                        <td className="px-3 py-2">{new Date(d.disbursed_at).toLocaleDateString()}</td>
                                                        <td className="px-3 py-2">{d.disbursed_by?.name ?? '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {req.disbursements.length === 0 && !isApproved && (
                                    <p className="text-sm text-muted-foreground">No disbursements recorded. Request must be approved first.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (1/3) */}
                    <div className="flex flex-col gap-6">
                        {/* Final Decision */}
                        <Card>
                            <CardHeader><CardTitle>Final Decision</CardTitle></CardHeader>
                            <CardContent>
                                {isDecided ? (
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">Decision</dt>
                                            <dd className="mt-1">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[req.status] ?? ''}`}>
                                                    {req.status_label}
                                                </span>
                                            </dd>
                                        </div>
                                        {req.amount_approved && (
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">Amount Approved</dt>
                                                <dd className="mt-1 text-sm">${Number(req.amount_approved).toFixed(2)}</dd>
                                            </div>
                                        )}
                                        {req.final_decision_by && (
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">Decided By</dt>
                                                <dd className="mt-1 text-sm">{req.final_decision_by.name}</dd>
                                            </div>
                                        )}
                                        {req.final_decision_at && (
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">Decision Date</dt>
                                                <dd className="mt-1 text-sm">{new Date(req.final_decision_at).toLocaleDateString()}</dd>
                                            </div>
                                        )}
                                        {req.final_decision_notes && (
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                                                <dd className="mt-1 text-sm">{req.final_decision_notes}</dd>
                                            </div>
                                        )}
                                    </dl>
                                ) : (
                                    <form onSubmit={handleDecision} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Decision *</Label>
                                            <Select value={decisionForm.data.status} onValueChange={(v) => decisionForm.setData('status', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select decision" /></SelectTrigger>
                                                <SelectContent>
                                                    {statuses.map((s) => (
                                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={decisionForm.errors.status} />
                                        </div>

                                        {['approved', 'partially_approved'].includes(decisionForm.data.status) && (
                                            <div className="space-y-2">
                                                <Label>Amount Approved *</Label>
                                                <Input type="number" step="0.01" min="0" value={decisionForm.data.amount_approved} onChange={(e) => decisionForm.setData('amount_approved', e.target.value)} />
                                                <InputError message={decisionForm.errors.amount_approved} />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label>Notes</Label>
                                            <textarea
                                                value={decisionForm.data.final_decision_notes}
                                                onChange={(e) => decisionForm.setData('final_decision_notes', e.target.value)}
                                                rows={3}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            />
                                            <InputError message={decisionForm.errors.final_decision_notes} />
                                        </div>

                                        <Button type="submit" disabled={decisionForm.processing} className="w-full">
                                            {decisionForm.processing ? 'Saving...' : 'Record Decision'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        {/* Record Disbursement (only when approved) */}
                        {isApproved && (
                            <Card>
                                <CardHeader><CardTitle>Record Disbursement</CardTitle></CardHeader>
                                <CardContent>
                                    <form onSubmit={handleDisburse} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Amount *</Label>
                                            <Input type="number" step="0.01" min="0.01" value={disburseForm.data.amount} onChange={(e) => disburseForm.setData('amount', e.target.value)} />
                                            <InputError message={disburseForm.errors.amount} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Method *</Label>
                                            <Select value={disburseForm.data.method} onValueChange={(v) => disburseForm.setData('method', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                                                <SelectContent>
                                                    {disbursementMethods.map((m) => (
                                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={disburseForm.errors.method} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Reference Number</Label>
                                            <Input value={disburseForm.data.reference_number} onChange={(e) => disburseForm.setData('reference_number', e.target.value)} />
                                            <InputError message={disburseForm.errors.reference_number} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date *</Label>
                                            <Input type="date" value={disburseForm.data.disbursed_at} onChange={(e) => disburseForm.setData('disbursed_at', e.target.value)} />
                                            <InputError message={disburseForm.errors.disbursed_at} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Notes</Label>
                                            <textarea
                                                value={disburseForm.data.notes}
                                                onChange={(e) => disburseForm.setData('notes', e.target.value)}
                                                rows={2}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            />
                                            <InputError message={disburseForm.errors.notes} />
                                        </div>
                                        <Button type="submit" disabled={disburseForm.processing} className="w-full">
                                            {disburseForm.processing ? 'Recording...' : 'Record Disbursement'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Delete */}
                        <Card>
                            <CardContent className="pt-6">
                                <Button variant="destructive" className="w-full" onClick={handleDelete}>
                                    <Trash2 className="mr-1 size-4" />
                                    Delete Request
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
