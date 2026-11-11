import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, Pencil, Upload } from 'lucide-react';
import { RichEditor } from '@/components/admin/rich-editor';
import InputError from '@/components/input-error';
import { DatePicker } from '@/components/shared/date-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type SessionData = {
    id: number;
    session_date: string;
    duration_minutes: number;
    session_type: string;
    session_type_label: string;
    notes: string | null;
    mood_rating: number | null;
    progress_notes: string | null;
    next_session_date: string | null;
    counselor: { id: number; name: string } | null;
    documents: Array<{ id: number; name: string; size: number; url: string }>;
};

type GoalData = {
    id: number;
    title: string;
    description: string | null;
    target_date: string | null;
    status: string;
    status_label: string;
    priority: number;
    is_achieved: boolean;
    created_by: { id: number; name: string } | null;
};

type ReferralData = {
    id: number;
    referred_to: string;
    referral_type: string;
    referral_type_label: string;
    referral_date: string;
    reason: string;
    outcome: string | null;
    referred_by: { id: number; name: string } | null;
    documents: Array<{ id: number; name: string; size: number; url: string }>;
};

type CaseDocument = {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    url: string;
};

type CounselingCaseData = {
    id: number;
    case_number: string;
    person_name: string;
    person_contact: string | null;
    person_email: string | null;
    case_type: string;
    case_type_label: string;
    status: string;
    status_label: string;
    presenting_issue: string;
    background_notes: string | null;
    referral_source: string | null;
    opened_at: string;
    closed_at: string | null;
    closure_reason: string | null;
    assigned_counselor: { id: number; name: string } | null;
    opened_by: { id: number; name: string } | null;
    sessions: SessionData[];
    goals: GoalData[];
    referrals: ReferralData[];
    case_documents: CaseDocument[];
};

type EnumOption = { value: string; label: string };

