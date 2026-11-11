import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sidebar_pinned_items';

function loadPinnedHrefs(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function savePinnedHrefs(hrefs: string[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hrefs));
    } catch {
        // Storage can be unavailable (private mode); pins then last for the session only.
    }
}

type UseSidebarPreferencesReturn = {
    pinnedHrefs: string[];
    pin: (href: string) => void;
    unpin: (href: string) => void;
    isPinned: (href: string) => boolean;
};

/**
 * Per-browser sidebar preferences. Sections are always expanded, so the
 * only thing remembered is which links the user pinned to the top.
 */
export function useSidebarPreferences(): UseSidebarPreferencesReturn {
    const [pinnedHrefs, setPinnedHrefs] = useState<string[]>(loadPinnedHrefs);

    const pin = useCallback((href: string) => {
        setPinnedHrefs((prev) => {
            if (prev.includes(href)) return prev;
            const next = [...prev, href];
            savePinnedHrefs(next);
            return next;
        });
    }, []);

    const unpin = useCallback((href: string) => {
        setPinnedHrefs((prev) => {
            const next = prev.filter((h) => h !== href);
            savePinnedHrefs(next);
            return next;
        });
    }, []);

    const isPinned = useCallback(
        (href: string) => pinnedHrefs.includes(href),
        [pinnedHrefs],
    );

    return { pinnedHrefs, pin, unpin, isPinned };
}
