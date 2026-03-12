import { CommandPalette } from '@/components/command-palette';
import { Toaster } from '@/components/ui/sonner';
import { useFlashMessages } from '@/hooks/use-flash-messages';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    useFlashMessages();

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
            <Toaster position="top-right" richColors closeButton />
            <CommandPalette />
        </AppLayoutTemplate>
    );
}