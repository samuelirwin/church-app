import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Props = {
    /** The current route path to navigate to when filtering */
    routePath: string;
    /** Current filter values from the server */
    filters: Record<string, string | undefined>;
    /** Placeholder text for the search input */
    placeholder?: string;
    /** Which filter key corresponds to the search term */
    searchKey?: string;
};

export function SearchFilter({
    routePath,
    filters,
    placeholder = 'Search...',
    searchKey = 'search',
}: Props) {
    const [search, setSearch] = useState(filters[searchKey] ?? '');

    const handleSearch = useCallback(
        (value: string) => {
            setSearch(value);
            router.get(
                routePath,
                { ...filters, [searchKey]: value || undefined },
                { preserveState: true, replace: true },
            );
        },
        [routePath, filters, searchKey],
    );

    const clearSearch = () => {
        handleSearch('');
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-9"
            />
            {search && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0"
                    onClick={clearSearch}
                >
                    <X className="size-3.5" />
                </Button>
            )}
        </div>
    );
}
