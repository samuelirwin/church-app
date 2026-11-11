import { Link, useForm } from '@inertiajs/react';
import { FormSection } from '@/components/admin/form-section';
import { ImageUploader } from '@/components/admin/image-uploader';
import InputError from '@/components/input-error';
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
import type { Member, Option } from '@/types/members';

// Radix Select can't hold an empty string, so "none" stands in for "not set".
const NONE = 'none';

export type MemberFormOptions = {
    households: Array<{ id: number; name: string }>;
    statuses: Option[];
    genders: Option[];
    maritalStatuses: Option[];
    householdRoles: Option[];
    preselectedHouseholdId?: number | null;
};

type MemberFormData = {
    _method?: 'PUT';
    first_name: string;
    last_name: string;
    preferred_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: string;
    marital_status: string;
    household_id: string;
    household_role: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    membership_status: string;
    joined_at: string;
    baptized_at: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    notes: string;
    photo: File | null;
    remove_photo: boolean;
};

type Props = MemberFormOptions & {
    member?: Member;
    submitLabel: string;
    cancelHref: string;
};

const today = () => new Date().toISOString().split('T')[0];

/**
 * Client-side checks that mirror StoreMemberRequest, so people get instant
 * feedback. The server still validates everything.
 */
export function validateMemberForm(
    data: MemberFormData,
): Partial<Record<keyof MemberFormData, string>> {
    const errors: Partial<Record<keyof MemberFormData, string>> = {};

    if (!data.first_name.trim()) {
        errors.first_name = 'The first name is required.';
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Enter a valid email address.';
    }
    if (data.date_of_birth && data.date_of_birth > today()) {
        errors.date_of_birth = 'The date of birth cannot be in the future.';
    }
    if (data.baptized_at && data.baptized_at > today()) {
        errors.baptized_at = 'The baptism date cannot be in the future.';
    }
    if (data.household_id && !data.household_role) {
        errors.household_role = "Choose this person's role in the household.";
    }
    if (!data.membership_status) {
        errors.membership_status = 'Choose a membership status.';
    }

    return errors;
}

