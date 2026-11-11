import { useId } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ChartTable } from './chart-card';
import { ChartEmpty } from './chart-empty';
import {
    axisProps,
    formatCompact,
    formatDateLabel,
    gridProps,
    VIZ,
} from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

/** A null value means "nothing recorded" and is drawn as a gap, not as zero. */
export type TrendPoint = { label: string; value: number | null };

type Props = {
    data: TrendPoint[];
    /** Series name shown in the tooltip, e.g. "Attendance". */
    name: string;
    height?: number;
    emptyMessage?: string;
};

/**
 * Single-series trend over time: a 2px line over a light wash of the same hue.
 * Hovering anywhere snaps a crosshair to the nearest point.
 */
export function TrendAreaChart({
    data,
    name,
    height = 300,
    emptyMessage = 'No data for this period.',
}: Props) {
    const gradientId = useId();

    if (data.every((point) => point.value === null)) {
        return <ChartEmpty message={emptyMessage} height={height} />;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor={VIZ.series[0]}
                            stopOpacity={0.18}
                        />
                        <stop
                            offset="100%"
                            stopColor={VIZ.series[0]}
                            stopOpacity={0.02}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis
                    dataKey="label"
                    {...axisProps}
                    tickFormatter={formatDateLabel}
                    minTickGap={24}
                />
                <YAxis
                    {...axisProps}
                    allowDecimals={false}
                    tickFormatter={formatCompact}
                    width={48}
                />
                <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: VIZ.axis, strokeWidth: 1 }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    name={name}
                    stroke={VIZ.series[0]}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={{
                        r: 4,
                        strokeWidth: 2,
                        stroke: 'var(--card)',
                        fill: VIZ.series[0],
                    }}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function trendTable(
    data: TrendPoint[],
    valueHeading: string,
): ChartTable {
    return {
        columns: ['Period', valueHeading],
        rows: data.map((point) => [
            formatDateLabel(point.label),
            point.value ?? '-',
        ]),
    };
}
