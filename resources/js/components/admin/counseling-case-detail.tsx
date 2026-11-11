import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Download,
    ExternalLink,
    Lock,
    Pencil,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { confirmAction } from '@/lib/confirm';
import { cn } from '@/lib/utils';

type Person = { id: number; name: string };
type Document = { id: number; name: string; size: number; url: string };

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
    counselor: Person | null;
    documents: Document[];
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
    created_by: Person | null;
};

type ReferralData = {
    id: number;
    referred_to: string;
    referral_type: string;
    referral_type_label: string;
    referral_date: string;
    reason: string;
    outcome: string | null;
    referred_by: Person | null;
    documents: Document[];
};

/** Fields every viewer gets (also what list rows contain). */
export type CounselingCaseSummary = {
    id: number;
    case_number: string;
    person_name: string;
    case_type: string;
    case_type_label: string;
    status: string;
    status_label: string;
    assigned_counselor: Person | null;
    sessions_count?: number;
    opened_at: string;
    closed_at: string | null;
    is_summary?: true;
};

/** Full case, only sent to admins and the assigned counselor. */
type CounselingCaseFull = CounselingCaseSummary & {
    person_contact: string | null;
    person_email: string | null;
    presenting_issue: string;
    background_notes: string | null;
    referral_source: string | null;
    closure_reason: string | null;
    opened_by: Person | null;
    sessions: SessionData[];
    goals: GoalData[];
    referrals: ReferralData[];
    case_documents: Array<Document & { mime_type: string }>;
};

type EnumOption = { value: string; label: string };

/** Props the server sends for one case (see CounselingCaseController::detail). */
export type CounselingCaseDetailData = {
    counselingCase: { data: CounselingCaseFull | CounselingCaseSummary };
    statuses: EnumOption[];
    sessionTypes: EnumOption[];
    goalStatuses: EnumOption[];
    referralTypes: EnumOption[];
    isAdmin: boolean;
    isDeaconView: boolean;
};

type Props = CounselingCaseDetailData & {
    /** "page" is the full show page; "panel" is the right side of the split view. */
    variant: 'page' | 'panel';
    onClose?: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
};

export const caseStatusColors: Record<string, string> = {
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

// Keep the panel (and its selection) in place after saving.
const stay = { preserveScroll: true, preserveState: true } as const;

const isFull = (
    c: CounselingCaseFull | CounselingCaseSummary,
): c is CounselingCaseFull => !('is_summary' in c && c.is_summary);

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-sm font-medium text-muted-foreground">
                {label}
            </dt>
            <dd className="mt-1 text-sm">{children}</dd>
        </div>
    );
}

export function CounselingCaseDetail({
    counselingCase,
    isAdmin,
    isDeaconView,
    variant,
    onClose,
    onPrevious,
    onNext,
    ...options
}: Props) {
    const c = counselingCase.data;
    const isPanel = variant === 'panel';
    const full = isFull(c);

    const handleDelete = async () => {
        if (
            await confirmAction({
                title: `Delete case ${c.case_number}?`,
                description: 'This action cannot be undone.',
                confirmLabel: 'Delete',
                destructive: true,
            })
        ) {
            router.delete(`/admin/counseling-cases/${c.id}`);
        }
    };

    const header = (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
                {!isPanel && (
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/counseling-cases">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                )}
                <h1
                    className={cn(
                        'font-bold',
                        isPanel ? 'text-xl' : 'text-2xl',
                    )}
                >
                    {c.case_number}: {c.person_name}
                </h1>
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${caseStatusColors[c.status] ?? ''}`}
                >
                    {c.status_label}
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {isPanel && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPrevious}
                            disabled={!onPrevious}
                            aria-label="Previous case (k)"
                            title="Previous (k)"
                        >
                            <ChevronUp className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNext}
                            disabled={!onNext}
                            aria-label="Next case (j)"
                            title="Next (j)"
                        >
                            <ChevronDown className="size-4" />
                        </Button>
                    </>
                )}
                {full && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/counseling-cases/${c.id}/edit`}>
                            <Pencil className="mr-1 size-4" />
                            Edit
                        </Link>
                    </Button>
                )}
                {isPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Open full page"
                    >
                        <Link
                            href={`/admin/counseling-cases/${c.id}`}
                            aria-label="Open full page"
                        >
                            <ExternalLink className="size-4" />
                        </Link>
                    </Button>
                )}
                {full && isAdmin && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete case"
                        title="Delete case"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
                {isPanel && onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close (Esc)"
                        title="Close (Esc)"
                    >
                        <X className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className={cn('flex flex-col', isPanel ? 'gap-4' : 'gap-6')}>
            {header}
            {full && !isDeaconView ? (
                <FullCase c={c} isPanel={isPanel} {...options} />
            ) : (
                <SummaryCase c={c} />
            )}
        </div>
    );
}

