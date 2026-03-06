import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NavGroup } from '@/types';

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hrefs));
}

type GroupOpenStates = Record<string, boolean>;

type UseSidebarPreferencesReturn = {
    groupOpenStates: GroupOpenStates;
    toggleGroup: (title: string) => void;
    expandAll: () => void;
    collapseAll: () => void;
    allExpanded: boolean;
    pinnedHrefs: string[];
    pin: (href: string) => void;
    unpin: (href: string) => void;
    isPinned: (href: string) => boolean;
};

function resolveHref(href: unknown): string {
    return typeof href === 'string' ? href : String(href);
}

export function useSidebarPreferences(
    groups: NavGroup[],
    currentUrl: string,
): UseSidebarPreferencesReturn {
    // Build initial open states: open the group containing the active route
    const [groupOpenStates, setGroupOpenStates] = useState<GroupOpenStates>(
        () => {
            const states: GroupOpenStates = {};
            for (const group of groups) {
                const hasActiveItem = group.items.some((item) =>
                    currentUrl.startsWith(resolveHref(item.href)),
                );
                states[group.title] = hasActiveItem;
            }
            return states;
        },
    );

    // Auto-open group containing active route on navigation
    useEffect(() => {
        setGroupOpenStates((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const group of groups) {
                const hasActiveItem = group.items.some((item) =>
                    currentUrl.startsWith(resolveHref(item.href)),
                );
                if (hasActiveItem && !prev[group.title]) {
                    next[group.title] = true;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [currentUrl, groups]);

    const toggleGroup = useCallback((title: string) => {
        setGroupOpenStates((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    }, []);

    const expandAll = useCallback(() => {
        setGroupOpenStates((prev) => {
            const next: GroupOpenStates = {};
            for (const key of Object.keys(prev)) {
                next[key] = true;
            }
            return next;
        });
    }, []);

    const collapseAll = useCallback(() => {
        setGroupOpenStates((prev) => {
            const next: GroupOpenStates = {};
            for (const key of Object.keys(prev)) {
                next[key] = false;
            }
            return next;
        });
    }, []);

    const allExpanded = useMemo(
        () =>
            Object.keys(groupOpenStates).length > 0 &&
            Object.values(groupOpenStates).every(Boolean),
        [groupOpenStates],
    );

    // Pinned items management
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

    return {
        groupOpenStates,
        toggleGroup,
        expandAll,
        collapseAll,
        allExpanded,
        pinnedHrefs,
        pin,
        unpin,
        isPinned,
    };
}
