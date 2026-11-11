import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type UpcomingColumn<Row> = {
    header: string;
    cell: (row: Row) => ReactNode;
    align?: 'left' | 'right';
    /** Hide on narrow screens to keep the table readable on phones. */
    hideOnMobile?: boolean;
};

type Props<Row> = {
    title: string;
    description: string;
    rows: Row[];
    columns: UpcomingColumn<Row>[];
    rowKey: (row: Row) => string | number;
    emptyMessage: string;
    viewAll: { href: string; label: string };
};

/**
 * Small "what's next" table for the dashboard (a handful of rows, no paging),
 * with a link to the full list underneath.
 */
export function UpcomingTableCard<Row>({
    title,
    description,
    rows,
    columns,
    rowKey,
    emptyMessage,
    viewAll,
}: Props<Row>) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="space-y-1">
                <CardTitle className="text-base">{title}</CardTitle>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
                {rows.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center py-8 text-sm text-muted-foreground">
                        {emptyMessage}
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/80">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column.header}
                                            className={cn(
                                                'px-3 py-2 font-medium whitespace-nowrap text-muted-foreground',
                                                column.align === 'right'
                                                    ? 'text-right'
                                                    : 'text-left',
                                                column.hideOnMobile &&
                                                    'hidden sm:table-cell',
                                            )}
                                        >
                                            {column.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.map((row) => (
                                    <tr key={rowKey(row)}>
                                        {columns.map((column) => (
                                            <td
                                                key={column.header}
                                                className={cn(
                                                    'px-3 py-2',
                                                    column.align === 'right'
                                                        ? 'text-right tabular-nums'
                                                        : 'text-left',
                                                    column.hideOnMobile &&
                                                        'hidden sm:table-cell',
                                                )}
                                            >
                                                {column.cell(row)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Link
                    href={viewAll.href}
                    className="mt-auto inline-flex items-center gap-1 self-end text-sm font-medium text-primary hover:underline"
                >
                    {viewAll.label}
                    <ArrowRight className="size-3.5" aria-hidden />
                </Link>
            </CardContent>
        </Card>
    );
}
