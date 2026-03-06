import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Listens for Inertia shared flash props and displays them as Sonner toasts.
 * Tracks the last shown message to prevent duplicate toasts on re-renders.
 */
export function useFlashMessages(): void {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const lastFlash = useRef<string | null>(null);

    useEffect(() => {
        const message = flash?.success || flash?.error || null;
        if (!message || message === lastFlash.current) {
            return;
        }

        lastFlash.current = message;

        if (flash?.success) {
            toast.success(flash.success);
        } else if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);
}