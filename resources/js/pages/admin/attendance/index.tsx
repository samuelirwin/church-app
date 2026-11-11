import { Head, Link, router, useForm } from '@inertiajs/react';
import { ClipboardCheck, Eye } from 'lucide-react';
import {
    ServiceAttendanceChart,
    type ServiceAttendancePoint,
} from '@/components/admin/charts/service-attendance-chart';
import InputError from '@/components/input-error';
import { Pagination } from '@/components/shared/pagination';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { AttendanceSessionSummary } from '@/types/attendance';
import type { Option, PaginationMeta } from '@/types/members';

type SourceKey = 'service' | 'event' | 'group';

type Props = {
    sessions: PaginationMeta & { data: AttendanceSessionSummary[] };
    filters: { source?: string; from?: string; to?: string };
    sources: Option[];
    options: Record<SourceKey, Array<{ id: number; name: string }>>;
    today: string;
    trend: ServiceAttendancePoint[];
    absentees: Array<{
        id: number;
        full_name: string;
        phone: string | null;
        flagged_at: string;
    }>;
    absenceThreshold: number;
    canManageSettings: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/attendance' },
    { title: 'Attendance', href: '/admin/attendance' },
];

export default function AttendanceIndex({
    sessions,
    filters,
    sources,
    options,
    today,
    trend,
    absentees,
    absenceThreshold,
    canManageSettings,
}: Props) {
    const openForm = useForm({
        source: sources[0]?.value ?? '',
        attendable_id: '',
        occurred_on: today,
    });
    const settingsForm = useForm({
        absence_threshold: String(absenceThreshold),
    });

    const itemsForSource = options[openForm.data.source as SourceKey] ?? [];

    const handleOpen = (e: React.FormEvent) => {
        e.preventDefault();
        openForm.clearErrors();
        const errors: Record<string, string> = {};
        if (!openForm.data.source) {
            errors.source = 'Choose what you are taking attendance for.';
        }
        if (!openForm.data.attendable_id) {
            errors.attendable_id = 'Choose a service, event, or group.';
        }
        if (!openForm.data.occurred_on) {
            errors.occurred_on = 'Choose a date.';
        }
        if (Object.keys(errors).length > 0) {
            openForm.setError(
                errors as Record<
                    'source' | 'attendable_id' | 'occurred_on',
                    string
                >,
            );
            return;
        }
        openForm.post('/admin/attendance');
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        const weeks = Number(settingsForm.data.absence_threshold);
        if (!Number.isInteger(weeks) || weeks < 1 || weeks > 12) {
            settingsForm.setError(
                'absence_threshold',
                'Enter a whole number between 1 and 12.',
            );
            return;
        }
        settingsForm.put('/admin/attendance/settings', {
            preserveScroll: true,
        });
    };

    const applyFilter = (key: string, value: string | undefined) => {
        router.get(
            '/admin/attendance',
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-bold">Attendance</h1>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardCheck className="size-4" />
                                Take Attendance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleOpen}
                                className="space-y-4"
                                noValidate
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="source">For</Label>
                                    <Select
                                        value={openForm.data.source}
                                        onValueChange={(v) =>
                                            openForm.setData({
                                                ...openForm.data,
                                                source: v,
                                                attendable_id: '',
                                            })
                                        }
                                    >
                                        <SelectTrigger id="source">
                                            <SelectValue placeholder="Choose a type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sources.map((s) => (
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
                                        message={openForm.errors.source}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="attendable_id">
                                        Which one
                                    </Label>
                                    <Select
                                        value={openForm.data.attendable_id}
                                        onValueChange={(v) =>
                                            openForm.setData('attendable_id', v)
                                        }
                                    >
                                        <SelectTrigger id="attendable_id">
                                            <SelectValue
                                                placeholder={
                                                    itemsForSource.length
                                                        ? 'Choose...'
                                                        : 'Nothing available'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {itemsForSource.map((item) => (
                                                <SelectItem
                                                    key={item.id}
                                                    value={String(item.id)}
                                                >
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={openForm.errors.attendable_id}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="occurred_on">Date</Label>
                                    <Input
                                        id="occurred_on"
                                        type="date"
                                        value={openForm.data.occurred_on}
                                        onChange={(e) =>
                                            openForm.setData(
                                                'occurred_on',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={openForm.errors.occurred_on}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={openForm.processing}
                                >
                                    Open Roll Call
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {canManageSettings && (
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Service Attendance (last 12 weeks)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ServiceAttendanceChart
                                    data={trend}
                                    height={240}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {canManageSettings && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Missing Members
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {absentees.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No one is currently flagged. The weekly
                                        check flags active members who miss{' '}
                                        {absenceThreshold} services in a row.
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-border text-sm">
                                        {absentees.map((person) => (
                                            <li
                                                key={person.id}
                                                className="flex items-center justify-between py-2"
                                            >
                                                <Link
                                                    href={`/admin/members/${person.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {person.full_name}
                                                </Link>
                                                <span className="text-muted-foreground">
                                                    {person.phone ?? 'No phone'}{' '}
                                                    &middot; flagged{' '}
                                                    {new Date(
                                                        person.flagged_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Absence Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleSaveSettings}
                                    className="space-y-4"
                                    noValidate
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="absence_threshold">
                                            Alert after this many missed
                                            services in a row
                                        </Label>
                                        <Input
                                            id="absence_threshold"
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={
                                                settingsForm.data
                                                    .absence_threshold
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    'absence_threshold',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                settingsForm.errors
                                                    .absence_threshold
                                            }
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={settingsForm.processing}
                                    >
                                        Save
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="flex flex-col gap-4 sm:flex-row">
                    <Select
                        onValueChange={(v) =>
                            applyFilter('source', v === 'all' ? undefined : v)
                        }
                        defaultValue={filters.source ?? 'all'}
                    >
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {sources.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        className="sm:w-[180px]"
                        defaultValue={filters.from}
                        onChange={(e) => applyFilter('from', e.target.value)}
                        aria-label="From"
                    />
                    <Input
                        type="date"
                        className="sm:w-[180px]"
                        defaultValue={filters.to}
                        onChange={(e) => applyFilter('to', e.target.value)}
                        aria-label="To"
                    />
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Session
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Checked In
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Guests
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {sessions.data.map((session) => (
                                <tr
                                    key={session.id}
                                    className="hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">
                                        {new Date(
                                            session.occurred_on,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {session.title}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {session.source_label}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {session.present_count}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {session.guest_count}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={`/admin/attendance/${session.id}`}
                                            >
                                                <Eye className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {sessions.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No attendance sessions yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={sessions} itemLabel="sessions" />
            </div>
        </AppLayout>
    );
}
