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
    gridProps,
    VIZ,
} from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

type DataPoint = { title: string; enrolled: number; completed: number };

export function CourseCompletionChart({ data }: { data: DataPoint[] }) {
    if (data.length === 0) {
        return <ChartEmpty message="No course enrollments in this period." />;
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
                    dataKey="title"
                    {...axisProps}
                    interval={0}
                    tick={{ ...axisProps.tick, fontSize: 11 }}
                    tickFormatter={(t: string) =>
                        t.length > 14 ? `${t.slice(0, 13)}…` : t
                    }
                />
                <YAxis
                    {...axisProps}
                    allowDecimals={false}
                    tickFormatter={formatCompact}
                    width={48}
                />
                <Tooltip
                    content={<ChartTooltip formatLabel={(label) => label} />}
                    cursor={{ fill: VIZ.grid, opacity: 0.5 }}
                />
                <Bar
                    dataKey="enrolled"
                    name="Enrolled"
                    fill={VIZ.series[0]}
                    radius={BAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                />
                <Bar
                    dataKey="completed"
                    name="Completed"
                    fill={VIZ.series[1]}
                    radius={BAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

export const courseCompletionLegend = (
    <ChartLegend
        items={[
            { label: 'Enrolled', color: VIZ.series[0] },
            { label: 'Completed', color: VIZ.series[1] },
        ]}
    />
);

export function courseCompletionTable(data: DataPoint[]): ChartTable {
    return {
        columns: ['Course', 'Enrolled', 'Completed', 'Completion rate'],
        rows: data.map((d) => [
            d.title,
            d.enrolled,
            d.completed,
            d.enrolled > 0
                ? `${Math.round((d.completed / d.enrolled) * 100)}%`
                : '-',
        ]),
    };
}
