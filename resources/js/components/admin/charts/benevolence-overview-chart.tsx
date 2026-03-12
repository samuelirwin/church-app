import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type DataPoint = { status: string; count: number; total_requested: number; total_approved: number };
type Props = { data: DataPoint[] };

export function BenevolenceOverviewChart({ data }: Props) {
    if (data.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">No benevolence data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Area type="monotone" dataKey="total_requested" fill="#fbbf24" stroke="#f59e0b" fillOpacity={0.3} name="Requested" />
                <Area type="monotone" dataKey="total_approved" fill="#34d399" stroke="#10b981" fillOpacity={0.3} name="Approved" />
            </AreaChart>
        </ResponsiveContainer>
    );
}
