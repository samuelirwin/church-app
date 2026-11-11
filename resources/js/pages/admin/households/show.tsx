import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Trash2, UserMinus } from 'lucide-react';
import InputError from '@/components/input-error';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    membershipStatusColors,
    type Household,
    type Option,
} from '@/types/members';

type Props = {
    household: { data: Household };
    availableMembers: Array<{ id: number; full_name: string }>;
    householdRoles: Option[];
};

type DetailField =
    | 'name'
    | 'phone'
    | 'address_line_1'
    | 'address_line_2'
    | 'city'
    | 'state'
    | 'postal_code';

export default function HouseholdShow({
    household: { data: household },
    availableMembers,
    householdRoles,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/members' },
        { title: 'Households', href: '/admin/households' },
        { title: household.name, href: `/admin/households/${household.id}` },
    ];

    const detailsForm = useForm({
        name: household.name,
        phone: household.phone ?? '',
        address_line_1: household.address_line_1 ?? '',
        address_line_2: household.address_line_2 ?? '',
        city: household.city ?? '',
        state: household.state ?? '',
        postal_code: household.postal_code ?? '',
        notes: household.notes ?? '',
    });

    const addForm = useForm({ member_id: '', household_role: '' });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!detailsForm.data.name.trim()) {
            detailsForm.setError('name', 'The household name is required.');
            return;
        }
        detailsForm.put(`/admin/households/${household.id}`, {
            preserveScroll: true,
        });
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.clearErrors();
        let hasError = false;
        if (!addForm.data.member_id) {
            addForm.setError('member_id', 'Choose a member to add.');
            hasError = true;
        }
        if (!addForm.data.household_role) {
            addForm.setError(
                'household_role',
                "Choose this person's role in the household.",
            );
            hasError = true;
        }
        if (hasError) {
            return;
        }
        addForm.post(`/admin/households/${household.id}/members`, {
            preserveScroll: true,
            onSuccess: () => addForm.reset(),
        });
    };

    const handleRemove = (memberId: number, name: string) => {
        if (confirm(`Remove ${name} from this household?`)) {
            router.delete(
                `/admin/households/${household.id}/members/${memberId}`,
                { preserveScroll: true },
            );
        }
    };

    const handleDelete = () => {
        if (
            confirm(
                `Delete household "${household.name}"? The people in it stay in the directory.`,
            )
        ) {
            router.delete(`/admin/households/${household.id}`);
        }
    };

    const field = (name: DetailField, label: string, required = false) => (
        <div className="space-y-2">
            <Label htmlFor={name}>
                {label}
                {required && ' *'}
            </Label>
            <Input
                id={name}
                value={detailsForm.data[name]}
                onChange={(e) => detailsForm.setData(name, e.target.value)}
            />
            <InputError message={detailsForm.errors[name]} />
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={household.name} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin/households"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            &larr; Back to Households
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold">
                            {household.name}
                        </h1>
                    </div>
                    <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={handleDelete}
                    >
                        <Trash2 className="mr-1 size-4" />
                        Delete
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>People</CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={`/admin/members/create?household_id=${household.id}`}
                                >
                                    <Plus className="mr-1 size-4" />
                                    New Person
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ul className="divide-y divide-border text-sm">
                                {(household.members ?? []).map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center justify-between gap-2 py-2"
                                    >
                                        <div>
                                            <Link
                                                href={`/admin/members/${member.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {member.full_name}
                                            </Link>
                                            <div className="text-xs text-muted-foreground">
                                                {member.household_role_label ??
                                                    '-'}
                                                {member.age !== null
                                                    ? `, ${member.age}`
                                                    : ''}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${membershipStatusColors[member.membership_status] ?? ''}`}
                                            >
                                                {member.membership_status_label}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleRemove(
                                                        member.id,
                                                        member.full_name,
                                                    )
                                                }
                                                title="Remove from household"
                                            >
                                                <UserMinus className="size-3.5" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                                {(household.members ?? []).length === 0 && (
                                    <li className="py-2 text-muted-foreground">
                                        No one in this household yet.
                                    </li>
                                )}
                            </ul>

                            <form
                                onSubmit={handleAdd}
                                className="space-y-4 rounded-lg border border-border p-4"
                                noValidate
                            >
                                <h3 className="text-sm font-semibold">
                                    Add Existing Person
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="member_id">
                                            Person
                                        </Label>
                                        <Select
                                            value={addForm.data.member_id}
                                            onValueChange={(v) =>
                                                addForm.setData('member_id', v)
                                            }
                                        >
                                            <SelectTrigger id="member_id">
                                                <SelectValue placeholder="Choose a person" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableMembers.map((m) => (
                                                    <SelectItem
                                                        key={m.id}
                                                        value={String(m.id)}
                                                    >
                                                        {m.full_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={addForm.errors.member_id}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="household_role">
                                            Role
                                        </Label>
                                        <Select
                                            value={addForm.data.household_role}
                                            onValueChange={(v) =>
                                                addForm.setData(
                                                    'household_role',
                                                    v,
                                                )
                                            }
                                        >
                                            <SelectTrigger id="household_role">
                                                <SelectValue placeholder="Choose a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {householdRoles.map((r) => (
                                                    <SelectItem
                                                        key={r.value}
                                                        value={r.value}
                                                    >
                                                        {r.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                addForm.errors.household_role
                                            }
                                        />
                                    </div>
                                </div>
                                {availableMembers.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Everyone in the directory already
                                        belongs to a household.
                                    </p>
                                )}
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={
                                        addForm.processing ||
                                        availableMembers.length === 0
                                    }
                                >
                                    Add to Household
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Household Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleSave}
                                className="space-y-4"
                                noValidate
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {field('name', 'Name', true)}
                                    {field('phone', 'Phone')}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {field('address_line_1', 'Address Line 1')}
                                    {field('address_line_2', 'Address Line 2')}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {field('city', 'City')}
                                    {field('state', 'State')}
                                    {field('postal_code', 'Postal Code')}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        rows={3}
                                        value={detailsForm.data.notes}
                                        onChange={(e) =>
                                            detailsForm.setData(
                                                'notes',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={detailsForm.errors.notes}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={detailsForm.processing}
                                >
                                    Save Details
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
