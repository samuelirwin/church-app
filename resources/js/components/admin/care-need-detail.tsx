import { Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Circle,
    ExternalLink,
    HandHeart,
    HeartHandshake,
    Lock,
    Mail,
    MessageSquare,
    Pencil,
    Phone,
    StickyNote,
    Trash2,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Timeline } from '@/components/shared/timeline';
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
import { Textarea } from '@/components/ui/textarea';
import { confirmAction } from '@/lib/confirm';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import {
    careStatusColors,
    priorityColors,
    type CareNeed,
    type CareNeedOptions,
} from '@/types/care-needs';

export type CareNeedTimelineEntry = {
    id: number;
    body: string;
    method: string;
    method_label: string;
    from_status: string | null;
    to_status: string | null;
    author: string;
    created_at: string;
};

export type CareNeedTask = {
    id: number;
    description: string;
    due_on: string | null;
    volunteer: { id: number; name: string } | null;
    completed: boolean;
};

/** The props the server sends for one care need (see CareNeedController::detail). */
export type CareNeedDetailData = {
    careNeed: { data: CareNeed };
    updates: CareNeedTimelineEntry[];
    tasks: CareNeedTask[];
    prayerCount: number;
    canEscalate: boolean;
    canDelete: boolean;
};

type Props = CareNeedDetailData &
    CareNeedOptions & {
        /** "page" is the full-width show page; "panel" is the right side of the split view. */
        variant: 'page' | 'panel';
        onClose?: () => void;
        onPrevious?: () => void;
        onNext?: () => void;
    };

const NO_CHANGE = 'no_change';
const NOBODY = 'nobody';

const methodIcons: Record<string, LucideIcon> = {
    note: StickyNote,
    call: Phone,
    text: MessageSquare,
    email: Mail,
    visit: Users,
};

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

