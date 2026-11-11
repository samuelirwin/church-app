import {
    Bar,
    BarChart,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ChartTable } from './chart-card';
import { ChartEmpty } from './chart-empty';
import { axisProps, BAR_MAX_SIZE, HBAR_RADIUS, VIZ } from './chart-theme';
import { ChartTooltip } from './chart-tooltip';

type DataPoint = { stage: string; count: number };

/**
 * Visitor journey stages in order. The stages are ordered, so they use one
 * hue stepping darker per stage rather than unrelated colours.
 */
export function VisitorFunnelChart({ data }: { data: DataPoint[] }) {
    if (data.length === 0 || data.every((d) => d.count === 0)) {
        return (
            <ChartEmpty message="No visitors in this period." height={180} />
        );
    }

    return (
        <ResponsiveContainer width="100%" height={180}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                barCategoryGap={12}
            >
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                    type="category"
                    dataKey="stage"
                    {...axisProps}
                    width={110}
                />
                <Tooltip
                    content={<ChartTooltip formatLabel={(label) => label} />}
                    cursor={{ fill: VIZ.grid, opacity: 0.5 }}
                />
                <Bar
                    dataKey="count"
                    name="Visitors"
                    radius={HBAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                >
                    {data.map((d, i) => (
                        <Cell
                            key={d.stage}
                            fill={VIZ.ramp[Math.min(i, VIZ.ramp.length - 1)]}
                        />
                    ))}
                    <LabelList
                        dataKey="count"
                        position="right"
                        className="fill-muted-foreground"
                        fontSize={12}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function visitorFunnelTable(data: DataPoint[]): ChartTable {
    const first = data[0]?.count ?? 0;

    return {
        columns: ['Stage', 'Visitors', '% of first stage'],
        rows: data.map((d) => [
            d.stage,
            d.count,
            first > 0 ? `${Math.round((d.count / first) * 100)}%` : '-',
        ]),
    };
}
