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

export type CategoryPoint = { label: string; value: number };

type Props = {
    data: CategoryPoint[];
    /** Series name shown in the tooltip, e.g. "Members". */
    name: string;
    /** Rows that should recede (drawn in the neutral mark colour), e.g. inactive statuses. */
    isMuted?: (point: CategoryPoint) => boolean;
    emptyMessage?: string;
    /** Width reserved for the category labels on the left. */
    labelWidth?: number;
};

const ROW_HEIGHT = 34;

/**
 * Counts per category as horizontal bars, drawn in the order given (callers sort
 * by size, or keep a natural order like pipeline stages). One colour for every
 * bar, with the value at each bar's tip so nothing depends on hovering.
 */
export function CategoryBarChart({
    data,
    name,
    isMuted,
    emptyMessage = 'Nothing to show yet.',
    labelWidth = 130,
}: Props) {
    const height = Math.max(120, data.length * ROW_HEIGHT + 8);

    if (data.length === 0 || data.every((point) => point.value === 0)) {
        return <ChartEmpty message={emptyMessage} height={height} />;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
            >
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                    type="category"
                    dataKey="label"
                    {...axisProps}
                    width={labelWidth}
                />
                <Tooltip
                    content={<ChartTooltip formatLabel={(label) => label} />}
                    cursor={{ fill: VIZ.grid, opacity: 0.5 }}
                />
                <Bar
                    dataKey="value"
                    name={name}
                    radius={HBAR_RADIUS}
                    maxBarSize={BAR_MAX_SIZE}
                    isAnimationActive={false}
                >
                    {data.map((point) => (
                        <Cell
                            key={point.label}
                            fill={
                                isMuted?.(point) ? VIZ.mutedMark : VIZ.series[0]
                            }
                        />
                    ))}
                    <LabelList
                        dataKey="value"
                        position="right"
                        className="fill-muted-foreground"
                        fontSize={12}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function categoryTable(
    data: CategoryPoint[],
    labelHeading: string,
    valueHeading: string,
): ChartTable {
    return {
        columns: [labelHeading, valueHeading],
        rows: data.map((point) => [point.label, point.value]),
    };
}
