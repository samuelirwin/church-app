import { Head, Link } from '@inertiajs/react';
import { CareNeedForm } from '@/components/admin/care-need-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { CareNeedOptions } from '@/types/care-needs';

type Props = CareNeedOptions & {
    members: Array<{ id: number; full_name: string }>;
    preselectedMemberId: number | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/care-needs' },
    { title: 'Care Needs', href: '/admin/care-needs' },
    { title: 'Add', href: '/admin/care-needs/create' },
];

export default function CareNeedCreate(props: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Care Need" />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link
                        href="/admin/care-needs"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        &larr; Back to Care Needs
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Add Care Need</h1>
                </div>
                <CareNeedForm
                    {...props}
                    submitLabel="Add Care Need"
                    cancelHref="/admin/care-needs"
                />
            </div>
        </AppLayout>
    );
}
