import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type NotificationData = {
    type?: string;
    title?: string;
    message?: string;
    url?: string;
};

type Notification = {
    id: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
};

type PaginatedNotifications = {
    data: Notification[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = {
    notifications: PaginatedNotifications;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Notifications', href: '/notifications' },
];

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function NotificationsIndex({ notifications }: Props) {
    const markAsRead = (id: string) => {
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const markAllAsRead = () => {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    const hasUnread = notifications.data.some((n) => !n.read_at);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="size-6" />
                        <h1 className="text-2xl font-bold">Notifications</h1>
                    </div>
                    {hasUnread && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            <CheckCheck className="mr-1.5 size-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {notifications.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Bell className="mx-auto mb-4 size-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No notifications yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {notifications.data.map((notification) => (
                            <Card
                                key={notification.id}
                                className={`cursor-pointer transition-colors hover:bg-muted/50 ${!notification.read_at ? 'border-l-4 border-l-blue-500' : ''}`}
                                onClick={() => {
                                    if (!notification.read_at) {
                                        markAsRead(notification.id);
                                    }
                                    if (notification.data.url) {
                                        router.visit(notification.data.url);
                                    }
                                }}
                            >
                                <CardContent className="flex items-start gap-4 py-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${!notification.read_at ? 'font-semibold' : ''}`}>
                                                {notification.data.title ?? 'Notification'}
                                            </span>
                                            {!notification.read_at && <Badge variant="secondary" className="text-xs">New</Badge>}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {notification.data.message}
                                        </p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {formatDate(notification.created_at)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {notifications.last_page > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        {notifications.prev_page_url && (
                            <Button variant="outline" size="sm" onClick={() => router.visit(notifications.prev_page_url!)}>
                                Previous
                            </Button>
                        )}
                        <span className="flex items-center text-sm text-muted-foreground">
                            Page {notifications.current_page} of {notifications.last_page}
                        </span>
                        {notifications.next_page_url && (
                            <Button variant="outline" size="sm" onClick={() => router.visit(notifications.next_page_url!)}>
                                Next
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
