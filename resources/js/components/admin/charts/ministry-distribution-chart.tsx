import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type DataPoint = { name: string; members: number };
type Props = { data: DataPoint[] };

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export function MinistryDistributionChart({ data }: Props) {
    if (data.length === 0) {
        return <p className="py-8 text-center text-sm text-muted-foreground">No ministry data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="members"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    );
}
