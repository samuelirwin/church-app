import { Head, Link } from '@inertiajs/react';
import {
    MemberForm,
    type MemberFormOptions,
} from '@/components/admin/member-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/members' },
    { title: 'Members', href: '/admin/members' },
    { title: 'Add', href: '/admin/members/create' },
];

export default function MemberCreate(props: MemberFormOptions) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Member" />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link
                        href="/admin/members"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        &larr; Back to Members
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Add Member</h1>
                    <p className="text-sm text-muted-foreground">
                        Add a person to the church directory. They don't need a
                        login account.
                    </p>
                </div>
                <MemberForm
                    {...props}
                    submitLabel="Add Member"
                    cancelHref="/admin/members"
                />
            </div>
        </AppLayout>
    );
}
