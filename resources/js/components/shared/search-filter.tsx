import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-9 pl-9"
            />
            {search && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1/2 right-1 size-7 -translate-y-1/2 p-0"
                    onClick={clearSearch}
                >
                    <X className="size-3.5" />
                </Button>
            )}
        </div>
    );
}
