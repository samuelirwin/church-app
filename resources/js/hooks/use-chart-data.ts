import { useEffect, useState } from 'react';

/**
 * Fetches a chart's JSON ({ data: [...] }).
 *
 * - `data` is null only until the very first response, so the card can show a skeleton.
 * - When the query changes, the previous data is kept and `refreshing` is true,
 *   so the chart fades instead of flashing a skeleton or jumping.
 * - Responses for an older query are ignored.
 */
export function useChartData<T>(
    url: string,
    query: string,
    enabled = true,
): { data: T | null; refreshing: boolean } {
    const requestKey = query ? `${url}?${query}` : url;
    const [result, setResult] = useState<{ key: string; data: T } | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const controller = new AbortController();

        fetch(requestKey, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((json) => setResult({ key: requestKey, data: json.data }))
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error(
                        `Failed to load chart data from ${requestKey}`,
                        error,
                    );
                }
            });

        return () => controller.abort();
    }, [requestKey, enabled]);

    return {
        data: result?.data ?? null,
        refreshing: result !== null && result.key !== requestKey,
    };
}
