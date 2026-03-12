import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type Registration = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    status_label: string;
    is_guest: boolean;
    registered_at: string;
};

type EventData = {
    id: number;
    title: string;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    event: { data: EventData };
    registrations: PaginatedData<Registration>;
    filters: { status?: string };
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    registered: 'default',
    waitlisted: 'secondary',
    cancelled: 'destructive',
};

export default function EventRegistrations({ event: { data: event }, registrations }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/events' },
        { title: 'Events', href: '/admin/events' },
        { title: 'Registrations', href: `/admin/events/${event.id}/registrations` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Registrations: ${event.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/events"><ArrowLeft className="mr-1 size-4" />Back</Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Registrations for {event.title}</h1>
                    </div>
                    <ExportDropdown baseUrl={`/admin/exports/events/${event.id}/registrations`} />
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {registrations.data.map((reg) => (
                                <tr key={reg.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{reg.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{reg.email}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{reg.phone ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={statusVariant[reg.status] ?? 'secondary'}>
                                            {reg.status_label}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(reg.registered_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-4 py-3">
                                        {reg.is_guest ? (
                                            <Badge variant="outline">Guest</Badge>
                                        ) : (
                                            <Badge variant="secondary">Member</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {registrations.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No registrations yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
