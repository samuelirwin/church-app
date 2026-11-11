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
    formatCurrency,
    gridProps,
    VIZ,
} from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

type DataPoint = {
    status: string;
    count: number;
    total_requested: number;
    total_approved: number;
};

const statusLabel = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Amount requested vs approved for each request status. Statuses aren't a
 * sequence, so these are grouped columns rather than a line or area.
 */
export function BenevolenceOverviewChart({ data }: { data: DataPoint[] }) {
    if (data.length === 0) {
        return <ChartEmpty message="No benevolence requests in this period." />;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                barGap={2}
            >
                <CartesianGrid {...gridProps} />
                <XAxis
                    dataKey="status"
                    {...axisProps}
                    tickFormatter={statusLabel}
                    interval={0}
                    tick={{ ...axisProps.tick, fontSize: 11 }}
                />
                <YAxis
                    {...axisProps}
                    tickFormatter={(v: number) => `$${formatCompact(v)}`}
                    width={56}
                />
                <Tooltip
                    content={
                        <ChartTooltip
                            formatValue={formatCurrency}
                            formatLabel={statusLabel}
                        />
                    }
                    cursor={{ fill: VIZ.grid, opacity: 0.5 }}
                />
                <Bar
                    dataKey="total_requested"
                    name="Requested"
                    fill={VIZ.series[0]}
                    radius={BAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                />
                <Bar
                    dataKey="total_approved"
                    name="Approved"
                    fill={VIZ.series[1]}
                    radius={BAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

export const benevolenceLegend = (
    <ChartLegend
        items={[
            { label: 'Requested', color: VIZ.series[0] },
            { label: 'Approved', color: VIZ.series[1] },
        ]}
    />
);

export function benevolenceTable(data: DataPoint[]): ChartTable {
    return {
        columns: ['Status', 'Requests', 'Requested', 'Approved'],
        rows: data.map((d) => [
            statusLabel(d.status),
            d.count,
            formatCurrency(d.total_requested),
            formatCurrency(d.total_approved),
        ]),
    };
}
