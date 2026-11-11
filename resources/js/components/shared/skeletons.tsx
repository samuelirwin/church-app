import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder shown while a chart's data is loading.
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div
            className="flex flex-col justify-end gap-3"
            style={{ height }}
            aria-busy="true"
            aria-label="Loading chart"
        >
            <div className="flex h-full items-end gap-2">
                {[40, 65, 50, 80, 55, 70, 45, 60].map((h, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1"
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
            <Skeleton className="h-3 w-full" />
        </div>
    );
}

/**
 * Placeholder for a detail panel while the selected record loads.
 */
export function DetailSkeleton() {
    return (
        <div
            className="space-y-6 p-6"
            aria-busy="true"
            aria-label="Loading details"
        >
            <div className="space-y-2">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>
        </div>
    );
}
