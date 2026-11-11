import { useEffect, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { registerConfirmListener, type ConfirmRequest } from '@/lib/confirm';
import { cn } from '@/lib/utils';

/**
 * Renders the dialog for confirmAction(). Mount once, in the app layout.
 */
export function ConfirmDialogHost() {
    const [request, setRequest] = useState<ConfirmRequest | null>(null);

    useEffect(() => {
        registerConfirmListener(setRequest);
        return () => registerConfirmListener(null);
    }, []);

    const settle = (confirmed: boolean) => {
        request?.resolve(confirmed);
        setRequest(null);
    };

    return (
        <AlertDialog
            open={request !== null}
            onOpenChange={(open) => !open && settle(false)}
        >
            {/* Radix warns when there's no description; explicitly opt out when a request has none. */}
            <AlertDialogContent
                {...(request?.description
                    ? {}
                    : { 'aria-describedby': undefined })}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle>{request?.title}</AlertDialogTitle>
                    {request?.description && (
                        <AlertDialogDescription>
                            {request.description}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => settle(false)}>
                        {request?.cancelLabel ?? 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => settle(true)}
                        className={cn(
                            request?.destructive &&
                                'bg-destructive text-white hover:bg-destructive/90',
                        )}
                    >
                        {request?.confirmLabel ?? 'Confirm'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
