import { Link, usePage } from '@inertiajs/react';
import { ExternalLink, Home, Search, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationBell } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { ADMIN_HOME, isAdminArea, MEMBER_HOME } from '@/lib/app-area';
import type {
    BreadcrumbItem as BreadcrumbItemType,
    Permissions,
} from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { permissions } = usePage().props as { permissions?: Permissions };
    const { currentUrl } = useCurrentUrl();
    const inAdminArea = isAdminArea(currentUrl);
    const canUseAdminArea = permissions?.isLeaderOrAbove ?? false;

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="hidden gap-2 text-muted-foreground md:flex"
                    onClick={() =>
                        document.dispatchEvent(
                            new KeyboardEvent('keydown', {
                                key: 'k',
                                metaKey: true,
                            }),
                        )
                    }
                >
                    <Search className="size-4" />
                    <span>Search</span>
                    <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        <span className="text-xs">&#8984;</span>K
                    </kbd>
                </Button>
                <NotificationBell />
                {inAdminArea ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={MEMBER_HOME}>
                            <Home className="h-4 w-4 sm:mr-1.5" />
                            <span className="sr-only sm:not-sr-only">
                                Go to Member Home
                            </span>
                        </Link>
                    </Button>
                ) : (
                    canUseAdminArea && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={ADMIN_HOME}>
                                <Shield className="h-4 w-4 sm:mr-1.5" />
                                <span className="sr-only sm:not-sr-only">
                                    Go to Admin
                                </span>
                            </Link>
                        </Button>
                    )
                )}
                <Button variant="outline" size="sm" asChild>
                    <a href="/" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 sm:mr-1.5" />
                        <span className="sr-only sm:not-sr-only">
                            Visit Public Site
                        </span>
                    </a>
                </Button>
            </div>
        </header>
    );
}
