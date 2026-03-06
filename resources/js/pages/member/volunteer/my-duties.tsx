import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type DutyData = {
    id: number;
    role: { id: number; name: string };
    scheduled_date: string;
    service_time: { id: number; name: string } | null;
    status: 'scheduled' | 'confirmed' | 'declined' | 'absent';
    notes: string | null;
    scheduler: { id: number; name: string };
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    duties: PaginatedData<DutyData>;
    nextSundayDate: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Duties', href: '/volunteer/my-duties' },
];

// Map status to badge display
const statusBadgeMap: Record<DutyData['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string; label: string }> = {
    scheduled: { variant: 'secondary', label: 'Scheduled' },
    confirmed: { variant: 'default', className: 'bg-green-600 hover:bg-green-700', label: 'Confirmed' },
    declined: { variant: 'destructive', label: 'Declined' },
    absent: { variant: 'outline', className: 'border-yellow-500 text-yellow-600', label: 'Absent' },
};

export default function MyDuties({ duties, nextSundayDate }: Props) {
    const handleConfirm = (dutyId: number) => {
        router.post(`/volunteer/schedule/${dutyId}/confirm`);
    };

    const handleDecline = (dutyId: number) => {
        router.post(`/volunteer/schedule/${dutyId}/decline`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Volunteer Duties" />

            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-2xl font-bold">My Upcoming Duties</h1>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scheduled By</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {duties.data.map((duty) => {
                                const badgeConfig = statusBadgeMap[duty.status];
                                const isSunday = duty.scheduled_date === nextSundayDate;
                                return (
                                    <tr key={duty.id} className={`hover:bg-muted/30 ${isSunday ? 'bg-primary/5' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{duty.role.name}</div>
                                            {duty.notes && (
                                                <div className="text-xs text-muted-foreground">{duty.notes}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                {new Date(duty.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                                {isSunday && (
                                                    <Badge variant="outline" className="border-primary text-primary text-[10px]">
                                                        This Sunday
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline">{duty.service_time?.name ?? '-'}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant={badgeConfig.variant}
                                                className={badgeConfig.className ?? ''}
                                            >
                                                {badgeConfig.label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {duty.scheduler.name}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {duty.status === 'scheduled' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleConfirm(duty.id)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDecline(duty.id)}
                                                    >
                                                        Decline
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {duties.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        You have no upcoming duties scheduled.
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
