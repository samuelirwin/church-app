import { Link } from '@inertiajs/react';
import { PinOff } from 'lucide-react';
import { navItemClassName, navSectionLabelClassName } from '@/components/nav-group';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavPinned({
    items,
    onUnpin,
}: {
    items: NavItem[];
    onUnpin: (href: string) => void;
}) {
    const { currentUrl } = useCurrentUrl();

    if (items.length === 0) return null;

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className={navSectionLabelClassName}>Pinned</SidebarGroupLabel>
            <SidebarMenu className="gap-px">
                {items.map((item) => {
                    const href =
                        typeof item.href === 'string'
                            ? item.href
                            : String(item.href);
                    const isActive =
                        currentUrl === href ||
                        currentUrl.startsWith(href + '/');

                    return (
                        <SidebarMenuItem key={href}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                className={navItemClassName}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                            <SidebarMenuAction
                                showOnHover
                                onClick={() => onUnpin(href)}
                                title="Unpin"
                            >
                                <PinOff className="size-3.5" />
                            </SidebarMenuAction>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
