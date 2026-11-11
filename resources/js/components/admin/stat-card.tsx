import { Card, CardContent } from '@/components/ui/card';

type Props = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    variant?: 'default' | 'destructive';
};

export function StatCard({
    icon: Icon,
    label,
    value,
    variant = 'default',
}: Props) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'}`}
                >
                    <Icon
                        className={`size-4 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`}
                    />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
