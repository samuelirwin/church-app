import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type DataPoint = { title: string; enrolled: number; completed: number };
type Props = { data: DataPoint[] };

export function CourseCompletionChart({ data }: Props) {
    if (data.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">No course data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="enrolled" fill="#3b82f6" name="Enrolled" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
            </BarChart>
        </ResponsiveContainer>
    );
}
