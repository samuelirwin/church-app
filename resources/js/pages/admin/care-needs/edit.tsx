import { Head, Link } from '@inertiajs/react';
import { CareNeedForm } from '@/components/admin/care-need-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { CareNeed, CareNeedOptions } from '@/types/care-needs';

type Props = CareNeedOptions & {
    careNeed: { data: CareNeed };
    members: Array<{ id: number; full_name: string }>;
};

export default function CareNeedEdit({
    careNeed: { data: careNeed },
    ...options
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/care-needs' },
        { title: 'Care Needs', href: '/admin/care-needs' },
        { title: careNeed.title, href: `/admin/care-needs/${careNeed.id}` },
        { title: 'Edit', href: `/admin/care-needs/${careNeed.id}/edit` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${careNeed.title}`} />
            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link
                        href={`/admin/care-needs/${careNeed.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        &larr; Back to Care Need
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Care Need</h1>
                </div>
                <CareNeedForm
                    {...options}
                    careNeed={careNeed}
                    submitLabel="Save Changes"
                    cancelHref={`/admin/care-needs/${careNeed.id}`}
                />
            </div>
        </AppLayout>
    );
}
