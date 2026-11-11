/**
 * Shared chart styling so every chart reads as one system. Colours point at the
 * validated --viz-* tokens in app.css (they switch automatically in dark mode).
 *
 * Rules baked in here: solid hairline grid with no vertical lines, quiet axes
 * with no tick marks, bars capped at 24px with 4px rounded ends, 2px lines.
 */
export const VIZ = {
    /** Categorical slots: always assign in this order, never by rank. */
    series: ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)'],
    /** One-hue ordinal ramp for ordered stages (lightest first in light mode). */
    ramp: ['var(--viz-ramp-1)', 'var(--viz-ramp-2)', 'var(--viz-ramp-3)'],
    grid: 'var(--viz-grid)',
    axis: 'var(--viz-axis)',
    /** Neutral context marks (e.g. capacity behind registrations). */
    mutedMark: 'var(--viz-muted-mark)',
    good: 'var(--viz-good)',
    critical: 'var(--viz-critical)',
} as const;

export const gridProps = {
    stroke: VIZ.grid,
    vertical: false,
} as const;

export const axisProps = {
    tick: { fontSize: 12, fill: VIZ.axis },
    axisLine: false,
    tickLine: false,
} as const;

export const BAR_MAX_SIZE = 24;

/** Rounded data end, square at the baseline. */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

/** Same for horizontal bars, whose data end is on the right. */
export const HBAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

const compactFormatter = new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
});
const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

/** 1,284 -> "1.3K"; used for axis ticks and stat tiles. */
export const formatCompact = (value: number) => compactFormatter.format(value);

export const formatCurrency = (value: number) =>
    currencyFormatter.format(value);

/** "2026-11-08" -> "Nov 8"; month keys like "2026-11" -> "Nov 2026". */
export function formatDateLabel(value: string): string {
    if (/^\d{4}-\d{2}$/.test(value)) {
        return new Date(`${value}-01T00:00:00`).toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric',
        });
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        });
    }

    return value;
}
