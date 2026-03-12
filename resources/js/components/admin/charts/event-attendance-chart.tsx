import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type DataPoint = { title: string; date: string; registrations: number; capacity: number | null };
type Props = { data: DataPoint[] };

export function EventAttendanceChart({ data }: Props) {
    if (data.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">No event data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ''}
                />
                <Bar dataKey="registrations" fill="#10b981" name="Registrations" />
                <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" />
            </BarChart>
        </ResponsiveContainer>
    );
}
