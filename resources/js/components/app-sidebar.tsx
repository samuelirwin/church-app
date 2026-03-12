import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Calendar,
    ClipboardList,
    FileText,
    GraduationCap,
    HandHeart,
    HeartHandshake,
    Highlighter,
    LayoutGrid,
    Library,
    Mic2,
    Newspaper,
    PanelTop,
    Settings,
    Sprout,
    StickyNote,
    UserCog,
    UserPlus,
    Users,
    UsersRound,
    Volume2,
} from 'lucide-react';
import { NavGroupCollapsible } from '@/components/nav-group';
import { NavMain } from '@/components/nav-main';
import { NavPinned } from '@/components/nav-pinned';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useSidebarPreferences } from '@/hooks/use-sidebar-preferences';
import { dashboard } from '@/routes';
import type { LucideIcon } from 'lucide-react';
import type { NavGroup, NavItem, User } from '@/types';
import AppLogo from './app-logo';

function buildMainItems(): NavItem[] {
    return [{ title: 'Dashboard', href: dashboard(), icon: LayoutGrid }];
}

function buildAdminGroups(user: User | null): NavGroup[] {
    if (!user || !['admin', 'staff', 'leader'].includes(user.role)) {
        return [];
    }

    const groups: NavGroup[] = [];

    if (['admin', 'staff'].includes(user.role)) {
        groups.push(
            {
                title: 'Worship & Teaching',
                icon: Mic2,
                items: [
                    { title: 'Sermons', href: '/admin/sermons', icon: Volume2 },
                    { title: 'Speakers', href: '/admin/speakers', icon: Mic2 },
                    { title: 'Series', href: '/admin/series', icon: Library },
                ],
            },
            {
                title: 'Content',
                icon: Newspaper,
                items: [
                    { title: 'Posts', href: '/admin/posts', icon: StickyNote },
                    { title: 'Highlights', href: '/admin/highlights', icon: Highlighter },
                    { title: 'Pages', href: '/admin/pages', icon: PanelTop },
                    { title: 'Documents', href: '/admin/documents', icon: FileText },
                ],
            },
            {
                title: 'Community',
                icon: UsersRound,
                items: [
                    { title: 'Events', href: '/admin/events', icon: Calendar },
                    { title: 'Ministries', href: '/admin/ministries', icon: UsersRound },
                    { title: 'Groups', href: '/admin/ministry-groups', icon: Users },
                    { title: 'Roster', href: '/admin/volunteer/roster', icon: ClipboardList },
                    { title: 'Visitors', href: '/admin/visitors', icon: UserPlus },
                    { title: 'Benevolence', href: '/admin/benevolent-requests', icon: HandHeart },
                    { title: 'Counseling', href: '/admin/counseling-cases', icon: HeartHandshake },
                ],
            },
            {
                title: 'Growth',
                icon: Sprout,
                items: [
                    { title: 'Reading Plans', href: '/admin/reading-plans', icon: BookOpen },
                    { title: 'Courses', href: '/admin/courses', icon: GraduationCap },
                    { title: 'Books', href: '/admin/books', icon: Library },
                    { title: 'Forms', href: '/admin/forms', icon: ClipboardList },
                ],
            },
        );
    }

    const administrationItems: NavItem[] = [
        { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { title: 'Site Settings', href: '/admin/site-settings', icon: Settings },
        { title: 'Settings', href: '/settings/profile', icon: UserCog },
    ];

    if (user.role === 'admin') {
        administrationItems.unshift({
            title: 'Users',
            href: '/admin/users',
            icon: Users,
        });
    }

    groups.push({
        title: 'Administration',
        icon: Settings,
        items: administrationItems,
    });

    return groups;
}

function buildIconMap(groups: NavGroup[]): Record<string, LucideIcon> {
    const map: Record<string, LucideIcon> = {};
    for (const group of groups) {
        for (const item of group.items) {
            const href = typeof item.href === 'string' ? item.href : String(item.href);
            if (item.icon) {
                map[href] = item.icon;
            }
        }
    }
    return map;
}

export function AppSidebar() {
    const { auth } = usePage().props;
    const user = auth.user as User | null;
    const { currentUrl } = useCurrentUrl();

    const mainItems = buildMainItems();
    const adminGroups = buildAdminGroups(user);
    const iconMap = buildIconMap(adminGroups);

    const {
        groupOpenStates,
        toggleGroup,
        expandAll,
        collapseAll,
        allExpanded,
        pinnedHrefs,
        pin,
        unpin,
        isPinned,
    } = useSidebarPreferences(adminGroups, currentUrl);

    // Build valid hrefs from current groups for filtering stale pins
    const validHrefs = new Set(
        adminGroups.flatMap((g) =>
            g.items.map((i) => (typeof i.href === 'string' ? i.href : String(i.href))),
        ),
    );

    const pinnedItems: NavItem[] = pinnedHrefs
        .filter((href) => validHrefs.has(href))
        .map((href) => {
            const group = adminGroups.find((g) =>
                g.items.some((i) => {
                    const h = typeof i.href === 'string' ? i.href : String(i.href);
                    return h === href;
                }),
            );
            const item = group?.items.find((i) => {
                const h = typeof i.href === 'string' ? i.href : String(i.href);
                return h === href;
            });
            return {
                title: item?.title ?? href,
                href,
                icon: iconMap[href] ?? null,
            };
        });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainItems} />

                <NavPinned items={pinnedItems} onUnpin={unpin} />

                {adminGroups.length > 0 && (
                    <NavGroupCollapsible
                        groups={adminGroups}
                        label="Manage"
                        groupOpenStates={groupOpenStates}
                        onToggleGroup={toggleGroup}
                        onExpandCollapseAll={allExpanded ? collapseAll : expandAll}
                        allExpanded={allExpanded}
                        isPinned={isPinned}
                        onTogglePin={(href, pinned) =>
                            pinned ? unpin(href) : pin(href)
                        }
                    />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
