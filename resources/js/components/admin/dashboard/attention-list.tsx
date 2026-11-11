import { Link } from '@inertiajs/react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type AttentionItem = {
    key: string;
    label: string;
    description: string;
    value: number;
    href: string | null;
};

/**
 * Short to-do list for the dashboard: each row is a count of things waiting on
 * someone, linking to the filtered list. Rows with work waiting are flagged in
 * red (number plus a dot, so it never relies on colour alone); clear rows read
 * as "all clear".
 */
export function AttentionList({ items }: { items: AttentionItem[] }) {
    const waiting = items.filter((item) => item.value > 0).length;

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-base">Needs attention</CardTitle>
                <p className="text-sm text-muted-foreground">
                    {waiting === 0
                        ? 'All clear. Nothing is waiting on anyone.'
                        : `${waiting} of ${items.length} queues have work waiting`}
                </p>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y border-t">
                    {items.map((item) => (
                        <li key={item.key}>
                            <AttentionRow item={item} />
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

function AttentionRow({ item }: { item: AttentionItem }) {
    const hasWork = item.value > 0;

    const body = (
        <div className="flex items-center gap-3 px-6 py-3">
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                    {hasWork ? (
                        <span
                            className="size-2 shrink-0 rounded-full bg-[var(--viz-critical)]"
                            aria-hidden
                        />
                    ) : (
                        <CheckCircle2
                            className="size-3.5 shrink-0 text-[var(--viz-good)]"
                            aria-hidden
                        />
                    )}
                    {item.label}
                </p>
                <p className="truncate pl-4 text-xs text-muted-foreground">
                    {item.description}
                </p>
            </div>
            <span
                className={cn(
                    'text-xl font-semibold tabular-nums',
                    hasWork
                        ? 'text-[var(--viz-critical)]'
                        : 'text-muted-foreground',
                )}
            >
                {item.value.toLocaleString()}
            </span>
            {item.href ? (
                <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                />
            ) : (
                <span className="size-4 shrink-0" aria-hidden />
            )}
        </div>
    );

    return item.href ? (
        <Link
            href={item.href}
            className="block transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
        >
            {body}
        </Link>
    ) : (
        body
    );
}
