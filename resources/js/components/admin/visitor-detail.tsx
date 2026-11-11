import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Mail,
    MessageSquare,
    Phone,
    Trash2,
    UserPlus,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { DatePicker } from '@/components/shared/date-picker';
import { Timeline } from '@/components/shared/timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { visitorStatusColors, type VisitorDetailData } from '@/types/visitors';

type Props = VisitorDetailData & {
    /** "page" is the full-width show page; "panel" is the right side of the split view. */
    variant: 'page' | 'panel';
    onClose?: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
};

const followUpIcons: Record<string, LucideIcon> = {
    call: Phone,
    email: Mail,
    visit: Users,
    text: MessageSquare,
};

const today = () => new Date().toISOString().split('T')[0];

export function VisitorDetail({
    visitor: { data: visitor },
    users,
    statuses,
    followUpTypes,
    isStaffOrAbove,
    canConvert: canConvertProp,
    variant,
    onClose,
    onPrevious,
    onNext,
}: Props) {
    const isPanel = variant === 'panel';

    // The server field is follow_up_status (see UpdateVisitorRequest).
    const updateForm = useForm({
        notes: visitor.notes ?? '',
        follow_up_status: visitor.status,
        assigned_to: visitor.assigned_to ? String(visitor.assigned_to) : '',
    });

    const followUpForm = useForm({
        type: '',
        notes: '',
        followed_up_at: today(),
    });
    const convertForm = useForm({});

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        updateForm.patch(`/admin/visitors/${visitor.id}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleFollowUp = (e: React.FormEvent) => {
        e.preventDefault();
        followUpForm.clearErrors();
        if (!followUpForm.data.type) {
            followUpForm.setError('type', 'Choose how you followed up.');
            return;
        }
        if (!followUpForm.data.followed_up_at) {
            followUpForm.setError(
                'followed_up_at',
                'Choose the date of the follow-up.',
            );
            return;
        }
        followUpForm.post(`/admin/visitors/${visitor.id}/follow-up`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                followUpForm.setData({
                    type: '',
                    notes: '',
                    followed_up_at: today(),
                }),
        });
    };

    const handleConvert = async () => {
        if (
            await confirmAction({
                title: `Convert "${visitor.name}" to a member?`,
                description:
                    'This will create a user account with their email address.',
                confirmLabel: 'Convert',
            })
        ) {
            convertForm.post(`/admin/visitors/${visitor.id}/convert`, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const handleDelete = async () => {
        if (
            await confirmAction({
                title: `Delete visitor "${visitor.name}"?`,
                description: 'This action cannot be undone.',
                confirmLabel: 'Delete',
                destructive: true,
            })
        ) {
            router.delete(`/admin/visitors/${visitor.id}`);
        }
    };

    const canConvert =
        canConvertProp && !visitor.converted_user && visitor.email;
    const followUps = visitor.follow_ups ?? [];

    const header = (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
                {!isPanel && (
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/visitors">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                )}
                <h1
                    className={cn(
                        'truncate font-bold',
                        isPanel ? 'text-xl' : 'text-2xl',
                    )}
                >
                    {visitor.name}
                </h1>
                <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${visitorStatusColors[visitor.status] ?? ''}`}
                >
                    {visitor.status_label}
                </span>
            </div>
            <div className="flex items-center gap-1">
                {isPanel && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPrevious}
                            disabled={!onPrevious}
                            aria-label="Previous visitor (k)"
                            title="Previous (k)"
                        >
                            <ChevronUp className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNext}
                            disabled={!onNext}
                            aria-label="Next visitor (j)"
                            title="Next (j)"
                        >
                            <ChevronDown className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Open full page"
                        >
                            <Link
                                href={`/admin/visitors/${visitor.id}`}
                                aria-label="Open full page"
                            >
                                <ExternalLink className="size-4" />
                            </Link>
                        </Button>
                    </>
                )}
                {isStaffOrAbove && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete visitor"
                        title="Delete visitor"
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

    const info = (
        <Card>
            <CardHeader>
                <CardTitle>Visitor Information</CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                            Email
                        </dt>
                        <dd className="mt-1 text-sm break-all">
                            {visitor.email ?? '-'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                            Phone
                        </dt>
                        <dd className="mt-1 text-sm">{visitor.phone ?? '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                            First Visit
                        </dt>
                        <dd className="mt-1 text-sm">
                            {new Date(
                                visitor.first_visit_date,
                            ).toLocaleDateString()}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                            How They Heard About Us
                        </dt>
                        <dd className="mt-1 text-sm">
                            {visitor.how_heard ?? '-'}
                        </dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-muted-foreground">
                            Address
                        </dt>
                        <dd className="mt-1 text-sm">
                            {visitor.address ?? '-'}
                        </dd>
                    </div>
                    {visitor.prayer_requests && (
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-muted-foreground">
                                Prayer Requests
                            </dt>
                            <dd className="mt-1 text-sm whitespace-pre-wrap">
                                {visitor.prayer_requests}
                            </dd>
                        </div>
                    )}
                    {visitor.converted_user && (
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">
                                Converted to Member
                            </dt>
                            <dd className="mt-1 text-sm">
                                <Badge variant="default">
                                    {visitor.converted_user.name}
                                </Badge>
                            </dd>
                        </div>
                    )}
                </dl>
            </CardContent>
        </Card>
    );

    const update = (
        <Card>
            <CardHeader>
                <CardTitle>Update Visitor</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdate} className="space-y-4" noValidate>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`status_${visitor.id}`}>
                                Status
                            </Label>
                            <Select
                                value={updateForm.data.follow_up_status}
                                onValueChange={(v) =>
                                    updateForm.setData('follow_up_status', v)
                                }
                                disabled={!isStaffOrAbove}
                            >
                                <SelectTrigger id={`status_${visitor.id}`}>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((s) => (
                                        <SelectItem
                                            key={s.value}
                                            value={s.value}
                                        >
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={updateForm.errors.follow_up_status}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`assigned_to_${visitor.id}`}>
                                Assigned To
                            </Label>
                            <Select
                                value={updateForm.data.assigned_to || 'none'}
                                onValueChange={(v) =>
                                    updateForm.setData(
                                        'assigned_to',
                                        v === 'none' ? '' : v,
                                    )
                                }
                                disabled={!isStaffOrAbove}
                            >
                                <SelectTrigger id={`assigned_to_${visitor.id}`}>
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Unassigned
                                    </SelectItem>
                                    {users.map((u) => (
                                        <SelectItem
                                            key={u.id}
                                            value={String(u.id)}
                                        >
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={updateForm.errors.assigned_to}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`notes_${visitor.id}`}>Notes</Label>
                        <Textarea
                            id={`notes_${visitor.id}`}
                            rows={4}
                            value={updateForm.data.notes}
                            onChange={(e) =>
                                updateForm.setData('notes', e.target.value)
                            }
                            disabled={!isStaffOrAbove}
                        />
                        <InputError message={updateForm.errors.notes} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {isStaffOrAbove && (
                            <Button
                                type="submit"
                                disabled={updateForm.processing}
                            >
                                {updateForm.processing
                                    ? 'Saving...'
                                    : 'Save Changes'}
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
                                {convertForm.processing
                                    ? 'Converting...'
                                    : 'Convert to Member'}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    const addFollowUp = (
        <Card>
            <CardHeader>
                <CardTitle>Add Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleFollowUp}
                    className="space-y-4"
                    noValidate
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`follow_up_type_${visitor.id}`}>
                                Type *
                            </Label>
                            <Select
                                value={followUpForm.data.type}
                                onValueChange={(v) =>
                                    followUpForm.setData('type', v)
                                }
                            >
                                <SelectTrigger
                                    id={`follow_up_type_${visitor.id}`}
                                >
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {followUpTypes.map((t) => (
                                        <SelectItem
                                            key={t.value}
                                            value={t.value}
                                        >
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={followUpForm.errors.type} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`followed_up_at_${visitor.id}`}>
                                Date *
                            </Label>
                            <DatePicker
                                id={`followed_up_at_${visitor.id}`}
                                value={followUpForm.data.followed_up_at}
                                onChange={(value) =>
                                    followUpForm.setData(
                                        'followed_up_at',
                                        value,
                                    )
                                }
                            />
                            <InputError
                                message={followUpForm.errors.followed_up_at}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`follow_up_notes_${visitor.id}`}>
                            Notes
                        </Label>
                        <Textarea
                            id={`follow_up_notes_${visitor.id}`}
                            rows={3}
                            value={followUpForm.data.notes}
                            onChange={(e) =>
                                followUpForm.setData('notes', e.target.value)
                            }
                            placeholder="Details about the follow-up..."
                        />
                        <InputError message={followUpForm.errors.notes} />
                    </div>
                    <Button type="submit" disabled={followUpForm.processing}>
                        {followUpForm.processing
                            ? 'Adding...'
                            : 'Add Follow-up'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    const history = (
        <Card>
            <CardHeader>
                <CardTitle>Follow-up History</CardTitle>
            </CardHeader>
            <CardContent>
                <Timeline
                    entries={followUps.map((followUp) => ({
                        id: followUp.id,
                        icon: followUpIcons[followUp.type],
                        title: followUp.type_label,
                        meta: `${new Date(followUp.followed_up_at).toLocaleDateString()}${followUp.user ? ` · ${followUp.user.name}` : ''}`,
                        body: followUp.notes,
                    }))}
                    empty={
                        <p className="text-sm text-muted-foreground">
                            No follow-ups recorded yet.
                        </p>
                    }
                />
            </CardContent>
        </Card>
    );

    // The panel is narrower, so everything stacks in one column there.
    if (isPanel) {
        return (
            <div className="flex flex-col gap-4">
                {header}
                {info}
                {addFollowUp}
                {history}
                {update}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {header}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-6">
                    {info}
                    {update}
                </div>
                <div className="flex flex-col gap-6">
                    {addFollowUp}
                    {history}
                </div>
            </div>
        </div>
    );
}
