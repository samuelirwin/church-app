import { Head, Link, router, useForm } from '@inertiajs/react';
import { Archive, ArrowLeft, Mail, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { MemberAttendanceSummary } from '@/types/attendance';
import {
    membershipStatusColors,
    type Member,
    type Option,
} from '@/types/members';

type Activity = {
    ministries: Array<{ id: number; name: string; role: string | null }>;
    groups: Array<{ id: number; name: string }>;
    events: Array<{
        id: number;
        title: string;
        starts_at: string | null;
        status: string | null;
    }>;
    courses: Array<{
        id: number;
        title: string;
        progress: number;
        completed: boolean;
    }>;
    readingPlans: Array<{ id: number; title: string; completed: boolean }>;
    duties: Array<{
        id: number;
        role: string | null;
        date: string | null;
        status: string | null;
    }>;
};

type Props = {
    member: { data: Member };
    householdMembers: { data: Member[] };
    activity: Activity;
    attendance: MemberAttendanceSummary;
    careNeeds: Array<{
        id: number;
        title: string;
        type_label: string;
        status_label: string;
        created_at: string;
    }>;
    statuses: Option[];
    canManage: boolean;
};

const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : '-';

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-sm font-medium text-muted-foreground">
                {label}
            </dt>
            <dd className="mt-1 text-sm">{children || '-'}</dd>
        </div>
    );
}

