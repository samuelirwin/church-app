import type { ChartTable } from './chart-card';
import { TrendAreaChart, trendTable } from './trend-area-chart';

type DataPoint = { month: string; count: number };

export function MembershipGrowthChart({ data }: { data: DataPoint[] }) {
    return (
        <TrendAreaChart
            data={data.map((d) => ({ label: d.month, value: d.count }))}
            name="New members"
            emptyMessage="No new members in this period."
        />
    );
}

export function membershipGrowthTable(data: DataPoint[]): ChartTable {
    return trendTable(
        data.map((d) => ({ label: d.month, value: d.count })),
        'New members',
    );
}
