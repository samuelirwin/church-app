import { BarChart3, Table2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ChartSkeleton } from '@/components/shared/skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type ChartTable = {
    columns: string[];
    rows: Array<Array<string | number>>;
};

type Props = {
    title: string;
    description?: string;
    legend?: ReactNode;
    /** True before the first response arrives: shows a skeleton. */
    loading?: boolean;
    /** True while newer data loads: keeps the last chart visible, faded, so nothing jumps. */
    refreshing?: boolean;
    /** The same numbers as a table, so values never depend on hovering or colour. */
    table?: ChartTable;
    height?: number;
    className?: string;
    children: ReactNode;
};

/**
 * Card wrapper for every chart: title, optional legend, a chart/table toggle,
 * and loading states.
 */
export function ChartCard({
    title,
    description,
    legend,
    loading = false,
    refreshing = false,
    table,
    height = 300,
    className,
    children,
}: Props) {
    const [showTable, setShowTable] = useState(false);

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-base">{title}</CardTitle>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
                {table && !loading && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground"
                        onClick={() => setShowTable((v) => !v)}
                        aria-pressed={showTable}
                        aria-label={
                            showTable
                                ? `Show ${title} as a chart`
                                : `Show ${title} as a table`
                        }
                        title={showTable ? 'Show chart' : 'Show table'}
                    >
                        {showTable ? (
                            <BarChart3 className="size-4" />
                        ) : (
                            <Table2 className="size-4" />
                        )}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <ChartSkeleton height={height} />
                ) : (
                    <div
                        className={cn(
                            'transition-opacity',
                            refreshing && 'opacity-50',
                        )}
                        aria-busy={refreshing}
                    >
                        {showTable && table ? (
                            <ChartDataTable table={table} />
                        ) : (
                            children
                        )}
                    </div>
                )}
                {legend && !loading && !showTable && legend}
            </CardContent>
        </Card>
    );
}

function ChartDataTable({ table }: { table: ChartTable }) {
    if (table.rows.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                No data for this period.
            </p>
        );
    }

    return (
        <div className="max-h-[300px] overflow-auto rounded-md border">
            <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80">
                    <tr>
                        {table.columns.map((column, i) => (
                            <th
                                key={column}
                                className={cn(
                                    'px-3 py-2 font-medium text-muted-foreground',
                                    i === 0 ? 'text-left' : 'text-right',
                                )}
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {table.rows.map((row, r) => (
                        <tr key={r}>
                            {row.map((cell, i) => (
                                <td
                                    key={i}
                                    className={cn(
                                        'px-3 py-1.5',
                                        i === 0
                                            ? 'text-left'
                                            : 'text-right tabular-nums',
                                    )}
                                >
                                    {typeof cell === 'number'
                                        ? cell.toLocaleString()
                                        : cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
