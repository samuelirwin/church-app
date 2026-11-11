import { Head } from '@inertiajs/react';
import {
    CounselingCaseDetail,
    type CounselingCaseDetailData,
} from '@/components/admin/counseling-case-detail';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export default function CounselingCaseShow(props: CounselingCaseDetailData) {
    const c = props.counselingCase.data;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/counseling-cases' },
        { title: 'Counseling Cases', href: '/admin/counseling-cases' },
        { title: c.case_number, href: `/admin/counseling-cases/${c.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Case: ${c.case_number}`} />
            <div className="p-4">
                <CounselingCaseDetail {...props} variant="page" />
            </div>
        </AppLayout>
    );
}
