import { Link } from '@inertiajs/react';
import { Pin, PinOff } from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup } from '@/types';

/**
 * Shared look for every sidebar link: muted text that darkens on hover,
 * and a soft filled pill with medium weight when the link is active.
 */
export const navItemClassName =
    'h-8 text-sidebar-foreground/75 hover:bg-transparent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground';

/** Small uppercase heading that sits above each sidebar section. */
export const navSectionLabelClassName =
    'pt-2 pb-px text-[11px] font-medium tracking-wider text-sidebar-foreground/50 uppercase';

type NavSectionsProps = {
    groups: NavGroup[];
    isPinned: (href: string) => boolean;
    onTogglePin: (href: string, currentlyPinned: boolean) => void;
};

/**
 * Renders each group as a fixed section: a heading followed by its links.
 * Sections are always expanded, so every page is one click away.
 */
export function NavSections({ groups = [], isPinned, onTogglePin }: NavSectionsProps) {
    const { currentUrl } = useCurrentUrl();

    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.title} className="px-2 py-0">
                    <SidebarGroupLabel className={navSectionLabelClassName}>
                        {group.title}
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-px">
                        {group.items.map((item) => {
                            const href = typeof item.href === 'string' ? item.href : String(item.href);
                            const isActive = currentUrl === href || currentUrl.startsWith(href + '/');
                            const pinned = isPinned(href);

                            return (
                                <SidebarMenuItem key={item.title}>
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
                                        showOnHover={!pinned}
                                        onClick={() => onTogglePin(href, pinned)}
                                        title={pinned ? 'Unpin' : 'Pin to top'}
                                    >
                                        {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                                    </SidebarMenuAction>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
