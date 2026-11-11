import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Bell,
    BookOpen,
    Calendar,
    ClipboardCheck,
    ClipboardList,
    Contact,
    FileText,
    GraduationCap,
    HandHeart,
    HandHelping,
    HeartHandshake,
    Highlighter,
    House,
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
import type { LucideIcon } from 'lucide-react';
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
import { ADMIN_HOME, isAdminArea } from '@/lib/app-area';
import { dashboard } from '@/routes';
import type { NavGroup, NavItem, User, Permissions } from '@/types';
import AppLogo from './app-logo';

function buildMainItems(): NavItem[] {
    return [
        { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
        { title: 'My Duties', href: '/volunteer/my-duties', icon: ClipboardList },
        { title: 'My Books', href: '/library/my-lendings', icon: Library },
        { title: 'My Events', href: '/my-events', icon: Calendar },
        { title: 'My Courses', href: '/my-courses', icon: GraduationCap },
        { title: 'My Reading Plans', href: '/my-reading-plans', icon: BookOpen },
        { title: 'My Ministries', href: '/my-ministries', icon: UsersRound },
        { title: 'My Care Needs', href: '/my-care-needs', icon: HandHelping },
        { title: 'Prayer Wall', href: '/prayer-wall', icon: HandHeart },
        { title: 'Notifications', href: '/notifications', icon: Bell },
        { title: 'Settings', href: '/settings/profile', icon: UserCog },
    ];
}

function buildAdminGroups(user: User | null, permissions: Permissions): NavGroup[] {
    if (!user || !permissions.isLeaderOrAbove) {
        return [];
    }

    const groups: NavGroup[] = [];

    // Worship & Teaching — staff+ get full access, leaders get view-only
    if (permissions.isLeaderOrAbove) {
        groups.push({
            title: 'Worship & Teaching',
            icon: Mic2,
            items: [
                { title: 'Sermons', href: '/admin/sermons', icon: Volume2 },
                { title: 'Speakers', href: '/admin/speakers', icon: Mic2 },
                { title: 'Series', href: '/admin/series', icon: Library },
            ],
        });
    }

    // Content — staff+ get full access, leaders get view-only (no Pages for leaders)
    {
        const contentItems: NavItem[] = [
            { title: 'Posts', href: '/admin/posts', icon: StickyNote },
            { title: 'Highlights', href: '/admin/highlights', icon: Highlighter },
            { title: 'Documents', href: '/admin/documents', icon: FileText },
        ];

        if (permissions.isAdmin) {
            contentItems.push({ title: 'Pages', href: '/admin/pages', icon: PanelTop });
        }

        groups.push({
            title: 'Content',
            icon: Newspaper,
            items: contentItems,
        });
    }

    // People — directory, attendance, and visitors; households are staff+ only
    {
        const peopleItems: NavItem[] = [
            { title: 'Members', href: '/admin/members', icon: Contact },
            { title: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck },
            { title: 'Care Needs', href: '/admin/care-needs', icon: HandHelping },
            { title: 'Visitors', href: '/admin/visitors', icon: UserPlus },
        ];

        if (permissions.isStaffOrAbove) {
            peopleItems.splice(1, 0, { title: 'Households', href: '/admin/households', icon: House });
        }

        groups.push({
            title: 'People',
            icon: Contact,
            items: peopleItems,
        });
    }

    // Community — all roles see events/ministries/groups/roster, conditional benevolence/counseling
    {
        const communityItems: NavItem[] = [
            { title: 'Events', href: '/admin/events', icon: Calendar },
            { title: 'Ministries', href: '/admin/ministries', icon: UsersRound },
            { title: 'Groups', href: '/admin/ministry-groups', icon: Users },
            { title: 'Roster', href: '/admin/volunteer/roster', icon: ClipboardList },
        ];

        if (permissions.isStaffOrAbove || permissions.isDeacon) {
            communityItems.push(
                { title: 'Benevolence', href: '/admin/benevolent-requests', icon: HandHeart },
            );
        }

        if (permissions.isStaffOrAbove || permissions.isCounselor) {
            communityItems.push(
                { title: 'Counseling', href: '/admin/counseling-cases', icon: HeartHandshake },
            );
        }

        groups.push({
            title: 'Community',
            icon: UsersRound,
            items: communityItems,
        });
    }

    // Growth — all roles see (view-only for leaders)
    groups.push({
        title: 'Growth',
        icon: Sprout,
        items: [
            { title: 'Reading Plans', href: '/admin/reading-plans', icon: BookOpen },
            { title: 'Courses', href: '/admin/courses', icon: GraduationCap },
            { title: 'Books', href: '/admin/books', icon: Library },
            { title: 'Forms', href: '/admin/forms', icon: ClipboardList },
        ],
    });

    // Administration
    {
        const administrationItems: NavItem[] = [
            { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        ];

        if (permissions.isAdmin) {
            administrationItems.unshift({
                title: 'Users',
                href: '/admin/users',
                icon: Users,
            });
            administrationItems.push(
                { title: 'Site Settings', href: '/admin/site-settings', icon: Settings },
            );
        }

        groups.push({
            title: 'Administration',
            icon: Settings,
            items: administrationItems,
        });
    }

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
    const { auth, permissions } = usePage().props;
    const user = auth.user as User | null;
    const perms = (permissions ?? { isAdmin: false, isStaffOrAbove: false, isLeaderOrAbove: false, isDeacon: false, isCounselor: false }) as Permissions;
    const { currentUrl } = useCurrentUrl();

    // Admin pages show only admin navigation; every other page shows only personal links.
    const inAdminArea = isAdminArea(currentUrl);
    const mainItems = inAdminArea ? [{ title: 'Admin Dashboard', href: ADMIN_HOME, icon: LayoutGrid }] : buildMainItems();
    const adminGroups = inAdminArea ? buildAdminGroups(user, perms) : [];
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
                            <Link href={inAdminArea ? ADMIN_HOME : dashboard()} prefetch>
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
