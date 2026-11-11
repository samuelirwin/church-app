import { Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FormSection } from '@/components/admin/form-section';
import InputError from '@/components/input-error';
import { DatePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
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
import type { CareNeed, CareNeedOptions } from '@/types/care-needs';

const NONE = 'none';
const MAX_MATCHES = 8;

type CareNeedFormData = {
    member_id: number | null;
    requester_name: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status?: string;
    is_confidential: boolean;
    share_on_prayer_wall: boolean;
    assigned_to: string;
    due_on: string;
};

type Props = Omit<CareNeedOptions, 'contactMethods'> & {
    members: Array<{ id: number; full_name: string }>;
    careNeed?: CareNeed;
    preselectedMemberId?: number | null;
    submitLabel: string;
    cancelHref: string;
};

/**
 * Mirrors StoreCareNeedRequest so problems show up before the request is sent.
 */
export function validateCareNeedForm(
    data: CareNeedFormData,
): Partial<Record<keyof CareNeedFormData, string>> {
    const errors: Partial<Record<keyof CareNeedFormData, string>> = {};

    if (!data.member_id && !data.requester_name.trim()) {
        errors.member_id =
            'Choose a person from the directory or type their name.';
    }
    if (!data.title.trim()) {
        errors.title = 'Give the need a short title.';
    }
    if (!data.type) {
        errors.type = 'Choose the type of need.';
    }
    if (!data.priority) {
        errors.priority = 'Choose a priority.';
    }

    return errors;
}

export function CareNeedForm({
    careNeed,
    members,
    types,
    priorities,
    statuses,
    careTeam,
    preselectedMemberId,
    submitLabel,
    cancelHref,
}: Props) {
    const isEditing = careNeed !== undefined;
    const initialMemberId = careNeed?.member_id ?? preselectedMemberId ?? null;

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        setError,
        clearErrors,
    } = useForm<CareNeedFormData>({
        member_id: initialMemberId,
        requester_name: careNeed?.requester_name ?? '',
        title: careNeed?.title ?? '',
        description: careNeed?.description ?? '',
        type: careNeed?.type ?? '',
        priority: careNeed?.priority ?? 'normal',
        ...(isEditing ? { status: careNeed.status } : {}),
        is_confidential: careNeed?.is_confidential ?? false,
        share_on_prayer_wall: careNeed?.share_on_prayer_wall ?? false,
        assigned_to: careNeed?.assigned_to ? String(careNeed.assigned_to) : '',
        due_on: careNeed?.due_on ?? '',
    });

    const [memberSearch, setMemberSearch] = useState('');
    const selectedMember = members.find((m) => m.id === data.member_id) ?? null;

    const matches = useMemo(() => {
        const term = memberSearch.trim().toLowerCase();
        return term
            ? members
                  .filter((m) => m.full_name.toLowerCase().includes(term))
                  .slice(0, MAX_MATCHES)
            : [];
    }, [members, memberSearch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        const clientErrors = validateCareNeedForm(data);
        if (Object.keys(clientErrors).length > 0) {
            setError(clientErrors as Record<keyof CareNeedFormData, string>);
            return;
        }

        if (isEditing) {
            put(`/admin/care-needs/${careNeed.id}`);
        } else {
            post('/admin/care-needs');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <FormSection
                title="Who needs care"
                description="Pick someone from the directory, or type a name if they aren't in it."
            >
                {selectedMember ? (
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="font-medium">
                            {selectedMember.full_name}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setData('member_id', null)}
                        >
                            Change
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="member_search">
                                Find in directory
                            </Label>
                            <Input
                                id="member_search"
                                placeholder="Start typing a name..."
                                value={memberSearch}
                                onChange={(e) =>
                                    setMemberSearch(e.target.value)
                                }
                            />
                            {matches.length > 0 && (
                                <ul className="divide-y divide-border rounded-md border border-border text-sm">
                                    {matches.map((m) => (
                                        <li key={m.id}>
                                            <button
                                                type="button"
                                                className="w-full px-3 py-2 text-left hover:bg-muted"
                                                onClick={() => {
                                                    setData('member_id', m.id);
                                                    setMemberSearch('');
                                                }}
                                            >
                                                {m.full_name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <InputError message={errors.member_id} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="requester_name">
                                Or enter a name
                            </Label>
                            <Input
                                id="requester_name"
                                value={data.requester_name}
                                onChange={(e) =>
                                    setData('requester_name', e.target.value)
                                }
                            />
                            <InputError message={errors.requester_name} />
                        </div>
                    </div>
                )}
            </FormSection>

            <FormSection
                title="The need"
                description="What is needed and how urgent it is."
            >
                <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="e.g. In hospital after surgery"
                    />
                    <InputError message={errors.title} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Details</Label>
                    <Textarea
                        id="description"
                        rows={4}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                    />
                    <InputError message={errors.description} />
                </div>
                <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="type">Type *</Label>
                        <Select
                            value={data.type}
                            onValueChange={(v) => setData('type', v)}
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Choose a type" />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority *</Label>
                        <Select
                            value={data.priority}
                            onValueChange={(v) => setData('priority', v)}
                        >
                            <SelectTrigger id="priority">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {priorities.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.priority} />
                    </div>
                    {isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(v) => setData('status', v)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
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
                            <InputError message={errors.status} />
                        </div>
                    )}
                </div>
            </FormSection>

            <FormSection
                title="Follow-up"
                description="Who is looking after this and by when."
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="assigned_to">Assigned to</Label>
                        <Select
                            value={data.assigned_to || NONE}
                            onValueChange={(v) =>
                                setData('assigned_to', v === NONE ? '' : v)
                            }
                        >
                            <SelectTrigger id="assigned_to">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE}>Unassigned</SelectItem>
                                {careTeam.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.assigned_to} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="due_on">Follow up by</Label>
                        <DatePicker
                            id="due_on"
                            value={data.due_on}
                            onChange={(value) => setData('due_on', value)}
                        />
                        <InputError message={errors.due_on} />
                    </div>
                </div>
                <label className="flex items-start gap-2 text-sm">
                    <input
                        type="checkbox"
                        className="mt-0.5 size-4 rounded border-input"
                        checked={data.is_confidential}
                        onChange={(e) => {
                            setData({
                                ...data,
                                is_confidential: e.target.checked,
                                share_on_prayer_wall: e.target.checked
                                    ? false
                                    : data.share_on_prayer_wall,
                            });
                        }}
                    />
                    <span>
                        <span className="font-medium">Confidential</span>
                        <span className="block text-muted-foreground">
                            Only the assigned person, the creator, and admins
                            can see it.
                        </span>
                    </span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                    <input
                        type="checkbox"
                        className="mt-0.5 size-4 rounded border-input"
                        checked={data.share_on_prayer_wall}
                        disabled={data.is_confidential}
                        onChange={(e) =>
                            setData('share_on_prayer_wall', e.target.checked)
                        }
                    />
                    <span>
                        <span className="font-medium">
                            Share on the prayer wall
                        </span>
                        <span className="block text-muted-foreground">
                            Only do this if the person has agreed. Members see
                            their first name and the title.
                        </span>
                    </span>
                </label>
            </FormSection>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : submitLabel}
                </Button>
                <Button variant="outline" asChild>
                    <Link href={cancelHref}>Cancel</Link>
                </Button>
            </div>
        </form>
    );
}