/**
 * What deacons see: status and assignment only. The server never sends the
 * confidential fields for this view, so there's nothing hidden client-side.
 */
function SummaryCase({ c }: { c: CounselingCaseSummary }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Case Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <Detail label="Case Type">
                        <Badge variant="secondary">{c.case_type_label}</Badge>
                    </Detail>
                    <Detail label="Counselor">
                        {c.assigned_counselor?.name ?? 'Unassigned'}
                    </Detail>
                    <Detail label="Opened">
                        {new Date(c.opened_at).toLocaleDateString()}
                    </Detail>
                    {c.closed_at && (
                        <Detail label="Closed">
                            {new Date(c.closed_at).toLocaleDateString()}
                        </Detail>
                    )}
                    {c.sessions_count !== undefined && (
                        <Detail label="Sessions">{c.sessions_count}</Detail>
                    )}
                </dl>
                <p className="flex items-center gap-2 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                    <Lock className="size-4 shrink-0" />
                    Case notes, sessions, and contact details are only visible
                    to the assigned counselor and admins.
                </p>
            </CardContent>
        </Card>
    );
}

type FullCaseProps = Pick<
    CounselingCaseDetailData,
    'statuses' | 'sessionTypes' | 'goalStatuses' | 'referralTypes'
> & {
    c: CounselingCaseFull;
    isPanel: boolean;
};

