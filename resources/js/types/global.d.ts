import type { Auth } from '@/types/auth';
import type { NavigationMenuItem } from '@/types/navigation';

export type SocialLink = {
    platform: string;
    url: string;
    icon: string;
    sort_order: number | null;
};

export type SiteSettings = {
    general: Record<string, string | null>;
    socialLinks: SocialLink[];
    logoUrl?: string | null;
};

export type ServiceTimeShared = {
    id: number;
    name: string;
    start_time: string | null;
    end_time: string | null;
};

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            navigation: NavigationMenuItem[];
            siteSettings: SiteSettings;
            serviceTimes: ServiceTimeShared[];
            [key: string]: unknown;
        };
    }
}
