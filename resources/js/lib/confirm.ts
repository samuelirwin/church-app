/**
 * Promise-based replacement for window.confirm() that renders the app's own
 * dialog. Call it from any event handler:
 *
 *   if (await confirmAction({ title: 'Delete this event?', destructive: true })) { ... }
 *
 * <ConfirmDialogHost /> (mounted once in the app layout) listens for requests
 * and resolves the promise with true (confirmed) or false (cancelled).
 */
export type ConfirmOptions = {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
};

export type ConfirmRequest = ConfirmOptions & {
    resolve: (confirmed: boolean) => void;
};

type Listener = (request: ConfirmRequest) => void;

let listener: Listener | null = null;

export function registerConfirmListener(next: Listener | null): void {
    listener = next;
}

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
        if (!listener) {
            // No host mounted (e.g. a page outside the app layout): fall back to the browser dialog.
            resolve(
                window.confirm(
                    options.description
                        ? `${options.title}\n\n${options.description}`
                        : options.title,
                ),
            );
            return;
        }

        listener({ ...options, resolve });
    });
}