export function CareNeedDetail({
    careNeed: { data: need },
    updates,
    tasks,
    prayerCount,
    canEscalate,
    canDelete,
    statuses,
    contactMethods,
    careTeam,
    variant,
    onClose,
    onPrevious,
    onNext,
}: Props) {
    const { auth } = usePage().props as { auth: { user: User } };
    const [escalateTarget, setEscalateTarget] = useState<
        'benevolence' | 'counseling' | null
    >(null);
    const isPanel = variant === 'panel';

    const updateForm = useForm({
        body: '',
        contact_method: 'call',
        status: '',
    });
    const taskForm = useForm({ description: '', due_on: '' });
    const escalateForm = useForm({ target: '', amount_requested: '' });

    const handleAddUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!updateForm.data.body.trim()) {
            updateForm.setError(
                'body',
                'Write a short note about what happened.',
            );
            return;
        }
        updateForm.post(`/admin/care-needs/${need.id}/updates`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => updateForm.reset(),
        });
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskForm.data.description.trim()) {
            taskForm.setError(
                'description',
                'Describe what needs doing, e.g. "Dinner on Tuesday".',
            );
            return;
        }
        taskForm.post(`/admin/care-needs/${need.id}/tasks`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => taskForm.reset(),
        });
    };

    const handleEscalate = (e: React.FormEvent) => {
        e.preventDefault();
        if (
            escalateForm.data.amount_requested &&
            Number(escalateForm.data.amount_requested) < 0
        ) {
            escalateForm.setError(
                'amount_requested',
                'The amount cannot be negative.',
            );
            return;
        }
        escalateForm.transform((data) => ({ ...data, target: escalateTarget }));
        escalateForm.post(`/admin/care-needs/${need.id}/escalate`);
    };

    const assignTask = (task: CareNeedTask, volunteerId: number | null) => {
        router.patch(
            `/admin/care-needs/${need.id}/tasks/${task.id}/volunteer`,
            { volunteer_id: volunteerId },
            { preserveScroll: true, preserveState: true },
        );
    };

    const removeTask = async (task: CareNeedTask) => {
        if (
            await confirmAction({
                title: `Remove "${task.description}"?`,
                confirmLabel: 'Remove',
                destructive: true,
            })
        ) {
            router.delete(`/admin/care-needs/${need.id}/tasks/${task.id}`, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const handleDelete = async () => {
        if (
            await confirmAction({
                title: 'Delete this care need?',
                description: 'Its timeline and tasks will be deleted too.',
                confirmLabel: 'Delete',
                destructive: true,
            })
        ) {
            router.delete(`/admin/care-needs/${need.id}`);
        }
    };

    const header = (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
                {!isPanel && (
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/care-needs">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                )}
                <div className="min-w-0">
                    <h1
                        className={cn(
                            'flex items-center gap-2 font-bold',
                            isPanel ? 'text-xl' : 'text-2xl',
                        )}
                    >
                        {need.is_confidential && (
                            <Lock
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-label="Confidential"
                            />
                        )}
                        <span className="truncate">{need.title}</span>
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${careStatusColors[need.status] ?? ''}`}
                        >
                            {need.status_label}
                        </span>
                        <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[need.priority] ?? ''}`}
                        >
                            {need.priority_label}
                        </span>
                        <span className="text-muted-foreground">
                            {need.type_label} &middot; {need.source_label}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {isPanel && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPrevious}
                            disabled={!onPrevious}
                            aria-label="Previous care need (k)"
                            title="Previous (k)"
                        >
                            <ChevronUp className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNext}
                            disabled={!onNext}
                            aria-label="Next care need (j)"
                            title="Next (j)"
                        >
                            <ChevronDown className="size-4" />
                        </Button>
                    </>
                )}
                <Button
                    variant="outline"
                    size={isPanel ? 'sm' : 'default'}
                    asChild
                >
                    <Link href={`/admin/care-needs/${need.id}/edit`}>
                        <Pencil className="mr-1 size-4" />
                        Edit
                    </Link>
                </Button>
                {isPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Open full page"
                    >
                        <Link
                            href={`/admin/care-needs/${need.id}`}
                            aria-label="Open full page"
                        >
                            <ExternalLink className="size-4" />
                        </Link>
                    </Button>
                )}
                {canDelete && !isPanel && (
                    <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={handleDelete}
                    >
                        <Trash2 className="mr-1 size-4" />
                        Delete
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

    const details = (
        <Card>
            <CardHeader>
                <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <dl className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                            Person
                        </dt>
                        <dd className="mt-1 text-sm">
                            {need.member_id ? (
                                <Link
                                    href={`/admin/members/${need.member_id}`}
                                    className="hover:underline"
                                >
                                    {need.person_name}
                                </Link>
                            ) : (
                                need.person_name
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                            Assigned to
                        </dt>
                        <dd className="mt-1 text-sm">
                            {need.assignee?.name ?? 'Unassigned'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                            Follow up by
                        </dt>
                        <dd
                            className={cn(
                                'mt-1 text-sm',
                                need.is_overdue &&
                                    'font-medium text-red-600 dark:text-red-400',
                            )}
                        >
                            {need.due_on
                                ? new Date(need.due_on).toLocaleDateString()
                                : '-'}
                            {need.is_overdue && ' (overdue)'}
                        </dd>
                    </div>
                </dl>
                {need.description && (
                    <p className="text-sm whitespace-pre-line">
                        {need.description}
                    </p>
                )}
                {need.share_on_prayer_wall && (
                    <p className="text-sm text-muted-foreground">
                        Shared on the prayer wall &middot; {prayerCount}{' '}
                        {prayerCount === 1 ? 'person has' : 'people have'}{' '}
                        prayed
                    </p>
                )}
                {need.benevolent_request_id && (
                    <Link
                        href={`/admin/benevolent-requests/${need.benevolent_request_id}`}
                        className="block text-sm text-primary hover:underline"
                    >
                        View linked Benevolence request
                    </Link>
                )}
                {need.counseling_case_id && (
                    <Link
                        href={`/admin/counseling-cases/${need.counseling_case_id}`}
                        className="block text-sm text-primary hover:underline"
                    >
                        View linked Counseling case
                    </Link>
                )}
            </CardContent>
        </Card>
    );

    const logContact = (
        <Card>
            <CardHeader>
                <CardTitle>Log Contact or Note</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleAddUpdate}
                    className="space-y-4"
                    noValidate
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`contact_method_${need.id}`}>
                                How
                            </Label>
                            <Select
                                value={updateForm.data.contact_method}
                                onValueChange={(v) =>
                                    updateForm.setData('contact_method', v)
                                }
                            >
                                <SelectTrigger id={`contact_method_${need.id}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {contactMethods.map((m) => (
                                        <SelectItem
                                            key={m.value}
                                            value={m.value}
                                        >
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={updateForm.errors.contact_method}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`update_status_${need.id}`}>
                                Change status
                            </Label>
                            <Select
                                value={updateForm.data.status || NO_CHANGE}
                                onValueChange={(v) =>
                                    updateForm.setData(
                                        'status',
                                        v === NO_CHANGE ? '' : v,
                                    )
                                }
                            >
                                <SelectTrigger id={`update_status_${need.id}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_CHANGE}>
                                        Keep as {need.status_label}
                                    </SelectItem>
                                    {statuses
                                        .filter(
                                            (s) =>
                                                s.value !== need.status &&
                                                s.value !== 'escalated',
                                        )
                                        .map((s) => (
                                            <SelectItem
                                                key={s.value}
                                                value={s.value}
                                            >
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <InputError message={updateForm.errors.status} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`body_${need.id}`}>What happened</Label>
                        <Textarea
                            id={`body_${need.id}`}
                            rows={3}
                            value={updateForm.data.body}
                            onChange={(e) =>
                                updateForm.setData('body', e.target.value)
                            }
                            placeholder="e.g. Visited at the hospital, recovering well."
                        />
                        <InputError message={updateForm.errors.body} />
                    </div>
                    <Button type="submit" disabled={updateForm.processing}>
                        Add to Timeline
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    const timeline = (
        <Card>
            <CardHeader>
                <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <Timeline
                    entries={updates.map((entry) => ({
                        id: entry.id,
                        icon: methodIcons[entry.method],
                        title:
                            entry.to_status && entry.from_status
                                ? `${entry.from_status} → ${entry.to_status}`
                                : entry.method_label,
                        meta: `${formatDateTime(entry.created_at)} · ${entry.author}`,
                        body: entry.body,
                    }))}
                    empty={
                        <p className="text-sm text-muted-foreground">
                            Nothing logged yet.
                        </p>
                    }
                />
            </CardContent>
        </Card>
    );

    const practicalHelp = (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Practical Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No tasks yet. Add things like meals or lifts that
                        volunteers can take on.
                    </p>
                )}
                <ul className="space-y-3">
                    {tasks.map((task) => (
                        <li
                            key={task.id}
                            className="rounded-lg border border-border p-3 text-sm"
                        >
                            <div className="flex items-start gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.patch(
                                            `/admin/care-needs/${need.id}/tasks/${task.id}/complete`,
                                            {},
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
                                        )
                                    }
                                    aria-label={
                                        task.completed
                                            ? 'Mark not done'
                                            : 'Mark done'
                                    }
                                >
                                    {task.completed ? (
                                        <CheckCircle2 className="size-5 text-green-600" />
                                    ) : (
                                        <Circle className="size-5 text-muted-foreground" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <div
                                        className={
                                            task.completed
                                                ? 'text-muted-foreground line-through'
                                                : 'font-medium'
                                        }
                                    >
                                        {task.description}
                                    </div>
                                    {task.due_on && (
                                        <div className="text-xs text-muted-foreground">
                                            By{' '}
                                            {new Date(
                                                task.due_on,
                                            ).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeTask(task)}
                                    aria-label="Remove task"
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                            {!task.completed && (
                                <div className="mt-2 flex items-center gap-2">
                                    <Select
                                        value={
                                            task.volunteer
                                                ? String(task.volunteer.id)
                                                : NOBODY
                                        }
                                        onValueChange={(v) =>
                                            assignTask(
                                                task,
                                                v === NOBODY ? null : Number(v),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NOBODY}>
                                                No volunteer yet
                                            </SelectItem>
                                            {careTeam.map((u) => (
                                                <SelectItem
                                                    key={u.id}
                                                    value={String(u.id)}
                                                >
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!task.volunteer && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs"
                                            onClick={() =>
                                                assignTask(task, auth.user.id)
                                            }
                                        >
                                            I'll do it
                                        </Button>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
                <form
                    onSubmit={handleAddTask}
                    className="space-y-3 border-t border-border pt-4"
                    noValidate
                >
                    <div className="space-y-2">
                        <Label htmlFor={`task_description_${need.id}`}>
                            New task
                        </Label>
                        <Input
                            id={`task_description_${need.id}`}
                            value={taskForm.data.description}
                            onChange={(e) =>
                                taskForm.setData('description', e.target.value)
                            }
                            placeholder="e.g. Dinner on Tuesday"
                        />
                        <InputError message={taskForm.errors.description} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`task_due_on_${need.id}`}>
                            Needed by
                        </Label>
                        <Input
                            id={`task_due_on_${need.id}`}
                            type="date"
                            value={taskForm.data.due_on}
                            onChange={(e) =>
                                taskForm.setData('due_on', e.target.value)
                            }
                        />
                        <InputError message={taskForm.errors.due_on} />
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={taskForm.processing}
                    >
                        Add Task
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    const escalate = canEscalate && (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Escalate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Hand this over when it needs financial help or professional
                    counseling.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={
                            escalateTarget === 'benevolence'
                                ? 'default'
                                : 'outline'
                        }
                        size="sm"
                        onClick={() => setEscalateTarget('benevolence')}
                    >
                        <HandHeart className="mr-1 size-4" />
                        Benevolence
                    </Button>
                    <Button
                        variant={
                            escalateTarget === 'counseling'
                                ? 'default'
                                : 'outline'
                        }
                        size="sm"
                        onClick={() => setEscalateTarget('counseling')}
                    >
                        <HeartHandshake className="mr-1 size-4" />
                        Counseling
                    </Button>
                </div>
                {escalateTarget && (
                    <form
                        onSubmit={handleEscalate}
                        className="space-y-3"
                        noValidate
                    >
                        {escalateTarget === 'benevolence' ? (
                            <div className="space-y-2">
                                <Label htmlFor={`amount_requested_${need.id}`}>
                                    Amount requested (optional)
                                </Label>
                                <Input
                                    id={`amount_requested_${need.id}`}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={escalateForm.data.amount_requested}
                                    onChange={(e) =>
                                        escalateForm.setData(
                                            'amount_requested',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        escalateForm.errors.amount_requested
                                    }
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                This need will become confidential and be
                                removed from the prayer wall.
                            </p>
                        )}
                        <InputError message={escalateForm.errors.target} />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={escalateForm.processing}
                        >
                            Escalate to{' '}
                            {escalateTarget === 'benevolence'
                                ? 'Benevolence'
                                : 'Counseling'}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );

    // The panel is narrower, so everything stacks in one column there.
    if (isPanel) {
        return (
            <div className="flex flex-col gap-4">
                {header}
                {details}
                {logContact}
                {practicalHelp}
                {timeline}
                {escalate}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {header}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    {details}
                    {logContact}
                    {timeline}
                </div>
                <div className="flex flex-col gap-6">
                    {practicalHelp}
                    {escalate}
                </div>
            </div>
        </div>
    );
}
