import { Head } from '@inertiajs/react';
import {
    BenevolentRequestDetail,
    type BenevolentRequestDetailData,
} from '@/components/admin/benevolent-request-detail';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export default function BenevolentRequestShow(
    props: BenevolentRequestDetailData,
) {
    const request = props.benevolentRequest.data;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/benevolent-requests' },
        { title: 'Benevolent Requests', href: '/admin/benevolent-requests' },
        {
            title: request.requester_name,
            href: `/admin/benevolent-requests/${request.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Request: ${request.requester_name}`} />
            <div className="p-4">
                <BenevolentRequestDetail {...props} variant="page" />
            </div>
        </AppLayout>
    );
}
