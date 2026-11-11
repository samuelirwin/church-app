import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string;
};

/**
 * Friendly "nothing here" message with an icon and an optional next step.
 */
export function EmptyState({
    title,
    description,
    icon: Icon = Inbox,
    action,
    className,
}: Props) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-2 px-4 py-10 text-center',
                className,
            )}
        >
            <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description && (
                <p className="max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

/**
 * EmptyState wrapped in a full-width table row, for tables with no results.
 */
export function TableEmptyRow({
    colSpan,
    ...props
}: Props & { colSpan: number }) {
    return (
        <tr>
            <td colSpan={colSpan}>
                <EmptyState {...props} />
            </td>
        </tr>
    );
}
