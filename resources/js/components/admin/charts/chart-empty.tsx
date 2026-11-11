export function ChartEmpty({
    message,
    height = 300,
}: {
    message: string;
    height?: number;
}) {
    return (
        <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
        >
            {message}
        </div>
    );
}
