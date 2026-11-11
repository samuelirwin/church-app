import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type TimelineEntry = {
    id: number | string;
    title: ReactNode;
    meta?: ReactNode;
    body?: ReactNode;
    icon?: LucideIcon;
};

type Props = {
    entries: TimelineEntry[];
    empty?: ReactNode;
};

/**
 * Vertical activity timeline: a dot (or icon) on a connecting line, then the
 * title, a muted meta line (who/when), and optional body text.
 */
export function Timeline({ entries, empty }: Props) {
    if (entries.length === 0) {
        return <>{empty ?? null}</>;
    }

    return (
        <ol className="relative">
            {entries.map((entry, index) => {
                const Icon = entry.icon;
                const isLast = index === entries.length - 1;

                return (
                    <li
                        key={entry.id}
                        className="relative flex gap-3 pb-5 last:pb-0"
                    >
                        {!isLast && (
                            <span
                                className="absolute top-7 bottom-0 left-[13px] w-px bg-border"
                                aria-hidden
                            />
                        )}
                        <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
                            {Icon ? (
                                <Icon className="size-3.5 text-muted-foreground" />
                            ) : (
                                <span className="size-2 rounded-full bg-primary/60" />
                            )}
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <div className="text-sm font-medium">
                                {entry.title}
                            </div>
                            {entry.meta && (
                                <div className="text-xs text-muted-foreground">
                                    {entry.meta}
                                </div>
                            )}
                            {entry.body && (
                                <div className="mt-1 text-sm whitespace-pre-line text-foreground/90">
                                    {entry.body}
                                </div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