function ActivityList<T>({
    title,
    items,
    render,
    empty,
}: {
    title: string;
    items: T[];
    render: (item: T) => ReactNode;
    empty: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{empty}</p>
                ) : (
                    <ul className="divide-y divide-border text-sm">
                        {items.map(render)}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export default function MemberShow({
    member: { data: member },
    householdMembers: { data: relatives },
    activity,
    attendance,
    careNeeds,
    statuses,
    canManage,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/members' },
        { title: 'Members', href: '/admin/members' },
        { title: member.full_name, href: `/admin/members/${member.id}` },
    ];

    const statusForm = useForm({
        membership_status: member.membership_status,
        reason: '',
    });

    const handleStatusChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (statusForm.data.membership_status === member.membership_status) {
            statusForm.setError(
                'membership_status',
                'Choose a different status to record a change.',
            );
            return;
        }
        statusForm.patch(`/admin/members/${member.id}/status`, {
            preserveScroll: true,
            onSuccess: () => statusForm.reset('reason'),
        });
    };

    const handleInvite = () => {
        if (
            confirm(
                `Create a login account for ${member.full_name} and email them an invite?`,
            )
        ) {
            router.post(
                `/admin/members/${member.id}/invite`,
                {},
                { preserveScroll: true },
            );
        }
    };

    const handleArchive = () => {
        if (
            confirm(`Archive ${member.full_name}? They can be restored later.`)
        ) {
            router.delete(`/admin/members/${member.id}`);
        }
    };

    const address = [
        member.address_line_1,
        member.address_line_2,
        member.city,
        member.state,
        member.postal_code,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={member.full_name} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/members">
                                <ArrowLeft className="mr-1 size-4" />
                                Back
                            </Link>
                        </Button>
                        {member.photo_url ? (
                            <img
                                src={member.photo_url}
                                alt=""
                                className="size-14 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                                {member.first_name.charAt(0)}
                                {member.last_name?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">
                                {member.full_name}
                            </h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${membershipStatusColors[member.membership_status] ?? ''}`}
                                >
                                    {member.membership_status_label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {member.user
                                        ? `Account: ${member.user.role}`
                                        : 'No login account'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {canManage && (
                        <div className="flex flex-wrap gap-2">
                            {!member.user_id && member.email && (
                                <Button
                                    variant="outline"
                                    onClick={handleInvite}
                                >
                                    <Mail className="mr-1 size-4" />
                                    Invite to Account
                                </Button>
                            )}
                            <Button variant="outline" asChild>
                                <Link href={`/admin/members/${member.id}/edit`}>
                                    <Pencil className="mr-1 size-4" />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={handleArchive}
                            >
                                <Archive className="mr-1 size-4" />
                                Archive
                            </Button>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="overview">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="household">Household</TabsTrigger>
                        <TabsTrigger value="involvement">
                            Involvement
                        </TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="care">Care Needs</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid gap-4 sm:grid-cols-2">
                                        <Detail label="Preferred Name">
                                            {member.preferred_name}
                                        </Detail>
                                        <Detail label="Email">
                                            {member.email}
                                        </Detail>
                                        <Detail label="Phone">
                                            {member.phone}
                                        </Detail>
                                        <Detail label="Date of Birth">
                                            {member.date_of_birth
                                                ? `${formatDate(member.date_of_birth)} (${member.age})`
                                                : null}
                                        </Detail>
                                        <Detail label="Gender">
                                            {member.gender_label}
                                        </Detail>
                                        <Detail label="Marital Status">
                                            {member.marital_status_label}
                                        </Detail>
                                        <div className="sm:col-span-2">
                                            <Detail label="Address">
                                                {address}
                                            </Detail>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>
                            <div className="flex flex-col gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Membership</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <dl className="grid gap-4 sm:grid-cols-2">
                                            <Detail label="Joined">
                                                {member.joined_at
                                                    ? formatDate(
                                                          member.joined_at,
                                                      )
                                                    : null}
                                            </Detail>
                                            <Detail label="Baptized">
                                                {member.baptized_at
                                                    ? formatDate(
                                                          member.baptized_at,
                                                      )
                                                    : null}
                                            </Detail>
                                            <Detail label="Emergency Contact">
                                                {member.emergency_contact_name
                                                    ? `${member.emergency_contact_name} ${member.emergency_contact_phone ?? ''}`
                                                    : null}
                                            </Detail>
                                        </dl>
                                        {member.notes && (
                                            <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm whitespace-pre-line">
                                                {member.notes}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                {canManage && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Change Status</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <form
                                                onSubmit={handleStatusChange}
                                                className="space-y-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="membership_status">
                                                        New Status
                                                    </Label>
                                                    <Select
                                                        value={
                                                            statusForm.data
                                                                .membership_status
                                                        }
                                                        onValueChange={(v) =>
                                                            statusForm.setData(
                                                                'membership_status',
                                                                v,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger id="membership_status">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {statuses.map(
                                                                (s) => (
                                                                    <SelectItem
                                                                        key={
                                                                            s.value
                                                                        }
                                                                        value={
                                                                            s.value
                                                                        }
                                                                    >
                                                                        {
                                                                            s.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            statusForm.errors
                                                                .membership_status
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="reason">
                                                        Reason
                                                    </Label>
                                                    <Textarea
                                                        id="reason"
                                                        rows={2}
                                                        value={
                                                            statusForm.data
                                                                .reason
                                                        }
                                                        onChange={(e) =>
                                                            statusForm.setData(
                                                                'reason',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="e.g. Transferred to Grace Church"
                                                    />
                                                    <InputError
                                                        message={
                                                            statusForm.errors
                                                                .reason
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        statusForm.processing
                                                    }
                                                >
                                                    Update Status
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="household" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {member.household ? (
                                        canManage ? (
                                            <Link
                                                href={`/admin/households/${member.household.id}`}
                                                className="hover:underline"
                                            >
                                                {member.household.name}
                                            </Link>
                                        ) : (
                                            member.household.name
                                        )
                                    ) : (
                                        'No household'
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {member.household ? (
                                    <ul className="divide-y divide-border text-sm">
                                        {relatives.length === 0 && (
                                            <li className="py-2 text-muted-foreground">
                                                No other people in this
                                                household.
                                            </li>
                                        )}
                                        {relatives.map((relative) => (
                                            <li
                                                key={relative.id}
                                                className="flex items-center justify-between py-2"
                                            >
                                                <Link
                                                    href={`/admin/members/${relative.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {relative.full_name}
                                                </Link>
                                                <span className="text-muted-foreground">
                                                    {relative.household_role_label ??
                                                        '-'}
                                                    {relative.age !== null
                                                        ? `, ${relative.age}`
                                                        : ''}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        This person is not part of a household
                                        yet.
                                        {canManage &&
                                            ' Assign one from the edit page or the Households screen.'}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="involvement" className="mt-4">
                        {!member.user_id && (
                            <p className="mb-4 text-sm text-muted-foreground">
                                Involvement is tracked against login accounts.
                                Invite this person to an account to see their
                                activity here.
                            </p>
                        )}
                        <div className="grid gap-6 lg:grid-cols-2">
                            <ActivityList
                                title="Ministries"
                                items={activity.ministries}
                                empty="Not in any ministries."
                                render={(m) => (
                                    <li
                                        key={m.id}
                                        className="flex justify-between py-2"
                                    >
                                        <span>{m.name}</span>
                                        <span className="text-muted-foreground">
                                            {m.role}
                                        </span>
                                    </li>
                                )}
                            />
                            <ActivityList
                                title="Groups"
                                items={activity.groups}
                                empty="Not in any groups."
                                render={(g) => (
                                    <li key={g.id} className="py-2">
                                        {g.name}
                                    </li>
                                )}
                            />
                            <ActivityList
                                title="Recent Events"
                                items={activity.events}
                                empty="No event registrations."
                                render={(e) => (
                                    <li
                                        key={e.id}
                                        className="flex justify-between py-2"
                                    >
                                        <span>{e.title}</span>
                                        <span className="text-muted-foreground">
                                            {formatDate(e.starts_at)}
                                        </span>
                                    </li>
                                )}
                            />
                            <ActivityList
                                title="Volunteer Duties"
                                items={activity.duties}
                                empty="No volunteer duties."
                                render={(d) => (
                                    <li
                                        key={d.id}
                                        className="flex justify-between py-2"
                                    >
                                        <span>{d.role}</span>
                                        <span className="text-muted-foreground">
                                            {formatDate(d.date)} {d.status}
                                        </span>
                                    </li>
                                )}
                            />
                            <ActivityList
                                title="Courses"
                                items={activity.courses}
                                empty="No course enrollments."
                                render={(c) => (
                                    <li
                                        key={c.id}
                                        className="flex justify-between py-2"
                                    >
                                        <span>{c.title}</span>
                                        <span className="text-muted-foreground">
                                            {c.completed
                                                ? 'Completed'
                                                : `${c.progress}%`}
                                        </span>
                                    </li>
                                )}
                            />
                            <ActivityList
                                title="Reading Plans"
                                items={activity.readingPlans}
                                empty="No reading plans."
                                render={(p) => (
                                    <li
                                        key={p.id}
                                        className="flex justify-between py-2"
                                    >
                                        <span>{p.title}</span>
                                        <span className="text-muted-foreground">
                                            {p.completed
                                                ? 'Completed'
                                                : 'In progress'}
                                        </span>
                                    </li>
                                )}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="attendance" className="mt-4">
                        <div className="grid gap-6 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Last 12 Weeks
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold tabular-nums">
                                        {attendance.rate !== null
                                            ? `${attendance.rate}%`
                                            : '-'}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Attended {attendance.services_attended}{' '}
                                        of {attendance.services_held} service
                                        dates
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Recent Check-ins
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {attendance.recent.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No attendance recorded yet.
                                        </p>
                                    ) : (
                                        <ul className="divide-y divide-border text-sm">
                                            {attendance.recent.map((record) => (
                                                <li
                                                    key={record.id}
                                                    className="flex justify-between py-2"
                                                >
                                                    <span>
                                                        {record.title}
                                                        <span className="text-muted-foreground">
                                                            {' '}
                                                            &middot;{' '}
                                                            {record.source}
                                                        </span>
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {formatDate(
                                                            record.occurred_on,
                                                        )}{' '}
                                                        &middot; {record.status}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="care" className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Care Needs</CardTitle>
                                <Button variant="outline" size="sm" asChild>
                                    <Link
                                        href={`/admin/care-needs/create?member_id=${member.id}`}
                                    >
                                        Add Care Need
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {careNeeds.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No care needs recorded.
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-border text-sm">
                                        {careNeeds.map((need) => (
                                            <li
                                                key={need.id}
                                                className="flex justify-between py-2"
                                            >
                                                <Link
                                                    href={`/admin/care-needs/${need.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {need.title}
                                                </Link>
                                                <span className="text-muted-foreground">
                                                    {need.type_label} &middot;{' '}
                                                    {need.status_label} &middot;{' '}
                                                    {formatDate(
                                                        need.created_at,
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-4">
                                    {(member.status_changes ?? []).map(
                                        (change) => (
                                            <li
                                                key={change.id}
                                                className="border-l-2 border-border pl-4"
                                            >
                                                <div className="text-sm font-medium">
                                                    {change.from_label
                                                        ? `${change.from_label} → ${change.to_label}`
                                                        : change.to_label}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDate(
                                                        change.created_at,
                                                    )}
                                                    {change.changed_by &&
                                                        ` by ${change.changed_by}`}
                                                </div>
                                                {change.reason && (
                                                    <p className="mt-1 text-sm">
                                                        {change.reason}
                                                    </p>
                                                )}
                                            </li>
                                        ),
                                    )}
                                    {(member.status_changes ?? []).length ===
                                        0 && (
                                        <li className="text-sm text-muted-foreground">
                                            No status changes recorded.
                                        </li>
                                    )}
                                </ol>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
