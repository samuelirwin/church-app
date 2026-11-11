import { cn } from '@/lib/utils';

type Option<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Accessible name for the group, e.g. "Time period". */
    label: string;
    className?: string;
};

/**
 * Pill-style single choice (e.g. 30 days / 3 months / 12 months).
 * Behaves as a radio group for keyboard and screen-reader users.
 */
export function SegmentedControl<T extends string | number>({
    options,
    value,
    onChange,
    label,
    className,
}: Props<T>) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={cn(
                'inline-flex rounded-lg border bg-muted/50 p-0.5',
                className,
            )}
        >
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={String(option.value)}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                            selected
                                ? 'bg-background font-medium text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
