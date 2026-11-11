import { Head } from '@inertiajs/react';
import {
    CareNeedDetail,
    type CareNeedDetailData,
} from '@/components/admin/care-need-detail';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { CareNeedOptions } from '@/types/care-needs';

type Props = CareNeedDetailData & CareNeedOptions;

export default function CareNeedShow(props: Props) {
    const need = props.careNeed.data;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/care-needs' },
        { title: 'Care Needs', href: '/admin/care-needs' },
        { title: need.title, href: `/admin/care-needs/${need.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={need.title} />
            <div className="p-4">
                <CareNeedDetail {...props} variant="page" />
            </div>
        </AppLayout>
    );
}
