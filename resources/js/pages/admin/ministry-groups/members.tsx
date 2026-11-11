import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Users } from 'lucide-react';
import { TableEmptyRow } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type MemberData = {
    id: number;
    user: { id: number; name: string; email: string };
    joined_at: string;
};

type GroupData = {
    id: number;
    name: string;
    ministry: { id: number; name: string };
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    group: { data: GroupData };
    members: PaginatedData<MemberData>;
};

export default function MinistryGroupMembers({ group: { data: group }, members }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/ministry-groups' },
        { title: 'Ministry Groups', href: '/admin/ministry-groups' },
        { title: group.name, href: `/admin/ministry-groups/${group.id}/edit` },
        { title: 'Members', href: `/admin/ministry-groups/${group.id}/members` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Members: ${group.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/ministry-groups">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Members of {group.name}</h1>
                        <p className="text-sm text-muted-foreground">{group.ministry.name}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {members.data.map((member) => (
                                <tr key={member.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{member.user.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{member.user.email}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {members.data.length === 0 && (
                                <TableEmptyRow colSpan={3} icon={Users} title="No members found" description="Try a different search or filter." />
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
