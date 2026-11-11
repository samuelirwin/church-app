import {
    columnVisibilityFeature,
    rowSelectionFeature,
    rowSortingFeature,
    tableFeatures,
    useTable,
    type ColumnDef,
    type ColumnVisibilityState,
    type RowData,
    type RowSelectionState,
    type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState, type ReactNode } from 'react';
import { ColumnVisibilityMenu } from './column-visibility-menu';
import { SortableHeader } from './sortable-header';
import { Pagination } from '@/components/shared/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/types/members';

/**
 * Features every data table uses. Sorting is "manual": the server sorts,
 * the table only tracks which header is active.
 *
 * A column is sortable when it has an `accessorFn` (the library's rule); its
 * `id` must match a sort key the server accepts. Display-only columns can't sort.
 */
export const dataTableFeatures = tableFeatures({
    rowSortingFeature,
    rowSelectionFeature,
    columnVisibilityFeature,
});

export type DataTableColumn<T extends RowData> = ColumnDef<
    typeof dataTableFeatures,
    T,
    unknown
>;

export type SortDirection = 'asc' | 'desc';

type Props<T extends RowData> = {
    data: T[];
    columns: DataTableColumn<T>[];
    getRowId: (row: T) => string;
    /** Current server sort, from the page's filters. */
    sort?: string;
    direction?: SortDirection;
    onSortChange: (
        sort: string | undefined,
        direction: SortDirection | undefined,
    ) => void;
    /** Filters and search shown on the left of the toolbar. */
    toolbar?: ReactNode;
    /** Shows row checkboxes; the function renders the actions for the selected ids. */
    bulkActions?: (
        selectedIds: string[],
        clearSelection: () => void,
    ) => ReactNode;
    /** Key for remembering which columns the user hid (per browser). */
    storageKey: string;
    /** Columns hidden until the user chooses otherwise. */
    defaultHidden?: string[];
    meta?: PaginationMeta;
    itemLabel?: string;
    empty: ReactNode;
};

const readHiddenColumns = (
    key: string,
    defaultHidden: string[],
): ColumnVisibilityState => {
    const defaults = Object.fromEntries(defaultHidden.map((id) => [id, false]));
    try {
        const stored = window.localStorage.getItem(`table-columns:${key}`);
        return stored ? JSON.parse(stored) : defaults;
    } catch {
        return defaults;
    }
};

const saveHiddenColumns = (key: string, state: ColumnVisibilityState) => {
    try {
        window.localStorage.setItem(
            `table-columns:${key}`,
            JSON.stringify(state),
        );
    } catch {
        // Storage can be unavailable (private mode); hiding still works for this visit.
    }
};

/**
 * Server-driven data table: sortable headers, show/hide columns, optional row
 * selection with bulk actions, and pagination. The page owns the data and the
 * URL; this component only renders and reports what the user asked for.
 */
export function DataTable<T extends RowData>({
    data,
    columns,
    getRowId,
    sort,
    direction,
    onSortChange,
    toolbar,
    bulkActions,
    storageKey,
    defaultHidden = [],
    meta,
    itemLabel,
    empty,
}: Props<T>) {
    const [columnVisibility, setColumnVisibility] =
        useState<ColumnVisibilityState>(() =>
            readHiddenColumns(storageKey, defaultHidden),
        );
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    // Selections only count for rows on the current page; anything else is dropped.
    const visibleIds = useMemo(
        () => new Set(data.map(getRowId)),
        [data, getRowId],
    );
    const currentSelection = useMemo(
        () =>
            Object.fromEntries(
                Object.keys(rowSelection)
                    .filter((id) => visibleIds.has(id))
                    .map((id) => [id, true as const]),
            ),
        [rowSelection, visibleIds],
    );

    const allColumns = useMemo<DataTableColumn<T>[]>(() => {
        if (!bulkActions) {
            return columns;
        }

        const selectColumn: DataTableColumn<T> = {
            id: 'select',
            enableSorting: false,
            enableHiding: false,
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected()
                            ? true
                            : table.getIsSomePageRowsSelected()
                              ? 'indeterminate'
                              : false
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(value === true)
                    }
                    aria-label="Select all rows on this page"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) =>
                        row.toggleSelected(value === true)
                    }
                    aria-label="Select row"
                />
            ),
        };

        return [selectColumn, ...columns];
    }, [columns, bulkActions]);

    const sorting: SortingState = sort
        ? [{ id: sort, desc: direction === 'desc' }]
        : [];

    const table = useTable({
        features: dataTableFeatures,
        columns: allColumns,
        data,
        getRowId: (row) => getRowId(row),
        manualSorting: true,
        enableMultiSort: false,
        state: { sorting, columnVisibility, rowSelection: currentSelection },
        onSortingChange: (updater) => {
            const next =
                typeof updater === 'function' ? updater(sorting) : updater;
            onSortChange(
                next[0]?.id,
                next[0] ? (next[0].desc ? 'desc' : 'asc') : undefined,
            );
        },
        onColumnVisibilityChange: (updater) => {
            setColumnVisibility((previous) => {
                const next =
                    typeof updater === 'function' ? updater(previous) : updater;
                saveHiddenColumns(storageKey, next);
                return next;
            });
        },
        onRowSelectionChange: (updater) =>
            setRowSelection((previous) =>
                typeof updater === 'function' ? updater(previous) : updater,
            ),
    });

    const selectedIds = Object.keys(currentSelection);
    const clearSelection = () => setRowSelection({});
    const visibleColumnCount = table.getVisibleLeafColumns().length;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {toolbar}
                </div>
                <ColumnVisibilityMenu table={table} />
            </div>

            {bulkActions && selectedIds.length > 0 && (
                <div
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm"
                    role="region"
                    aria-label="Bulk actions"
                >
                    <span className="font-medium">
                        {selectedIds.length} selected
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        {bulkActions(selectedIds, clearSelection)}
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        {table.getHeaderGroups().map((group) => (
                            <tr key={group.id}>
                                {group.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        scope="col"
                                        aria-sort={
                                            header.column.getIsSorted() ===
                                            'asc'
                                                ? 'ascending'
                                                : header.column.getIsSorted() ===
                                                    'desc'
                                                  ? 'descending'
                                                  : undefined
                                        }
                                        className={cn(
                                            'px-4 py-3 text-left font-medium text-muted-foreground',
                                            header.column.id === 'select' &&
                                                'w-10 pr-0',
                                        )}
                                    >
                                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                            <SortableHeader
                                                column={header.column}
                                            >
                                                <table.FlexRender
                                                    header={header}
                                                />
                                            </SortableHeader>
                                        ) : (
                                            <table.FlexRender header={header} />
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                data-state={
                                    row.getIsSelected() ? 'selected' : undefined
                                }
                                className="hover:bg-muted/30 data-[state=selected]:bg-primary/5"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className={cn(
                                            'px-4 py-3',
                                            cell.column.id === 'select' &&
                                                'w-10 pr-0',
                                        )}
                                    >
                                        <table.FlexRender cell={cell} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={visibleColumnCount}>{empty}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {meta && <Pagination meta={meta} itemLabel={itemLabel} />}
        </div>
    );
}