type Props = {
    counselingCase: CounselingCaseData;
    statuses: EnumOption[];
    sessionTypes: EnumOption[];
    goalStatuses: EnumOption[];
    referralTypes: EnumOption[];
    isAdmin: boolean;
};

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    on_hold:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    closed_resolved:
        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    closed_referred:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    closed_unresolved:
        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const goalStatusColors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    in_progress:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    achieved:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    deferred: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function CounselingCaseShow({
    counselingCase: c,
    statuses,
    sessionTypes,
    goalStatuses,
    referralTypes,
    isAdmin,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/counseling-cases' },
        { title: 'Counseling Cases', href: '/admin/counseling-cases' },
        { title: c.case_number, href: `/admin/counseling-cases/${c.id}` },
    ];

    const sessionForm = useForm({
        session_date: new Date().toISOString().slice(0, 16),
        duration_minutes: '60',
        session_type: '',
        notes: '',
        mood_rating: '',
        progress_notes: '',
        next_session_date: '',
        session_document: null as File | null,
    });

    const goalForm = useForm({
        title: '',
        description: '',
        target_date: '',
    });

    const referralForm = useForm({
        referred_to: '',
        referral_type: '',
        referral_date: new Date().toISOString().split('T')[0],
        reason: '',
        referral_document: null as File | null,
    });

    const attachForm = useForm({
        documents: [] as File[],
    });

    const handleSession = (e: React.FormEvent) => {
        e.preventDefault();
        sessionForm.post(`/admin/counseling-cases/${c.id}/sessions`, {
            forceFormData: true,
            onSuccess: () => sessionForm.reset(),
        });
    };

    const handleGoal = (e: React.FormEvent) => {
        e.preventDefault();
        goalForm.post(`/admin/counseling-cases/${c.id}/goals`, {
            onSuccess: () => goalForm.reset(),
        });
    };

    const handleGoalUpdate = (goalId: number, status: string) => {
        const goal = c.goals.find((g) => g.id === goalId);
        if (!goal) return;
        router.put(`/admin/counseling-cases/${c.id}/goals/${goalId}`, {
            title: goal.title,
            description: goal.description ?? '',
            target_date: goal.target_date ?? '',
            status,
        });
    };

    const handleReferral = (e: React.FormEvent) => {
        e.preventDefault();
        referralForm.post(`/admin/counseling-cases/${c.id}/referrals`, {
            forceFormData: true,
            onSuccess: () => referralForm.reset(),
        });
    };

    const handleAttach = (e: React.FormEvent) => {
        e.preventDefault();
        attachForm.post(`/admin/counseling-cases/${c.id}/attachments`, {
            forceFormData: true,
            onSuccess: () => attachForm.reset(),
        });
    };

    const achievedGoals = c.goals.filter((g) => g.is_achieved).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Case: ${c.case_number}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/counseling-cases">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">
                        {c.case_number}: {c.person_name}
                    </h1>
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[c.status] ?? ''}`}
                    >
                        {c.status_label}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/counseling-cases/${c.id}/edit`}>
                            <Pencil className="mr-1 size-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <Tabs defaultValue="overview">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="sessions">
                            Sessions ({c.sessions.length})
                        </TabsTrigger>
                        <TabsTrigger value="goals">
                            Goals ({achievedGoals}/{c.goals.length})
                        </TabsTrigger>
                        <TabsTrigger value="referrals">
                            Referrals ({c.referrals.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6 pt-4">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Person Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Name
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {c.person_name}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Contact
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {c.person_contact ?? '-'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Email
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {c.person_email ?? '-'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Referral Source
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {c.referral_source ?? '-'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Counselor
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {c.assigned_counselor?.name ??
                                                    'Unassigned'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Opened By
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {c.opened_by?.name ?? '-'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Opened
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {new Date(
                                                    c.opened_at,
                                                ).toLocaleDateString()}
                                            </dd>
                                        </div>
                                        {c.closed_at && (
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">
                                                    Closed
                                                </dt>
                                                <dd className="mt-1 text-sm">
                                                    {new Date(
                                                        c.closed_at,
                                                    ).toLocaleDateString()}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Case Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="space-y-3">
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Case Type
                                            </dt>
                                            <dd className="mt-1">
                                                <Badge variant="secondary">
                                                    {c.case_type_label}
                                                </Badge>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">
                                                Presenting Issue
                                            </dt>
                                            <dd
                                                className="prose prose-sm mt-1 max-w-none dark:prose-invert"
                                                dangerouslySetInnerHTML={{
                                                    __html: c.presenting_issue,
                                                }}
                                            />
                                        </div>
                                        {c.background_notes && (
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">
                                                    Background Notes
                                                </dt>
                                                <dd className="mt-1 text-sm whitespace-pre-wrap">
                                                    {c.background_notes}
                                                </dd>
                                            </div>
                                        )}
                                        {c.closure_reason && (
                                            <div>
                                                <dt className="text-sm font-medium text-muted-foreground">
                                                    Closure Reason
                                                </dt>
                                                <dd className="mt-1 text-sm">
                                                    {c.closure_reason}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Case Documents */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Case Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {c.case_documents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No documents uploaded.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {c.case_documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                                            >
                                                <span>
                                                    {doc.name} (
                                                    {(
                                                        doc.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{' '}
                                                    MB)
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Download className="size-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <form
                                    onSubmit={handleAttach}
                                    className="flex items-end gap-3 border-t pt-4"
                                >
                                    <div className="flex-1 space-y-2">
                                        <Label>Add Documents</Label>
                                        <Input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                                            onChange={(e) =>
                                                attachForm.setData(
                                                    'documents',
                                                    e.target.files
                                                        ? Array.from(
                                                              e.target.files,
                                                          )
                                                        : [],
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                attachForm.errors.documents
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={
                                            attachForm.processing ||
                                            attachForm.data.documents.length ===
                                                0
                                        }
                                        size="sm"
                                    >
                                        <Upload className="mr-1 size-4" />
                                        Upload
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sessions Tab */}
                    <TabsContent value="sessions" className="space-y-6 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Log New Session</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleSession}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Date/Time *</Label>
                                            <Input
                                                type="datetime-local"
                                                value={
                                                    sessionForm.data
                                                        .session_date
                                                }
                                                onChange={(e) =>
                                                    sessionForm.setData(
                                                        'session_date',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    sessionForm.errors
                                                        .session_date
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Duration (min) *</Label>
                                            <Input
                                                type="number"
                                                min="5"
                                                max="480"
                                                value={
                                                    sessionForm.data
                                                        .duration_minutes
                                                }
                                                onChange={(e) =>
                                                    sessionForm.setData(
                                                        'duration_minutes',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    sessionForm.errors
                                                        .duration_minutes
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type *</Label>
                                            <Select
                                                value={
                                                    sessionForm.data
                                                        .session_type
                                                }
                                                onValueChange={(v) =>
                                                    sessionForm.setData(
                                                        'session_type',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sessionTypes.map((t) => (
                                                        <SelectItem
                                                            key={t.value}
                                                            value={t.value}
                                                        >
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={
                                                    sessionForm.errors
                                                        .session_type
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Mood Rating (1-10)</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={
                                                    sessionForm.data.mood_rating
                                                }
                                                onChange={(e) =>
                                                    sessionForm.setData(
                                                        'mood_rating',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="1-10"
                                            />
                                            <InputError
                                                message={
                                                    sessionForm.errors
                                                        .mood_rating
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Next Session Date</Label>
                                            <DatePicker
                                                value={
                                                    sessionForm.data
                                                        .next_session_date
                                                }
                                                onChange={(value) =>
                                                    sessionForm.setData(
                                                        'next_session_date',
                                                        value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    sessionForm.errors
                                                        .next_session_date
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Session Notes</Label>
                                        <RichEditor
                                            id="session_notes"
                                            value={sessionForm.data.notes}
                                            onChange={(html) =>
                                                sessionForm.setData(
                                                    'notes',
                                                    html,
                                                )
                                            }
                                            error={sessionForm.errors.notes}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Progress Notes</Label>
                                        <textarea
                                            value={
                                                sessionForm.data.progress_notes
                                            }
                                            onChange={(e) =>
                                                sessionForm.setData(
                                                    'progress_notes',
                                                    e.target.value,
                                                )
                                            }
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        />
                                        <InputError
                                            message={
                                                sessionForm.errors
                                                    .progress_notes
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Attach Document</Label>
                                        <Input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                                            onChange={(e) =>
                                                sessionForm.setData(
                                                    'session_document',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                sessionForm.errors
                                                    .session_document
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={sessionForm.processing}
                                    >
                                        {sessionForm.processing
                                            ? 'Logging...'
                                            : 'Log Session'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {c.sessions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No sessions recorded yet.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {c.sessions.map((session) => (
                                    <Card key={session.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">
                                                            {
                                                                session.session_type_label
                                                            }
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(
                                                                session.session_date,
                                                            ).toLocaleString()}
                                                        </span>
                                                        <span className="text-sm">
                                                            {
                                                                session.duration_minutes
                                                            }{' '}
                                                            min
                                                        </span>
                                                    </div>
                                                    {session.counselor && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            by{' '}
                                                            {
                                                                session
                                                                    .counselor
                                                                    .name
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                {session.mood_rating && (
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold">
                                                            {
                                                                session.mood_rating
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Mood
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {session.notes && (
                                                <div
                                                    className="prose prose-sm mt-3 max-w-none dark:prose-invert"
                                                    dangerouslySetInnerHTML={{
                                                        __html: session.notes,
                                                    }}
                                                />
                                            )}
                                            {session.progress_notes && (
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    Progress:{' '}
                                                    {session.progress_notes}
                                                </p>
                                            )}
                                            {session.next_session_date && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Next session:{' '}
                                                    {new Date(
                                                        session.next_session_date,
                                                    ).toLocaleDateString()}
                                                </p>
                                            )}
                                            {session.documents.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {session.documents.map(
                                                        (doc) => (
                                                            <a
                                                                key={doc.id}
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block text-xs text-primary hover:underline"
                                                            >
                                                                {doc.name}
                                                            </a>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Goals Tab */}
                    <TabsContent value="goals" className="space-y-6 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Goal</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleGoal}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Title *</Label>
                                            <Input
                                                value={goalForm.data.title}
                                                onChange={(e) =>
                                                    goalForm.setData(
                                                        'title',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={goalForm.errors.title}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Target Date</Label>
                                            <DatePicker
                                                value={
                                                    goalForm.data.target_date
                                                }
                                                onChange={(value) =>
                                                    goalForm.setData(
                                                        'target_date',
                                                        value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    goalForm.errors.target_date
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <textarea
                                            value={goalForm.data.description}
                                            onChange={(e) =>
                                                goalForm.setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        />
                                        <InputError
                                            message={
                                                goalForm.errors.description
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={goalForm.processing}
                                    >
                                        {goalForm.processing
                                            ? 'Adding...'
                                            : 'Add Goal'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {c.goals.length > 0 && (
                            <div className="rounded-lg border p-3 text-sm">
                                Progress: {achievedGoals} of {c.goals.length}{' '}
                                goals achieved
                            </div>
                        )}

                        {c.goals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No goals set yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {c.goals.map((goal) => (
                                    <Card key={goal.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`font-medium ${goal.is_achieved ? 'line-through opacity-60' : ''}`}
                                                        >
                                                            {goal.title}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${goalStatusColors[goal.status] ?? ''}`}
                                                        >
                                                            {goal.status_label}
                                                        </span>
                                                    </div>
                                                    {goal.description && (
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {goal.description}
                                                        </p>
                                                    )}
                                                    {goal.target_date && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Target:{' '}
                                                            {new Date(
                                                                goal.target_date,
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <Select
                                                    value={goal.status}
                                                    onValueChange={(v) =>
                                                        handleGoalUpdate(
                                                            goal.id,
                                                            v,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-36">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {goalStatuses.map(
                                                            (s) => (
                                                                <SelectItem
                                                                    key={
                                                                        s.value
                                                                    }
                                                                    value={
                                                                        s.value
                                                                    }
                                                                >
                                                                    {s.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Referrals Tab */}
                    <TabsContent value="referrals" className="space-y-6 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Referral</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleReferral}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Referred To *</Label>
                                            <Input
                                                value={
                                                    referralForm.data
                                                        .referred_to
                                                }
                                                onChange={(e) =>
                                                    referralForm.setData(
                                                        'referred_to',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    referralForm.errors
                                                        .referred_to
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type *</Label>
                                            <Select
                                                value={
                                                    referralForm.data
                                                        .referral_type
                                                }
                                                onValueChange={(v) =>
                                                    referralForm.setData(
                                                        'referral_type',
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {referralTypes.map((t) => (
                                                        <SelectItem
                                                            key={t.value}
                                                            value={t.value}
                                                        >
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={
                                                    referralForm.errors
                                                        .referral_type
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date *</Label>
                                            <DatePicker
                                                value={
                                                    referralForm.data
                                                        .referral_date
                                                }
                                                onChange={(value) =>
                                                    referralForm.setData(
                                                        'referral_date',
                                                        value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    referralForm.errors
                                                        .referral_date
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reason *</Label>
                                        <textarea
                                            value={referralForm.data.reason}
                                            onChange={(e) =>
                                                referralForm.setData(
                                                    'reason',
                                                    e.target.value,
                                                )
                                            }
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        />
                                        <InputError
                                            message={referralForm.errors.reason}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Attach Document</Label>
                                        <Input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                                            onChange={(e) =>
                                                referralForm.setData(
                                                    'referral_document',
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                referralForm.errors
                                                    .referral_document
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={referralForm.processing}
                                    >
                                        {referralForm.processing
                                            ? 'Adding...'
                                            : 'Add Referral'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {c.referrals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No referrals recorded.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {c.referrals.map((referral) => (
                                    <Card key={referral.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {
                                                                referral.referred_to
                                                            }
                                                        </span>
                                                        <Badge variant="outline">
                                                            {
                                                                referral.referral_type_label
                                                            }
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 text-sm">
                                                        {referral.reason}
                                                    </p>
                                                    {referral.outcome && (
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Outcome:{' '}
                                                            {referral.outcome}
                                                        </p>
                                                    )}
                                                    {referral.referred_by && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            by{' '}
                                                            {
                                                                referral
                                                                    .referred_by
                                                                    .name
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        referral.referral_date,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {referral.documents.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {referral.documents.map(
                                                        (doc) => (
                                                            <a
                                                                key={doc.id}
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block text-xs text-primary hover:underline"
                                                            >
                                                                {doc.name}
                                                            </a>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
