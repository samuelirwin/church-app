import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
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
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit, update } from '@/routes/member-profile';
import type { BreadcrumbItem } from '@/types';
import type { Member, Option } from '@/types/members';

type Props = {
    member: { data: Member };
    household: {
        name: string;
        members: Array<{ id: number; full_name: string; role: string | null }>;
    } | null;
    genders: Option[];
    maritalStatuses: Option[];
};

type TextField =
    | 'preferred_name'
    | 'phone'
    | 'date_of_birth'
    | 'address_line_1'
    | 'address_line_2'
    | 'city'
    | 'state'
    | 'postal_code'
    | 'emergency_contact_name'
    | 'emergency_contact_phone';

const NONE = 'none';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Member details', href: edit().url },
];

export default function MemberProfile({
    member: { data: member },
    household,
    genders,
    maritalStatuses,
}: Props) {
    const {
        data,
        setData,
        patch,
        processing,
        errors,
        setError,
        clearErrors,
        recentlySuccessful,
    } = useForm({
        preferred_name: member.preferred_name ?? '',
        phone: member.phone ?? '',
        date_of_birth: member.date_of_birth ?? '',
        gender: member.gender ?? '',
        marital_status: member.marital_status ?? '',
        address_line_1: member.address_line_1 ?? '',
        address_line_2: member.address_line_2 ?? '',
        city: member.city ?? '',
        state: member.state ?? '',
        postal_code: member.postal_code ?? '',
        emergency_contact_name: member.emergency_contact_name ?? '',
        emergency_contact_phone: member.emergency_contact_phone ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        if (
            data.date_of_birth &&
            data.date_of_birth > new Date().toISOString().split('T')[0]
        ) {
            setError(
                'date_of_birth',
                'The date of birth cannot be in the future.',
            );
            return;
        }
        patch(update().url, { preserveScroll: true });
    };

    const field = (name: TextField, label: string, type = 'text') => (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                type={type}
                value={data[name]}
                onChange={(e) => setData(name, e.target.value)}
            />
            <InputError message={errors[name]} />
        </div>
    );

    const select = (
        name: 'gender' | 'marital_status',
        label: string,
        options: Option[],
    ) => (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Select
                value={data[name] || NONE}
                onValueChange={(v) => setData(name, v === NONE ? '' : v)}
            >
                <SelectTrigger id={name}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NONE}>Prefer not to say</SelectItem>
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Member details" />

            <h1 className="sr-only">Member Details</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Member details"
                        description="Keep your contact details up to date for the church directory"
                    />

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                        noValidate
                    >
                        {field('preferred_name', 'Preferred name')}
                        <div className="grid gap-6 sm:grid-cols-2">
                            {field('phone', 'Phone', 'tel')}
                            {field('date_of_birth', 'Date of birth', 'date')}
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            {select('gender', 'Gender', genders)}
                            {select(
                                'marital_status',
                                'Marital status',
                                maritalStatuses,
                            )}
                        </div>
                        {field('address_line_1', 'Address line 1')}
                        {field('address_line_2', 'Address line 2')}
                        <div className="grid gap-6 sm:grid-cols-3">
                            {field('city', 'City')}
                            {field('state', 'State')}
                            {field('postal_code', 'Postal code')}
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            {field(
                                'emergency_contact_name',
                                'Emergency contact name',
                            )}
                            {field(
                                'emergency_contact_phone',
                                'Emergency contact phone',
                                'tel',
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">
                                    Saved
                                </p>
                            </Transition>
                        </div>
                    </form>

                    <div className="space-y-2">
                        <Heading
                            variant="small"
                            title="Household"
                            description="Contact the church office to make changes to your household"
                        />
                        {household ? (
                            <div className="rounded-lg border border-border p-4 text-sm">
                                <div className="font-medium">
                                    {household.name}
                                </div>
                                <ul className="mt-2 space-y-1 text-muted-foreground">
                                    {household.members.map((m) => (
                                        <li key={m.id}>
                                            {m.full_name}
                                            {m.role && ` (${m.role})`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                You are not part of a household yet.
                            </p>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
