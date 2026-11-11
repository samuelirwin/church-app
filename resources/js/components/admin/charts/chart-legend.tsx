type Item = { label: string; color: string; shape?: 'rect' | 'line' };

/**
 * Legend for charts with two or more series. Swatches mirror the mark
 * (a box for bars/areas, a line for lines); labels stay in text colour.
 */
export function ChartLegend({ items }: { items: Item[] }) {
    return (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {items.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5">
                    <span
                        className={
                            item.shape === 'line'
                                ? 'h-0.5 w-3 rounded-full'
                                : 'size-2.5 rounded-[3px]'
                        }
                        style={{ backgroundColor: item.color }}
                        aria-hidden
                    />
                    {item.label}
                </li>
            ))}
        </ul>
    );
}
