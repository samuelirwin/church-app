import { Head, Link } from '@inertiajs/react';
import {
    MemberForm,
    type MemberFormOptions,
} from '@/components/admin/member-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Member } from '@/types/members';

type Props = MemberFormOptions & { member: { data: Member } };

export default function MemberEdit({
    member: { data: member },
    ...options
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/members' },
        { title: 'Members', href: '/admin/members' },
        { title: member.full_name, href: `/admin/members/${member.id}` },
        { title: 'Edit', href: `/admin/members/${member.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${member.full_name}`} />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link
                        href={`/admin/members/${member.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        &larr; Back to Profile
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">
                        Edit {member.full_name}
                    </h1>
                </div>
                <MemberForm
                    {...options}
                    member={member}
                    submitLabel="Save Changes"
                    cancelHref={`/admin/members/${member.id}`}
                />
            </div>
        </AppLayout>
    );
}
