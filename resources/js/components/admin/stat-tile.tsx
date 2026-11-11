import { Link } from '@inertiajs/react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { formatCompact, VIZ } from '@/components/admin/charts/chart-theme';
import { cn } from '@/lib/utils';

/** One headline number as sent by DashboardMetricsService. */
export type Metric = {
    key: string;
    label: string;
    value: number;
    previous: number | null;
    /** Percent change vs the previous period, or null when there's nothing to compare with. */
    change: number | null;
    /** Which direction is good news for this number. */
    good: 'up' | 'down' | 'neutral';
    /** e.g. "vs previous 30 days" */
    comparison: string;
    /** Trend buckets; null means nothing was recorded in that bucket. */
    spark: Array<number | null>;
    href?: string | null;
};

type Props = { metric: Metric };

/**
 * Stat tile: label, big value, change vs the previous period, and a sparkline.
 * The change badge always pairs its colour with an arrow, so it never relies on colour alone.
 */
export function StatTile({ metric }: Props) {
    const body = (
        <div className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tracking-tight">
                    {formatCompact(metric.value)}
                </p>
                <Sparkline
                    values={metric.spark}
                    label={`${metric.label} trend`}
                />
            </div>
            <DeltaBadge
                change={metric.change}
                good={metric.good}
                comparison={metric.comparison}
            />
        </div>
    );

    return metric.href ? (
        <Link
            href={metric.href}
            className="block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            {body}
        </Link>
    ) : (
        body
    );
}

function DeltaBadge({
    change,
    good,
    comparison,
}: Pick<Metric, 'change' | 'good' | 'comparison'>) {
    if (change === null) {
        return (
            <p className="text-xs text-muted-foreground">
                No earlier data to compare
            </p>
        );
    }

    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    const isGood =
        direction !== 'flat' && good !== 'neutral' && direction === good;
    const isBad =
        direction !== 'flat' && good !== 'neutral' && direction !== good;
    const Icon =
        direction === 'up'
            ? ArrowUpRight
            : direction === 'down'
              ? ArrowDownRight
              : ArrowRight;
    const sign = change > 0 ? '+' : '';

    return (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
                className={cn(
                    'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium',
                    isGood &&
                        'bg-[color-mix(in_oklab,var(--viz-good)_12%,transparent)] text-[var(--viz-good)]',
                    isBad &&
                        'bg-[color-mix(in_oklab,var(--viz-critical)_12%,transparent)] text-[var(--viz-critical)]',
                    !isGood && !isBad && 'bg-muted text-foreground',
                )}
            >
                <Icon className="size-3.5" aria-hidden />
                <span>
                    {sign}
                    {change}%
                </span>
            </span>
            {comparison}
        </p>
    );
}

/**
 * Tiny trend line in a muted tone with the latest point marked in the accent colour.
 * Decorative: the value and change badge carry the actual numbers.
 */
function Sparkline({
    values,
    label,
}: {
    values: Array<number | null>;
    label: string;
}) {
    const recorded = values.filter((v): v is number => v !== null);

    if (recorded.length < 2) {
        return null;
    }

    const width = 96;
    const height = 32;
    const pad = 4;
    const max = Math.max(...recorded);
    const min = Math.min(...recorded);
    const range = max - min || 1;

    const points = values.map((v, i) =>
        v === null
            ? null
            : {
                  x: pad + (i / (values.length - 1)) * (width - pad * 2),
                  y: pad + (1 - (v - min) / range) * (height - pad * 2),
              },
    );

    // Start a new segment after every gap, so missing buckets aren't bridged.
    const path = points
        .map((p, i) =>
            p === null
                ? ''
                : `${i === 0 || points[i - 1] === null ? 'M' : 'L'}${p.x},${p.y}`,
        )
        .join(' ');
    const last = [...points].reverse().find((p) => p !== null)!;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={label}
            className="shrink-0 overflow-visible"
        >
            <path
                d={path}
                fill="none"
                stroke={VIZ.axis}
                strokeOpacity={0.6}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx={last.x}
                cy={last.y}
                r={4}
                fill={VIZ.series[0]}
                stroke="var(--card)"
                strokeWidth={2}
            />
        </svg>
    );
}
