import { useEffect, useState } from 'react';

/**
 * Fetches a chart's JSON ({ data: [...] }) and returns null while loading,
 * so the page can show a skeleton instead of a misleading "no data" message.
 *
 * Each response is stored with the request it answers. When the query changes
 * the stored result no longer matches, so the hook reports "loading" again
 * until the new response arrives, and late responses for old queries are ignored.
 */
export function useChartData<T>(
    url: string,
    query: string,
    enabled = true,
): T | null {
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

    return result?.key === requestKey ? result.data : null;
}
