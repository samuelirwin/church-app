import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';

type SortableColumn = {
    getIsSorted: () => false | 'asc' | 'desc';
    getToggleSortingHandler: () => undefined | ((event: unknown) => void);
};

/**
 * Header button that cycles sorting: ascending, descending, then off.
 * The arrow shows the current direction; the th carries aria-sort.
 */
export function SortableHeader({
    column,
    children,
}: {
    column: SortableColumn;
    children: ReactNode;
}) {
    const sorted = column.getIsSorted();
    const Icon =
        sorted === 'asc'
            ? ArrowUp
            : sorted === 'desc'
              ? ArrowDown
              : ChevronsUpDown;

    return (
        <button
            type="button"
            onClick={column.getToggleSortingHandler()}
            className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            {children}
            <Icon
                className={
                    sorted ? 'size-3.5 text-foreground' : 'size-3.5 opacity-50'
                }
                aria-hidden
            />
        </button>
    );
}