function FullCase({
    c,
    isPanel,
    sessionTypes,
    goalStatuses,
    referralTypes,
}: FullCaseProps) {
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
    const goalForm = useForm({ title: '', description: '', target_date: '' });
    const referralForm = useForm({
        referred_to: '',
        referral_type: '',
        referral_date: new Date().toISOString().split('T')[0],
        reason: '',
        referral_document: null as File | null,
    });
    const attachForm = useForm({ documents: [] as File[] });

    const handleSession = (e: React.FormEvent) => {
        e.preventDefault();
        sessionForm.post(`/admin/counseling-cases/${c.id}/sessions`, {
            ...stay,
            forceFormData: true,
            onSuccess: () => sessionForm.reset(),
        });
    };

    const handleGoal = (e: React.FormEvent) => {
        e.preventDefault();
        goalForm.post(`/admin/counseling-cases/${c.id}/goals`, {
            ...stay,
            onSuccess: () => goalForm.reset(),
        });
    };

    const handleGoalUpdate = (goal: GoalData, status: string) => {
        router.put(
            `/admin/counseling-cases/${c.id}/goals/${goal.id}`,
            {
                title: goal.title,
                description: goal.description ?? '',
                target_date: goal.target_date ?? '',
                status,
            },
            stay,
        );
    };

    const handleReferral = (e: React.FormEvent) => {
        e.preventDefault();
        referralForm.post(`/admin/counseling-cases/${c.id}/referrals`, {
            ...stay,
            forceFormData: true,
            onSuccess: () => referralForm.reset(),
        });
    };

    const handleAttach = (e: React.FormEvent) => {
        e.preventDefault();
        attachForm.post(`/admin/counseling-cases/${c.id}/attachments`, {
            ...stay,
            forceFormData: true,
            onSuccess: () => attachForm.reset(),
        });
    };

    const achievedGoals = c.goals.filter((g) => g.is_achieved).length;
    const twoColumns = isPanel ? '' : 'lg:grid-cols-2';

    return (
        <Tabs defaultValue="overview">
            <TabsList className="flex-wrap">
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

            <TabsContent value="overview" className="space-y-6 pt-4">
                <div className={cn('grid gap-6', twoColumns)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Person Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-3">
                                <Detail label="Name">{c.person_name}</Detail>
                                <Detail label="Contact">
                                    {c.person_contact ?? '-'}
                                </Detail>
                                <Detail label="Email">
                                    {c.person_email ?? '-'}
                                </Detail>
                                <Detail label="Referral Source">
                                    {c.referral_source ?? '-'}
                                </Detail>
                                <Detail label="Counselor">
                                    {c.assigned_counselor?.name ?? 'Unassigned'}
                                </Detail>
                                <Detail label="Opened By">
                                    {c.opened_by?.name ?? '-'}
                                </Detail>
                                <Detail label="Opened">
                                    {new Date(c.opened_at).toLocaleDateString()}
                                </Detail>
                                {c.closed_at && (
                                    <Detail label="Closed">
                                        {new Date(
                                            c.closed_at,
                                        ).toLocaleDateString()}
                                    </Detail>
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
                                <Detail label="Case Type">
                                    <Badge variant="secondary">
                                        {c.case_type_label}
                                    </Badge>
                                </Detail>
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
                                    <Detail label="Closure Reason">
                                        {c.closure_reason}
                                    </Detail>
                                )}
                            </dl>
                        </CardContent>
                    </Card>
                </div>

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
                                            {(doc.size / 1024 / 1024).toFixed(
                                                2,
                                            )}{' '}
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
                                                aria-label={`Download ${doc.name}`}
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
                            className="flex flex-wrap items-end gap-3 border-t pt-4"
                        >
                            <div className="flex-1 space-y-2">
                                <Label htmlFor={`documents_${c.id}`}>
                                    Add Documents
                                </Label>
                                <Input
                                    id={`documents_${c.id}`}
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                                    onChange={(e) =>
                                        attachForm.setData(
                                            'documents',
                                            e.target.files
                                                ? Array.from(e.target.files)
                                                : [],
                                        )
                                    }
                                />
                                <InputError
                                    message={attachForm.errors.documents}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={
                                    attachForm.processing ||
                                    attachForm.data.documents.length === 0
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

            <TabsContent value="sessions" className="space-y-6 pt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Log New Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSession} className="space-y-4">
                            <div
                                className={cn(
                                    'grid gap-4',
                                    isPanel
                                        ? 'sm:grid-cols-2'
                                        : 'sm:grid-cols-3',
                                )}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor={`session_date_${c.id}`}>
                                        Date/Time *
                                    </Label>
                                    <Input
                                        id={`session_date_${c.id}`}
                                        type="datetime-local"
                                        value={sessionForm.data.session_date}
                                        onChange={(e) =>
                                            sessionForm.setData(
                                                'session_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            sessionForm.errors.session_date
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`duration_${c.id}`}>
                                        Duration (min) *
                                    </Label>
                                    <Input
                                        id={`duration_${c.id}`}
                                        type="number"
                                        min="5"
                                        max="480"
                                        value={
                                            sessionForm.data.duration_minutes
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
                                            sessionForm.errors.duration_minutes
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`session_type_${c.id}`}>
                                        Type *
                                    </Label>
                                    <Select
                                        value={sessionForm.data.session_type}
                                        onValueChange={(v) =>
                                            sessionForm.setData(
                                                'session_type',
                                                v,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id={`session_type_${c.id}`}
                                        >
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
                                            sessionForm.errors.session_type
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`mood_${c.id}`}>
                                        Mood Rating (1-10)
                                    </Label>
                                    <Input
                                        id={`mood_${c.id}`}
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={sessionForm.data.mood_rating}
                                        onChange={(e) =>
                                            sessionForm.setData(
                                                'mood_rating',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="1-10"
                                    />
                                    <InputError
                                        message={sessionForm.errors.mood_rating}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`next_session_${c.id}`}>
                                        Next Session Date
                                    </Label>
                                    <DatePicker
                                        id={`next_session_${c.id}`}
                                        value={
                                            sessionForm.data.next_session_date
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
                                            sessionForm.errors.next_session_date
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Session Notes</Label>
                                <RichEditor
                                    id={`session_notes_${c.id}`}
                                    value={sessionForm.data.notes}
                                    onChange={(html) =>
                                        sessionForm.setData('notes', html)
                                    }
                                    error={sessionForm.errors.notes}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`progress_${c.id}`}>
                                    Progress Notes
                                </Label>
                                <Textarea
                                    id={`progress_${c.id}`}
                                    rows={2}
                                    value={sessionForm.data.progress_notes}
                                    onChange={(e) =>
                                        sessionForm.setData(
                                            'progress_notes',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={sessionForm.errors.progress_notes}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`session_doc_${c.id}`}>
                                    Attach Document
                                </Label>
                                <Input
                                    id={`session_doc_${c.id}`}
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
                                        sessionForm.errors.session_document
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
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline">
                                                    {session.session_type_label}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        session.session_date,
                                                    ).toLocaleString()}
                                                </span>
                                                <span className="text-sm">
                                                    {session.duration_minutes}{' '}
                                                    min
                                                </span>
                                            </div>
                                            {session.counselor && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    by {session.counselor.name}
                                                </p>
                                            )}
                                        </div>
                                        {session.mood_rating && (
                                            <div className="text-center">
                                                <div className="text-lg font-bold">
                                                    {session.mood_rating}
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
                                            Progress: {session.progress_notes}
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
                                            {session.documents.map((doc) => (
                                                <a
                                                    key={doc.id}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-xs text-primary hover:underline"
                                                >
                                                    {doc.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-6 pt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Add Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGoal} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`goal_title_${c.id}`}>
                                        Title *
                                    </Label>
                                    <Input
                                        id={`goal_title_${c.id}`}
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
                                    <Label htmlFor={`goal_target_${c.id}`}>
                                        Target Date
                                    </Label>
                                    <DatePicker
                                        id={`goal_target_${c.id}`}
                                        value={goalForm.data.target_date}
                                        onChange={(value) =>
                                            goalForm.setData(
                                                'target_date',
                                                value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={goalForm.errors.target_date}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`goal_description_${c.id}`}>
                                    Description
                                </Label>
                                <Textarea
                                    id={`goal_description_${c.id}`}
                                    rows={2}
                                    value={goalForm.data.description}
                                    onChange={(e) =>
                                        goalForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={goalForm.errors.description}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={goalForm.processing}
                            >
                                {goalForm.processing ? 'Adding...' : 'Add Goal'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {c.goals.length > 0 && (
                    <div className="rounded-lg border p-3 text-sm">
                        Progress: {achievedGoals} of {c.goals.length} goals
                        achieved
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
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
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
                                                handleGoalUpdate(goal, v)
                                            }
                                        >
                                            <SelectTrigger
                                                className="w-36"
                                                aria-label={`Status of ${goal.title}`}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {goalStatuses.map((s) => (
                                                    <SelectItem
                                                        key={s.value}
                                                        value={s.value}
                                                    >
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6 pt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Add Referral</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleReferral} className="space-y-4">
                            <div
                                className={cn(
                                    'grid gap-4',
                                    isPanel
                                        ? 'sm:grid-cols-2'
                                        : 'sm:grid-cols-3',
                                )}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor={`referred_to_${c.id}`}>
                                        Referred To *
                                    </Label>
                                    <Input
                                        id={`referred_to_${c.id}`}
                                        value={referralForm.data.referred_to}
                                        onChange={(e) =>
                                            referralForm.setData(
                                                'referred_to',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            referralForm.errors.referred_to
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`referral_type_${c.id}`}>
                                        Type *
                                    </Label>
                                    <Select
                                        value={referralForm.data.referral_type}
                                        onValueChange={(v) =>
                                            referralForm.setData(
                                                'referral_type',
                                                v,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id={`referral_type_${c.id}`}
                                        >
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
                                            referralForm.errors.referral_type
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`referral_date_${c.id}`}>
                                        Date *
                                    </Label>
                                    <DatePicker
                                        id={`referral_date_${c.id}`}
                                        value={referralForm.data.referral_date}
                                        onChange={(value) =>
                                            referralForm.setData(
                                                'referral_date',
                                                value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={
                                            referralForm.errors.referral_date
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`reason_${c.id}`}>
                                    Reason *
                                </Label>
                                <Textarea
                                    id={`reason_${c.id}`}
                                    rows={3}
                                    value={referralForm.data.reason}
                                    onChange={(e) =>
                                        referralForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={referralForm.errors.reason}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`referral_doc_${c.id}`}>
                                    Attach Document
                                </Label>
                                <Input
                                    id={`referral_doc_${c.id}`}
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
                                        referralForm.errors.referral_document
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
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">
                                                    {referral.referred_to}
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
                                                    Outcome: {referral.outcome}
                                                </p>
                                            )}
                                            {referral.referred_by && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    by{' '}
                                                    {referral.referred_by.name}
                                                </p>
                                            )}
                                        </div>
                                        <span className="shrink-0 text-sm text-muted-foreground">
                                            {new Date(
                                                referral.referral_date,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {referral.documents.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {referral.documents.map((doc) => (
                                                <a
                                                    key={doc.id}
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-xs text-primary hover:underline"
                                                >
                                                    {doc.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}
