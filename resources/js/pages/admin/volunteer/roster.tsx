import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

type ServiceTimeOption = {
    id: number;
    name: string;
};

type ScheduleData = {
    id: number;
    role: { id: number; name: string };
    user: { id: number; name: string };
    scheduled_date: string;
    service_time: ServiceTimeOption | null;
    service_time_id: number;
    status: 'scheduled' | 'confirmed' | 'declined' | 'absent';
    notes: string | null;
};

type Props = {
    schedules: ScheduleData[];
    roles: Array<{ id: number; name: string }>;
    users: Array<{ id: number; name: string }>;
    serviceTimes: ServiceTimeOption[];
    weekStart: string;
    filters: { role_id?: string; user_id?: string };
    nextSundaySchedules: ScheduleData[];
    nextSundayDate: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Volunteer Roster', href: '/admin/volunteer/roster' },
];

// Map status to badge variant and color
const statusBadgeMap: Record<ScheduleData['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    scheduled: { variant: 'secondary' },
    confirmed: { variant: 'default', className: 'bg-green-600 hover:bg-green-700' },
    declined: { variant: 'destructive' },
    absent: { variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
};

// Get the 7 days of the week starting from weekStart (Monday)
function getWeekDays(weekStart: string): Date[] {
    const start = new Date(weekStart + 'T00:00:00');
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
    });
}

function formatDateShort(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0];
}

function formatSundayDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function VolunteerRoster({ schedules, roles, users, serviceTimes, weekStart, filters, nextSundaySchedules, nextSundayDate }: Props) {
    const [showAddForm, setShowAddForm] = useState(false);
    const weekDays = getWeekDays(weekStart);

    const { data, setData, post, processing, errors, reset } = useForm({
        volunteer_role_id: '',
        user_id: '',
        scheduled_date: '',
        service_time_id: serviceTimes.length > 0 ? String(serviceTimes[0].id) : '',
        notes: '',
    });

    // Navigate to previous or next week
    const navigateWeek = (direction: 'prev' | 'next') => {
        const current = new Date(weekStart + 'T00:00:00');
        current.setDate(current.getDate() + (direction === 'prev' ? -7 : 7));
        router.get('/admin/volunteer/roster', {
            ...filters,
            week: formatDateISO(current),
        }, { preserveState: true, replace: true });
    };

    // Filter by role or user
    const handleFilter = (key: 'role_id' | 'user_id', value: string) => {
        router.get('/admin/volunteer/roster', {
            ...filters,
            [key]: value === 'all' ? undefined : value,
            week: weekStart,
        }, { preserveState: true, replace: true });
    };

    // Get schedules for a specific role and date
    const getSchedulesForCell = (roleId: number, date: Date): ScheduleData[] => {
        const dateStr = formatDateISO(date);
        return schedules.filter(
            (s) => s.role.id === roleId && s.scheduled_date === dateStr,
        );
    };

    const handleAddSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/volunteer/schedule', {
            onSuccess: () => {
                reset();
                setShowAddForm(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Volunteer Roster" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Volunteer Roster</h1>
                    <Button onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus className="mr-1 size-4" />
                        Add Schedule
                    </Button>
                </div>

                {/* Upcoming Sunday summary */}
                <Card className="border-primary/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                            Upcoming Sunday — {formatSundayDate(nextSundayDate)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {nextSundaySchedules.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(
                                    nextSundaySchedules.reduce<Record<string, ScheduleData[]>>((acc, schedule) => {
                                        const roleName = schedule.role.name;
                                        if (!acc[roleName]) acc[roleName] = [];
                                        acc[roleName].push(schedule);
                                        return acc;
                                    }, {}),
                                ).map(([roleName, roleSchedules]) => (
                                    <div key={roleName} className="rounded-md border border-border p-3">
                                        <h4 className="mb-2 text-sm font-semibold">{roleName}</h4>
                                        <div className="flex flex-col gap-1.5">
                                            {roleSchedules.map((schedule) => {
                                                const badgeConfig = statusBadgeMap[schedule.status];
                                                return (
                                                    <div key={schedule.id} className="flex items-center justify-between text-sm">
                                                        <span>{schedule.user.name}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs text-muted-foreground">{schedule.service_time?.name ?? ''}</span>
                                                            <Badge
                                                                variant={badgeConfig.variant}
                                                                className={`text-[10px] ${badgeConfig.className ?? ''}`}
                                                            >
                                                                {schedule.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No volunteers scheduled for this Sunday.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Add schedule form */}
                {showAddForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Schedule Entry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddSchedule} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="volunteer_role_id">Role *</Label>
                                        <Select value={data.volunteer_role_id} onValueChange={(v) => setData('volunteer_role_id', v)}>
                                            <SelectTrigger id="volunteer_role_id">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.volunteer_role_id && <p className="text-sm text-red-500">{errors.volunteer_role_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="user_id">Volunteer *</Label>
                                        <Select value={data.user_id} onValueChange={(v) => setData('user_id', v)}>
                                            <SelectTrigger id="user_id">
                                                <SelectValue placeholder="Select volunteer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.user_id && <p className="text-sm text-red-500">{errors.user_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="scheduled_date">Date *</Label>
                                        <Input
                                            id="scheduled_date"
                                            type="date"
                                            value={data.scheduled_date}
                                            onChange={(e) => setData('scheduled_date', e.target.value)}
                                        />
                                        {errors.scheduled_date && <p className="text-sm text-red-500">{errors.scheduled_date}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="service_time_id">Service Time *</Label>
                                        <Select value={data.service_time_id} onValueChange={(v) => setData('service_time_id', v)}>
                                            <SelectTrigger id="service_time_id">
                                                <SelectValue placeholder="Select time" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {serviceTimes.map((st) => (
                                                    <SelectItem key={st.id} value={String(st.id)}>{st.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.service_time_id && <p className="text-sm text-red-500">{errors.service_time_id}</p>}
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={2}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                        {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Adding...' : 'Add Entry'}
                                    </Button>
                                    <Button variant="outline" type="button" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Filters and week navigation */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Select
                            value={filters.role_id ?? 'all'}
                            onValueChange={(v) => handleFilter('role_id', v)}
                        >
                            <SelectTrigger className="sm:w-[200px]">
                                <SelectValue placeholder="All roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {roles.map((r) => (
                                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.user_id ?? 'all'}
                            onValueChange={(v) => handleFilter('user_id', v)}
                        >
                            <SelectTrigger className="sm:w-[200px]">
                                <SelectValue placeholder="All volunteers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Volunteers</SelectItem>
                                {users.map((u) => (
                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                            <ChevronLeft className="size-4" />
                            Prev
                        </Button>
                        <span className="text-sm font-medium">
                            {formatDateShort(weekDays[0])} - {formatDateShort(weekDays[6])}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Weekly roster grid */}
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="min-w-[120px] px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                                {weekDays.map((day) => (
                                    <th key={formatDateISO(day)} className="min-w-[140px] px-4 py-3 text-left font-medium text-muted-foreground">
                                        {formatDateShort(day)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {roles.map((role) => (
                                <tr key={role.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{role.name}</td>
                                    {weekDays.map((day) => {
                                        const cellSchedules = getSchedulesForCell(role.id, day);
                                        return (
                                            <td key={formatDateISO(day)} className="px-4 py-3">
                                                {cellSchedules.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {cellSchedules.map((schedule) => {
                                                            const badgeConfig = statusBadgeMap[schedule.status];
                                                            return (
                                                                <div key={schedule.id} className="flex flex-col gap-0.5">
                                                                    <span className="text-xs font-medium">{schedule.user.name}</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Badge
                                                                            variant={badgeConfig.variant}
                                                                            className={`text-[10px] ${badgeConfig.className ?? ''}`}
                                                                        >
                                                                            {schedule.status}
                                                                        </Badge>
                                                                        <span className="text-[10px] text-muted-foreground">{schedule.service_time?.name ?? ''}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {roles.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                        No roles configured. <Link href="/admin/volunteer-roles/create" className="text-primary hover:underline">Add a role</Link> to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
