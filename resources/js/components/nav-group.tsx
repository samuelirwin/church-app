import { Link } from '@inertiajs/react';
import {
    ChevronRight,
    ChevronsDownUp,
    ChevronsUpDown,
    Pin,
    PinOff,
} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup } from '@/types';

type NavGroupCollapsibleProps = {
    groups: NavGroup[];
    label?: string;
    groupOpenStates: Record<string, boolean>;
    onToggleGroup: (title: string) => void;
    onExpandCollapseAll: () => void;
    allExpanded: boolean;
    isPinned: (href: string) => boolean;
    onTogglePin: (href: string, currentlyPinned: boolean) => void;
};

export function NavGroupCollapsible({
    groups = [],
    label,
    groupOpenStates,
    onToggleGroup,
    onExpandCollapseAll,
    allExpanded,
    isPinned,
    onTogglePin,
}: NavGroupCollapsibleProps) {
    const { currentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            {label && (
                <SidebarGroupLabel>
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarGroupAction
                onClick={onExpandCollapseAll}
                title={allExpanded ? 'Collapse all' : 'Expand all'}
            >
                {allExpanded ? (
                    <ChevronsDownUp className="size-4" />
                ) : (
                    <ChevronsUpDown className="size-4" />
                )}
            </SidebarGroupAction>
            <SidebarMenu>
                {groups.map((group) => {
                    const isOpen = groupOpenStates[group.title] ?? false;

                    return (
                        <Collapsible
                            key={group.title}
                            asChild
                            open={isOpen}
                            onOpenChange={() => onToggleGroup(group.title)}
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={{ children: group.title }}>
                                        <group.icon />
                                        <span>{group.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {group.items.map((item) => {
                                            const href =
                                                typeof item.href === 'string'
                                                    ? item.href
                                                    : String(item.href);
                                            const isActive =
                                                currentUrl === href ||
                                                currentUrl.startsWith(
                                                    href + '/',
                                                );
                                            const pinned = isPinned(href);

                                            return (
                                                <SidebarMenuSubItem
                                                    key={item.title}
                                                    className="group/pin-target"
                                                >
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={isActive}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            prefetch
                                                        >
                                                            <span>
                                                                {item.title}
                                                            </span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                    <button
                                                        onClick={() =>
                                                            onTogglePin(
                                                                href,
                                                                pinned,
                                                            )
                                                        }
                                                        title={
                                                            pinned
                                                                ? 'Unpin'
                                                                : 'Pin to top'
                                                        }
                                                        className={`absolute top-1 right-1 flex size-5 items-center justify-center rounded-md text-sidebar-foreground opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-hidden group-hover/pin-target:opacity-100 ${
                                                            pinned
                                                                ? 'text-sidebar-accent-foreground opacity-100'
                                                                : ''
                                                        }`}
                                                    >
                                                        {pinned ? (
                                                            <PinOff className="size-3" />
                                                        ) : (
                                                            <Pin className="size-3" />
                                                        )}
                                                    </button>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
