import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ChartTable } from './chart-card';
import { ChartEmpty } from './chart-empty';
import {
    axisProps,
    BAR_MAX_SIZE,
    gridProps,
    HBAR_RADIUS,
    VIZ,
} from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

type DataPoint = { name: string; members: number };

const ROW_HEIGHT = 36;

/**
 * Members per ministry as sorted horizontal bars (easier to compare than a pie),
 * one colour for every bar, with the value at each bar's tip.
 */
export function MinistryDistributionChart({ data }: { data: DataPoint[] }) {
    if (data.length === 0) {
        return <ChartEmpty message="No ministries yet." />;
    }

    const sorted = [...data].sort((a, b) => b.members - a.members);
    const height = Math.max(160, sorted.length * ROW_HEIGHT + 16);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={sorted}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
            >
                <CartesianGrid {...gridProps} horizontal={false} vertical />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                    type="category"
                    dataKey="name"
                    {...axisProps}
                    width={130}
                />
                <Tooltip
                    content={<ChartTooltip formatLabel={(label) => label} />}
                    cursor={{ fill: VIZ.grid, opacity: 0.5 }}
                />
                <Bar
                    dataKey="members"
                    name="Members"
                    fill={VIZ.series[0]}
                    radius={HBAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                >
                    <LabelList
                        dataKey="members"
                        position="right"
                        className="fill-muted-foreground"
                        fontSize={12}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function ministryDistributionTable(data: DataPoint[]): ChartTable {
    return {
        columns: ['Ministry', 'Members'],
        rows: [...data]
            .sort((a, b) => b.members - a.members)
            .map((d) => [d.name, d.members]),
    };
}
