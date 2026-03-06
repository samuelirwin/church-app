import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type CertificateData = {
    uuid: string;
    certificate_number: string;
    issued_at: string;
    user_name: string;
    course_title: string;
};

type Props = {
    certificate: CertificateData;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academy', href: '/academy' },
    { title: 'Certificate', href: '#' },
];

export default function CertificatePage({ certificate }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Certificate of Completion" />

            <div className="mx-auto max-w-2xl p-8">
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <div className="border-8 border-double border-primary/20 p-8 text-center">
                            <p className="mb-2 text-sm uppercase tracking-widest text-muted-foreground">Certificate of Completion</p>
                            <div className="my-6 border-y border-border py-6">
                                <p className="text-lg text-muted-foreground">This certifies that</p>
                                <p className="my-3 text-3xl font-bold">{certificate.user_name}</p>
                                <p className="text-lg text-muted-foreground">has successfully completed</p>
                                <p className="my-3 text-2xl font-semibold text-primary">{certificate.course_title}</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                    <p className="font-medium">Date Issued</p>
                                    <p>{new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="font-medium">Certificate No.</p>
                                    <p>{certificate.certificate_number}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
