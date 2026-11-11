import { Head, Link, router, useForm } from '@inertiajs/react';
import { ClipboardCheck, Eye } from 'lucide-react';
import {
    ServiceAttendanceChart,
    serviceAttendanceLegend,
    type ServiceAttendancePoint,
} from '@/components/admin/charts/service-attendance-chart';
import InputError from '@/components/input-error';
import {
    DataTable,
    type DataTableColumn,
    type SortDirection,
} from '@/components/shared/data-table/data-table';
import { FacetedFilter } from '@/components/shared/data-table/faceted-filter';
import { DatePicker } from '@/components/shared/date-picker';
import { EmptyState } from '@/components/shared/empty-state';
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

type Filters = {
    source: string[];
    from?: string;
    to?: string;
    sort?: string | null;
    direction?: SortDirection | null;
};

/** Sessions table columns; ids match the sort keys the server accepts. */
const sessionColumns: DataTableColumn<AttendanceSessionSummary>[] = [
    {
        id: 'occurred_on',
        accessorFn: (session) => session.occurred_on,
        header: 'Date',
        enableHiding: false,
        cell: ({ row }) =>
            new Date(
                `${row.original.occurred_on}T00:00:00`,
            ).toLocaleDateString(),
    },
    {
        id: 'title',
        header: 'Session',
        enableSorting: false,
        cell: ({ row }) => (
            <Link
                href={`/admin/attendance/${row.original.id}`}
                className="font-medium hover:underline"
            >
                {row.original.title}
            </Link>
        ),
    },
    {
        id: 'type',
        accessorFn: (session) => session.source,
        header: 'Type',
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.source_label}
            </span>
        ),
    },
    {
        id: 'present',
        accessorFn: (session) => session.present_count,
        header: 'Checked in',
        cell: ({ row }) => (
            <span className="tabular-nums">{row.original.present_count}</span>
        ),
    },
    {
        id: 'guests',
        accessorFn: (session) => session.guest_count,
        header: 'Guests',
        cell: ({ row }) => (
            <span className="text-muted-foreground tabular-nums">
                {row.original.guest_count}
            </span>
        ),
    },
    {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                    <Link
                        href={`/admin/attendance/${row.original.id}`}
                        aria-label={`Open roll call for ${row.original.title}`}
                    >
                        <Eye className="size-3.5" />
                    </Link>
                </Button>
            </div>
        ),
    },
];

type Props = {
    sessions: PaginationMeta & { data: AttendanceSessionSummary[] };
    filters: Filters;
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

    const applyFilters = (next: Partial<Filters>) => {
        router.get(
            '/admin/attendance',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
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
                                    <DatePicker
                                        id="occurred_on"
                                        value={openForm.data.occurred_on}
                                        onChange={(value) =>
                                            openForm.setData(
                                                'occurred_on',
                                                value,
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
                            <CardContent className="space-y-3">
                                <ServiceAttendanceChart
                                    data={trend}
                                    height={240}
                                />
                                {trend.length > 0 && serviceAttendanceLegend}
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

                <DataTable
                    data={sessions.data}
                    columns={sessionColumns}
                    getRowId={(session) => String(session.id)}
                    sort={filters.sort ?? undefined}
                    direction={filters.direction ?? undefined}
                    onSortChange={(sort, direction) =>
                        applyFilters({ sort, direction })
                    }
                    storageKey="admin-attendance-sessions"
                    meta={sessions}
                    itemLabel="sessions"
                    empty={
                        <EmptyState
                            icon={ClipboardCheck}
                            title="No attendance sessions found"
                            description="Open a roll call above, or change the filters."
                        />
                    }
                    toolbar={
                        <>
                            <FacetedFilter
                                title="Type"
                                options={sources}
                                selected={filters.source}
                                onChange={(source) => applyFilters({ source })}
                            />
                            <DatePicker
                                value={filters.from ?? ''}
                                onChange={(value) =>
                                    applyFilters({ from: value || undefined })
                                }
                                max={filters.to}
                                placeholder="From date"
                                className="w-[170px]"
                            />
                            <DatePicker
                                value={filters.to ?? ''}
                                onChange={(value) =>
                                    applyFilters({ to: value || undefined })
                                }
                                min={filters.from}
                                placeholder="To date"
                                className="w-[170px]"
                            />
                        </>
                    }
                />
            </div>
        </AppLayout>
    );
}
