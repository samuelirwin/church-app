import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isTypingTarget } from '@/lib/keyboard';

type Options = {
    /** The list page URL, e.g. '/admin/care-needs'. */
    url: string;
    /** Current query filters, kept when the selection changes. */
    filters: Record<string, unknown>;
    /** Ids of the rows currently shown, in display order. */
    ids: number[];
    /** Id of the record the server returned in the "selected" prop. */
    selectedId: number | null;
};

/**
 * Selection state for a split view (list + detail panel).
 *
 * Selecting a row puts ?selected=<id> in the URL and reloads only the
 * "selected" prop, so the list keeps its scroll position and filters and the
 * link can be shared or bookmarked. Also wires up inbox-style shortcuts:
 * j = next, k = previous, Esc = close.
 */
export function useListSelection({ url, filters, ids, selectedId }: Options) {
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const activeId = loadingId ?? selectedId;
    const position = activeId !== null ? ids.indexOf(activeId) : -1;

    const select = useCallback(
        (id: number | null) => {
            setLoadingId(id);
            router.get(
                url,
                { ...filters, selected: id ?? undefined },
                {
                    only: ['selected', 'filters'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => setLoadingId(null),
                },
            );
        },
        [url, filters],
    );

    const previous = position > 0 ? () => select(ids[position - 1]) : undefined;
    const next =
        position < ids.length - 1 && ids.length > 0
            ? () => select(ids[position + 1])
            : undefined;
    const close = activeId !== null ? () => select(null) : undefined;

    // The listener is attached once; it always calls the latest handlers via this ref.
    const shortcuts = useRef({ previous, next, close });
    useEffect(() => {
        shortcuts.current = { previous, next, close };
    });

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                isTypingTarget(event.target) ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            ) {
                return;
            }

            const handler = {
                j: shortcuts.current.next,
                k: shortcuts.current.previous,
                Escape: shortcuts.current.close,
            }[event.key];

            if (handler) {
                event.preventDefault();
                handler();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return {
        activeId,
        /** True while a newly picked record is still loading. */
        isLoading: loadingId !== null && loadingId !== selectedId,
        select,
        previous,
        next,
        close,
    };
}
