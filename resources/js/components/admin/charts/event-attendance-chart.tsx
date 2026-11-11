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

type DataPoint = {
    title: string;
    date: string;
    registrations: number;
    capacity: number | null;
};

/**
 * Registrations per event, with capacity as a neutral context bar beside it.
 */
export function EventAttendanceChart({ data }: { data: DataPoint[] }) {
    if (data.length === 0) {
        return <ChartEmpty message="No events in this period." />;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
                barGap={2}
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
                    content={
                        <ChartTooltip
                            formatLabel={(_, row) =>
                                (row as DataPoint | undefined)?.title ?? ''
                            }
                        />
                    }
                    cursor={{ fill: VIZ.grid, opacity: 0.5 }}
                />
                <Bar
                    dataKey="registrations"
                    name="Registrations"
                    fill={VIZ.series[0]}
                    radius={BAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                />
                <Bar
                    dataKey="capacity"
                    name="Capacity"
                    fill={VIZ.mutedMark}
                    radius={BAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

export const eventAttendanceLegend = (
    <ChartLegend
        items={[
            { label: 'Registrations', color: VIZ.series[0] },
            { label: 'Capacity', color: VIZ.mutedMark },
        ]}
    />
);

export function eventAttendanceTable(data: DataPoint[]): ChartTable {
    return {
        columns: ['Event', 'Date', 'Registrations', 'Capacity'],
        rows: data.map((d) => [
            d.title,
            formatDateLabel(d.date),
            d.registrations,
            d.capacity ?? '-',
        ]),
    };
}
