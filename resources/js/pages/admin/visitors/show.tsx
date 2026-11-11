import { Head } from '@inertiajs/react';
import { VisitorDetail } from '@/components/admin/visitor-detail';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { VisitorDetailData } from '@/types/visitors';

export default function VisitorShow(props: VisitorDetailData) {
    const visitor = props.visitor.data;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/visitors' },
        { title: 'Visitors', href: '/admin/visitors' },
        { title: visitor.name, href: `/admin/visitors/${visitor.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Visitor: ${visitor.name}`} />
            <div className="p-4">
                <VisitorDetail {...props} variant="page" />
            </div>
        </AppLayout>
    );
}
