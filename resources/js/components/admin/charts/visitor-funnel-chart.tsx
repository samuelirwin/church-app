import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type DataPoint = { stage: string; count: number };
type Props = { data: DataPoint[] };

export function VisitorFunnelChart({ data }: Props) {
    if (data.length === 0 || data.every((d) => d.count === 0)) {
        return <p className="py-8 text-center text-sm text-muted-foreground">No visitor data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Count" />
            </BarChart>
        </ResponsiveContainer>
    );
}
