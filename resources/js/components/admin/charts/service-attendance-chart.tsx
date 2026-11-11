import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export type ServiceAttendancePoint = {
    date: string;
    members: number;
    guests: number;
    total: number;
};
type Props = { data: ServiceAttendancePoint[]; height?: number };

export function ServiceAttendanceChart({ data, height = 300 }: Props) {
    if (data.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                No service attendance recorded yet.
            </p>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                    dataKey="members"
                    stackId="attendance"
                    fill="#3b82f6"
                    name="Members"
                />
                <Bar
                    dataKey="guests"
                    stackId="attendance"
                    fill="#93c5fd"
                    name="Guests"
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
