import type { TooltipContentProps } from 'recharts';
import { formatDateLabel } from './chart-theme';

type Props = Pick<Partial<TooltipContentProps<number, string>>, 'active' | 'payload' | 'label'> & {
    /** Formats each value, e.g. as currency. Defaults to locale number format. */
    formatValue?: (value: number) => string;
    /** Formats the heading (the x value). Defaults to a friendly date when it looks like one. */
    formatLabel?: (label: string, row: unknown) => string;
};

/**
 * One tooltip listing every series at the hovered point. The value leads in
 * strong ink and the series name follows in muted ink, keyed by a short line
 * in the series colour (text itself never takes the series colour).
 */
export function ChartTooltip({
    active,
    payload,
    label,
    formatValue = (v) => v.toLocaleString(),
    formatLabel,
}: Props) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const heading = formatLabel
        ? formatLabel(String(label ?? ''), payload[0]?.payload)
        : formatDateLabel(String(label ?? ''));

    return (
        <div className="min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
            {heading && (
                <div className="mb-1.5 text-muted-foreground">{heading}</div>
            )}
            <ul className="space-y-1">
                {payload.map((entry) => (
                    <li
                        key={String(entry.dataKey)}
                        className="flex items-center gap-2"
                    >
                        <span
                            className="h-0.5 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: entry.color }}
                            aria-hidden
                        />
                        <span className="font-semibold text-foreground">
                            {typeof entry.value === 'number'
                                ? formatValue(entry.value)
                                : String(entry.value ?? '-')}
                        </span>
                        <span className="text-muted-foreground">
                            {entry.name}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
