/**
 * True when a key press is meant for a form field or an open dialog, so
 * page-level keyboard shortcuts should ignore it.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    if (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    ) {
        return true;
    }

    return (
        target.closest(
            '[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]',
        ) !== null
    );
}
