import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ChartTable } from './chart-card';
import { ChartEmpty } from './chart-empty';
import { ChartLegend } from './chart-legend';
import {
    axisProps,
    BAR_MAX_SIZE,
    BAR_RADIUS,
    formatCompact,
    formatDateLabel,
    gridProps,
    VIZ,
} from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

export type ServiceAttendancePoint = {
    date: string;
    members: number;
    guests: number;
    total: number;
};

/**
 * Members and guests stacked per service date. A 2px stroke in the card colour
 * acts as the gap between the two segments.
 */
export function ServiceAttendanceChart({
    data,
    height = 300,
}: {
    data: ServiceAttendancePoint[];
    height?: number;
}) {
    if (data.length === 0) {
        return (
            <ChartEmpty
                message="No service attendance recorded yet."
                height={height}
            />
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            >
                <CartesianGrid {...gridProps} />
                <XAxis
                    dataKey="date"
                    {...axisProps}
                    tickFormatter={formatDateLabel}
                    minTickGap={16}
                />
                <YAxis
                    {...axisProps}
                    allowDecimals={false}
                    tickFormatter={formatCompact}
                    width={48}
                />
                <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: VIZ.grid, opacity: 0.5 }}
                />
                <Bar
                    dataKey="members"
                    name="Members"
                    stackId="attendance"
                    fill={VIZ.series[0]}
                    stroke="var(--card)"
                    strokeWidth={2}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                />
                <Bar
                    dataKey="guests"
                    name="Guests"
                    stackId="attendance"
                    fill={VIZ.series[1]}
                    stroke="var(--card)"
                    strokeWidth={2}
                    radius={BAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

export const serviceAttendanceLegend = (
    <ChartLegend
        items={[
            { label: 'Members', color: VIZ.series[0] },
            { label: 'Guests', color: VIZ.series[1] },
        ]}
    />
);

export function serviceAttendanceTable(
    data: ServiceAttendancePoint[],
): ChartTable {
    return {
        columns: ['Date', 'Members', 'Guests', 'Total'],
        rows: data.map((d) => [
            formatDateLabel(d.date),
            d.members,
            d.guests,
            d.total,
        ]),
    };
}
