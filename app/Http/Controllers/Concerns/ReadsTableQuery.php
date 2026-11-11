<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

/**
 * Reads the query-string conventions the admin data tables send:
 * multi-value filters (?status[]=a&status[]=b) and a whitelisted sort.
 */
trait ReadsTableQuery
{
    /**
     * A filter that may be sent once (?status=member) or several times (?status[]=member&status[]=regular).
     *
     * @return list<string>
     */
    protected function listInput(Request $request, string $key): array
    {
        return array_values(array_filter(array_map('strval', (array) $request->input($key, []))));
    }

    /**
     * The requested sort column, if it's one of the allowed keys, and its direction.
     * Anything else in the URL is ignored, so user input never reaches orderBy() directly.
     *
     * @param  array<string, mixed>  $sortable  Allowed sort keys (the values are up to the caller)
     * @return array{0: string|null, 1: 'asc'|'desc'}
     */
    protected function sortInput(Request $request, array $sortable, string $defaultDirection = 'asc'): array
    {
        $sort = (string) $request->input('sort');
        $requested = $request->input('direction');
        $direction = in_array($requested, ['asc', 'desc'], true) ? $requested : $defaultDirection;

        return [array_key_exists($sort, $sortable) ? $sort : null, $direction];
    }
}
