import { Head, Link, router } from '@inertiajs/react';
import { HandHeart } from 'lucide-react';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginationMeta } from '@/types/members';

type PrayerRequest = {
    id: number;
    title: string;
    description: string | null;
    name: string;
    prayers_count: number;
    prayed_by_me: boolean;
    created_at: string;
};

type Props = {
    requests: PaginationMeta & { data: PrayerRequest[] };
    daysShown: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Prayer Wall', href: '/prayer-wall' },
];

export default function PrayerWall({ requests, daysShown }: Props) {
    const pray = (request: PrayerRequest) => {
        router.post(
            `/prayer-wall/${request.id}/pray`,
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Prayer Wall" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">Prayer Wall</h1>
                        <p className="text-sm text-muted-foreground">
                            Requests shared by our church family over the last{' '}
                            {daysShown} days.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/my-care-needs">Share a Request</Link>
                    </Button>
                </div>

                {requests.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">
                            No prayer requests have been shared yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {requests.data.map((request) => (
                            <Card key={request.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        {request.title}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">
                                        {request.name} &middot;{' '}
                                        {new Date(
                                            request.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                                    {request.description && (
                                        <p className="line-clamp-4 text-sm whitespace-pre-line">
                                            {request.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            {request.prayers_count}{' '}
                                            {request.prayers_count === 1
                                                ? 'person'
                                                : 'people'}{' '}
                                            praying
                                        </span>
                                        <Button
                                            size="sm"
                                            variant={
                                                request.prayed_by_me
                                                    ? 'secondary'
                                                    : 'default'
                                            }
                                            disabled={request.prayed_by_me}
                                            onClick={() => pray(request)}
                                        >
                                            <HandHeart className="mr-1 size-4" />
                                            {request.prayed_by_me
                                                ? 'Prayed'
                                                : 'I prayed'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Pagination meta={requests} itemLabel="requests" />
            </div>
        </AppLayout>
    );
}
