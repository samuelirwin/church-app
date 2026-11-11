import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Download, Home, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';
import type {
    AttendanceSessionSummary,
    AttendanceTotals,
    RosterEntry,
} from '@/types/attendance';

type Props = {
    session: AttendanceSessionSummary & {
        notes: string | null;
        check_in_url: string;
        qr_url: string;
        self_check_in_open: boolean;
    };
    totals: AttendanceTotals;
    roster: RosterEntry[];
    canDelete: boolean;
};

export default function AttendanceShow({
    session,
    totals,
    roster,
    canDelete,
}: Props) {
    const [search, setSearch] = useState('');
    const [showOnlyAbsent, setShowOnlyAbsent] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/attendance' },
        { title: 'Attendance', href: '/admin/attendance' },
        { title: session.title, href: `/admin/attendance/${session.id}` },
    ];

    const detailsForm = useForm({
        guest_count: String(session.guest_count),
        notes: session.notes ?? '',
    });

    const visibleRoster = useMemo(() => {
        const term = search.trim().toLowerCase();
        return roster.filter(
            (person) =>
                (!term ||
                    person.full_name.toLowerCase().includes(term) ||
                    person.household_name?.toLowerCase().includes(term)) &&
                (!showOnlyAbsent || person.status === null),
        );
    }, [roster, search, showOnlyAbsent]);

    const checkIn = (
        memberIds: number[],
        status: 'present' | 'excused' = 'present',
    ) => {
        router.post(
            `/admin/attendance/${session.id}/check-in`,
            { member_ids: memberIds, status },
            { preserveScroll: true, preserveState: true },
        );
    };

    const undo = (memberId: number) => {
        router.delete(`/admin/attendance/${session.id}/check-in/${memberId}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const checkInHousehold = (householdId: number) => {
        const ids = roster
            .filter(
                (p) => p.household_id === householdId && p.status !== 'present',
            )
            .map((p) => p.id);
        if (ids.length > 0) {
            checkIn(ids);
        }
    };

    const handleSaveDetails = (e: React.FormEvent) => {
        e.preventDefault();
        const guests = Number(detailsForm.data.guest_count);
        if (
            detailsForm.data.guest_count === '' ||
            !Number.isInteger(guests) ||
            guests < 0
        ) {
            detailsForm.setError(
                'guest_count',
                'Enter a whole number of guests (0 if none).',
            );
            return;
        }
        detailsForm.put(`/admin/attendance/${session.id}`, {
            preserveScroll: true,
        });
    };

    const handleDelete = async () => {
        if (await confirmAction({ title: 'Delete this attendance session and all its check-ins?', confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/attendance/${session.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendance: ${session.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/attendance">
                                <ArrowLeft className="mr-1 size-4" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {session.title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {session.source_label} &middot;{' '}
                                {new Date(
                                    session.occurred_on,
                                ).toLocaleDateString(undefined, {
                                    dateStyle: 'full',
                                })}
                            </p>
                        </div>
                    </div>
                    {canDelete && (
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <a
                                    href={`/admin/exports/attendance/${session.id}`}
                                    download
                                >
                                    <Download className="mr-1 size-4" />
                                    Export
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={handleDelete}
                            >
                                <Trash2 className="mr-1 size-4" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Total', value: totals.total },
                        { label: 'Members', value: totals.present },
                        { label: 'Guests', value: totals.guests },
                        { label: 'Excused', value: totals.excused },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">
                                    {stat.label}
                                </div>
                                <div className="text-3xl font-bold tabular-nums">
                                    {stat.value}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Roll Call</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Input
                                    placeholder="Search by name or household..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="sm:max-w-xs"
                                    autoFocus
                                />
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={showOnlyAbsent}
                                        onChange={(e) =>
                                            setShowOnlyAbsent(e.target.checked)
                                        }
                                        className="size-4 rounded border-input"
                                    />
                                    Only show people not checked in
                                </label>
                            </div>

                            <ul className="divide-y divide-border rounded-lg border border-border">
                                {visibleRoster.map((person) => (
                                    <li
                                        key={person.id}
                                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {person.full_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {person.household_name ??
                                                    'No household'}
                                                {person.age !== null &&
                                                    ` · ${person.age}`}
                                                {person.method &&
                                                    ` · ${person.method}`}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {person.household_id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        checkInHousehold(
                                                            person.household_id!,
                                                        )
                                                    }
                                                    title="Check in whole household"
                                                >
                                                    <Home className="size-3.5" />
                                                </Button>
                                            )}
                                            {person.status === 'present' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        undo(person.id)
                                                    }
                                                    className="bg-green-600 text-white hover:bg-green-700"
                                                >
                                                    <Check className="mr-1 size-3.5" />
                                                    Present
                                                </Button>
                                            ) : person.status === 'excused' ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        undo(person.id)
                                                    }
                                                >
                                                    <X className="mr-1 size-3.5" />
                                                    Excused
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            checkIn(
                                                                [person.id],
                                                                'excused',
                                                            )
                                                        }
                                                    >
                                                        Excuse
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            checkIn([person.id])
                                                        }
                                                    >
                                                        Check In
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {visibleRoster.length === 0 && (
                                    <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        No people match.
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Self Check-in
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-center">
                                <img
                                    src={session.qr_url}
                                    alt="QR code for self check-in"
                                    className="mx-auto size-56 rounded bg-white p-2"
                                />
                                <p className="text-sm text-muted-foreground">
                                    {session.self_check_in_open
                                        ? 'Members can scan this code to check in themselves and their household.'
                                        : 'Self check-in only works on the day of the session.'}
                                </p>
                                <Input
                                    readOnly
                                    value={session.check_in_url}
                                    onFocus={(e) => e.target.select()}
                                    className="text-xs"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Head Count & Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleSaveDetails}
                                    className="space-y-4"
                                    noValidate
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="guest_count">
                                            Guests not checked in by name
                                        </Label>
                                        <Input
                                            id="guest_count"
                                            type="number"
                                            min={0}
                                            value={detailsForm.data.guest_count}
                                            onChange={(e) =>
                                                detailsForm.setData(
                                                    'guest_count',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                detailsForm.errors.guest_count
                                            }
                                        />
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
                                        variant="outline"
                                        disabled={detailsForm.processing}
                                    >
                                        Save
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
