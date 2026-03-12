import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type NotificationData = {
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

export function NotificationBell() {
    const { unreadNotificationCount, recentNotifications } = usePage<{
        unreadNotificationCount: number;
        recentNotifications?: Notification[];
    }>().props;

    const count = unreadNotificationCount ?? 0;
    const notifications = (recentNotifications ?? []) as Notification[];

    const markAsRead = (id: string) => {
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-5" />
                    {count > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {count > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">{count} unread</span>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className="flex cursor-pointer flex-col items-start gap-1 px-4 py-3"
                            onClick={() => {
                                if (!notification.read_at) {
                                    markAsRead(notification.id);
                                }
                                if (notification.data.url) {
                                    router.visit(notification.data.url);
                                }
                            }}
                        >
                            <div className="flex w-full items-start justify-between gap-2">
                                <span className={`text-sm ${!notification.read_at ? 'font-semibold' : ''}`}>
                                    {notification.data.title ?? 'Notification'}
                                </span>
                                {!notification.read_at && (
                                    <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-500" />
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-2">
                                {notification.data.message}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/notifications" className="w-full justify-center text-center text-sm">
                        View all notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
