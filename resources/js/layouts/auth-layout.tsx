import { Toaster } from '@/components/ui/sonner';
import { useFlashMessages } from '@/hooks/use-flash-messages';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    useFlashMessages();

    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
            <Toaster position="top-right" richColors closeButton />
        </AuthLayoutTemplate>
    );
}