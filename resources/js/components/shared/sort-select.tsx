import { ArrowDownUp } from 'lucide-react';
import type { SortDirection } from '@/components/shared/data-table/data-table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type SortOption = {
    /** Server sort key (must be in the controller's SORTABLE list). */
    sort: string;
    direction: SortDirection;
    label: string;
};

type Props = {
    options: SortOption[];
    sort?: string | null;
    direction?: SortDirection | null;
    /** Option shown when the URL has no sort (the server's default order). */
    defaultLabel: string;
    onChange: (
        sort: string | undefined,
        direction: SortDirection | undefined,
    ) => void;
};

const DEFAULT = 'default';

/**
 * "Sort by" dropdown for lists that aren't tables (e.g. split views).
 * Uses the same sort/direction query params as DataTable, so the server side is shared.
 */
export function SortSelect({
    options,
    sort,
    direction,
    defaultLabel,
    onChange,
}: Props) {
    const value = sort ? `${sort}:${direction ?? 'asc'}` : DEFAULT;

    return (
        <Select
            value={value}
            onValueChange={(next) => {
                if (next === DEFAULT) {
                    onChange(undefined, undefined);
                    return;
                }
                const [nextSort, nextDirection] = next.split(':') as [
                    string,
                    SortDirection,
                ];
                onChange(nextSort, nextDirection);
            }}
        >
            <SelectTrigger className="h-9 w-auto gap-2" aria-label="Sort by">
                <ArrowDownUp className="size-4 text-muted-foreground" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={DEFAULT}>{defaultLabel}</SelectItem>
                {options.map((option) => (
                    <SelectItem
                        key={`${option.sort}:${option.direction}`}
                        value={`${option.sort}:${option.direction}`}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