export function MemberForm({
    member,
    households,
    statuses,
    genders,
    maritalStatuses,
    householdRoles,
    preselectedHouseholdId,
    submitLabel,
    cancelHref,
}: Props) {
    const isEditing = member !== undefined;

    const {
        data,
        setData,
        post,
        processing,
        errors,
        setError,
        clearErrors,
        progress,
    } = useForm<MemberFormData>({
        ...(isEditing ? { _method: 'PUT' as const } : {}),
        first_name: member?.first_name ?? '',
        last_name: member?.last_name ?? '',
        preferred_name: member?.preferred_name ?? '',
        email: member?.email ?? '',
        phone: member?.phone ?? '',
        date_of_birth: member?.date_of_birth ?? '',
        gender: member?.gender ?? '',
        marital_status: member?.marital_status ?? '',
        household_id: member?.household_id
            ? String(member.household_id)
            : preselectedHouseholdId
              ? String(preselectedHouseholdId)
              : '',
        household_role: member?.household_role ?? '',
        address_line_1: member?.address_line_1 ?? '',
        address_line_2: member?.address_line_2 ?? '',
        city: member?.city ?? '',
        state: member?.state ?? '',
        postal_code: member?.postal_code ?? '',
        membership_status: member?.membership_status ?? 'regular',
        joined_at: member?.joined_at ?? '',
        baptized_at: member?.baptized_at ?? '',
        emergency_contact_name: member?.emergency_contact_name ?? '',
        emergency_contact_phone: member?.emergency_contact_phone ?? '',
        notes: member?.notes ?? '',
        photo: null,
        remove_photo: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        const clientErrors = validateMemberForm(data);
        if (Object.keys(clientErrors).length > 0) {
            setError(clientErrors as Record<keyof MemberFormData, string>);
            return;
        }

        post(isEditing ? `/admin/members/${member.id}` : '/admin/members', {
            forceFormData: true,
        });
    };

    const textField = (
        name: keyof MemberFormData,
        label: string,
        type = 'text',
        required = false,
    ) => (
        <div className="space-y-2">
            <Label htmlFor={name}>
                {label}
                {required && ' *'}
            </Label>
            <Input
                id={name}
                type={type}
                value={data[name] as string}
                onChange={(e) => setData(name, e.target.value as never)}
                aria-invalid={!!errors[name]}
            />
            <InputError message={errors[name]} />
        </div>
    );

    const selectField = (
        name: keyof MemberFormData,
        label: string,
        options: Option[],
        placeholder: string,
        required = false,
    ) => (
        <div className="space-y-2">
            <Label htmlFor={name}>
                {label}
                {required && ' *'}
            </Label>
            <Select
                value={(data[name] as string) || NONE}
                onValueChange={(v) =>
                    setData(name, (v === NONE ? '' : v) as never)
                }
            >
                <SelectTrigger id={name} aria-invalid={!!errors[name]}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {!required && (
                        <SelectItem value={NONE}>{placeholder}</SelectItem>
                    )}
                    {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={errors[name]} />
        </div>
    );

    const householdOptions: Option[] = households.map((h) => ({
        value: String(h.id),
        label: h.name,
    }));

    return (
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <FormSection
                title="Personal Details"
                description="Name, contact details, and photo."
            >
                <ImageUploader
                    label="Photo"
                    currentUrl={data.remove_photo ? null : member?.photo_url}
                    onChange={(file) => {
                        setData('photo', file);
                        if (file) {
                            setData('remove_photo', false);
                        }
                    }}
                    onRemove={() => setData('remove_photo', true)}
                    error={errors.photo}
                />
                <div className="grid gap-6 sm:grid-cols-3">
                    {textField('first_name', 'First Name', 'text', true)}
                    {textField('last_name', 'Last Name')}
                    {textField('preferred_name', 'Preferred Name')}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                    {textField('email', 'Email', 'email')}
                    {textField('phone', 'Phone', 'tel')}
                </div>
                <div className="grid gap-6 sm:grid-cols-3">
                    {textField('date_of_birth', 'Date of Birth', 'date')}
                    {selectField('gender', 'Gender', genders, 'Not specified')}
                    {selectField(
                        'marital_status',
                        'Marital Status',
                        maritalStatuses,
                        'Not specified',
                    )}
                </div>
            </FormSection>

            <FormSection title="Address" description="Where this person lives.">
                <div className="grid gap-6 sm:grid-cols-2">
                    {textField('address_line_1', 'Address Line 1')}
                    {textField('address_line_2', 'Address Line 2')}
                </div>
                <div className="grid gap-6 sm:grid-cols-3">
                    {textField('city', 'City')}
                    {textField('state', 'State')}
                    {textField('postal_code', 'Postal Code')}
                </div>
            </FormSection>

            <FormSection
                title="Membership"
                description="Status, household, and key dates."
            >
                <div className="grid gap-6 sm:grid-cols-3">
                    {selectField(
                        'membership_status',
                        'Status',
                        statuses,
                        'Choose status',
                        true,
                    )}
                    {textField('joined_at', 'Joined', 'date')}
                    {textField('baptized_at', 'Baptized', 'date')}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                    {selectField(
                        'household_id',
                        'Household',
                        householdOptions,
                        'No household',
                    )}
                    {selectField(
                        'household_role',
                        'Household Role',
                        householdRoles,
                        'Not set',
                    )}
                </div>
            </FormSection>

            <FormSection
                title="Emergency Contact & Notes"
                description="Notes are only visible to staff."
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    {textField(
                        'emergency_contact_name',
                        'Emergency Contact Name',
                    )}
                    {textField(
                        'emergency_contact_phone',
                        'Emergency Contact Phone',
                        'tel',
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                        id="notes"
                        rows={4}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                    <InputError message={errors.notes} />
                </div>
            </FormSection>

            {progress && (
                <div className="h-2 rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress.percentage}%` }}
                    />
                </div>
            )}

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
