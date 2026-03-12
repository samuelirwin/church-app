import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type DataPoint = { month: string; count: number };
type Props = { data: DataPoint[] };

export function MembershipGrowthChart({ data }: Props) {
    if (data.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">No membership data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="New Members" />
            </LineChart>
        </ResponsiveContainer>
    );
}
