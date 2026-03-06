import { Check, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MediaItem, MediaPaginatedResponse } from '@/types/media';

type MediaBrowserProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (items: MediaItem[]) => void;
    mimeFilter?: string;
    multiple?: boolean;
};

export function MediaBrowser({
    open,
    onOpenChange,
    onSelect,
    mimeFilter = 'image/',
    multiple = false,
}: MediaBrowserProps) {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [selected, setSelected] = useState<Map<number, MediaItem>>(new Map());
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const fetchMedia = useCallback(
        async (pageNum: number, searchTerm: string, append = false) => {
            setLoading(true);

            const params = new URLSearchParams({
                page: String(pageNum),
            });
            if (searchTerm) {
                params.set('search', searchTerm);
            }
            if (mimeFilter) {
                params.set('mime_filter', mimeFilter);
            }

            try {
                const response = await fetch(`/admin/media-library?${params}`, {
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    return;
                }

                const data: MediaPaginatedResponse = await response.json();

                setItems((prev) => (append ? [...prev, ...data.data] : data.data));
                setPage(data.current_page);
                setLastPage(data.last_page);
                setTotal(data.total);
            } finally {
                setLoading(false);
            }
        },
        [mimeFilter],
    );

    // Fetch on open
    useEffect(() => {
        if (open) {
            setSelected(new Map());
            setSearch('');
            setItems([]);
            fetchMedia(1, '');
        }
    }, [open, fetchMedia]);

    // Debounced search
    const handleSearchChange = (value: string) => {
        setSearch(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            setItems([]);
            fetchMedia(1, value);
        }, 300);
    };

    const handleLoadMore = () => {
        if (page < lastPage) {
            fetchMedia(page + 1, search, true);
        }
    };

    const toggleSelect = (item: MediaItem) => {
        setSelected((prev) => {
            const next = new Map(prev);

            if (next.has(item.id)) {
                next.delete(item.id);
            } else {
                if (!multiple) {
                    next.clear();
                }
                next.set(item.id, item);
            }

            return next;
        });
    };

    const handleConfirm = () => {
        onSelect(Array.from(selected.values()));
        onOpenChange(false);
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Media Library</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {loading && items.length === 0 ? (
                        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-lg" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                            No media found.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                {items.map((item) => {
                                    const isSelected = selected.has(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleSelect(item)}
                                            className={cn(
                                                'group relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                                                isSelected
                                                    ? 'border-primary ring-2 ring-primary/30'
                                                    : 'border-transparent hover:border-muted-foreground/30',
                                            )}
                                            title={`${item.file_name} (${formatSize(item.size)})`}
                                        >
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                                    <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                        <Check className="size-4" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {page < lastPage && (
                                <div className="mt-4 flex justify-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                    >
                                        {loading ? 'Loading...' : `Load More (${items.length} of ${total})`}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleConfirm} disabled={selected.size === 0}>
                        Select{selected.size > 0 ? ` (${selected.size})` : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
