import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: string;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

export type NavGroup = {
    title: string;
    icon: LucideIcon;
    items: NavItem[];
};

export type NavigationMenuItem = {
    id: number;
    label: string;
    url: string;
    target: '_self' | '_blank';
    children: NavigationMenuItem[];
};
