import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type MemberData = {
    id: number;
    user: { id: number; name: string; email: string };
    role: string;
    joined_at: string;
};

type MinistryData = {
    id: number;
    name: string;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    ministry: { data: MinistryData };
    members: PaginatedData<MemberData>;
};

export default function MinistryMembers({ ministry: { data: ministry }, members }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/ministries' },
        { title: 'Ministries', href: '/admin/ministries' },
        { title: ministry.name, href: `/admin/ministries/${ministry.id}/edit` },
        { title: 'Members', href: `/admin/ministries/${ministry.id}/members` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Members: ${ministry.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/ministries">
                            <ArrowLeft className="mr-1 size-4" />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Members of {ministry.name}</h1>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {members.data.map((member) => (
                                <tr key={member.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-medium">{member.user.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{member.user.email}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={member.role === 'leader' ? 'default' : 'secondary'}>
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {members.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No members found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
