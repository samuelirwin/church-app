import { router } from '@inertiajs/react';
import { BookOpen, CalendarDays, Contact, FileText, GraduationCap, LayoutDashboard, Mic2, Newspaper, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

type SearchResult = {
    id: number;
    title: string;
    url: string;
};

type SearchResults = Record<string, SearchResult[]>;

const groupIcons: Record<string, React.ElementType> = {
    sermons: Mic2,
    events: CalendarDays,
    documents: FileText,
    courses: GraduationCap,
    books: BookOpen,
    posts: Newspaper,
    pages: LayoutDashboard,
    members: Contact,
    users: User,
};

const groupLabels: Record<string, string> = {
    sermons: 'Sermons',
    events: 'Events',
    documents: 'Documents',
    courses: 'Courses',
    books: 'Books',
    posts: 'Updates',
    pages: 'Pages',
    members: 'Members',
    users: 'Users',
};

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({});
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const search = useCallback((value: string) => {
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (value.length < 2) {
            setResults({});
            setLoading(false);
            return;
        }

        setLoading(true);

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/search?q=${encodeURIComponent(value)}`, {
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const data: SearchResults = await res.json();
                    setResults(data);
                }
            } catch {
                // Silently handle network errors
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    function handleSelect(url: string) {
        setOpen(false);
        setQuery('');
        setResults({});
        router.visit(url);
    }

    function handleOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) {
            setQuery('');
            setResults({});
        }
    }

    const hasResults = Object.keys(results).length > 0;

    return (
        <CommandDialog open={open} onOpenChange={handleOpenChange}>
            <CommandInput
                placeholder="Search sermons, events, courses, and more..."
                value={query}
                onValueChange={search}
            />
            <CommandList>
                {!loading && query.length >= 2 && !hasResults && (
                    <CommandEmpty>No results found.</CommandEmpty>
                )}
                {loading && query.length >= 2 && !hasResults && (
                    <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
                )}
                {Object.entries(results).map(([group, items]) => {
                    const Icon = groupIcons[group] ?? FileText;
                    const label = groupLabels[group] ?? group;
                    return (
                        <CommandGroup key={group} heading={label}>
                            {items.map((item) => (
                                <CommandItem
                                    key={`${group}-${item.id}`}
                                    value={`${group}-${item.title}`}
                                    onSelect={() => handleSelect(item.url)}
                                >
                                    <Icon className="mr-2 size-4 text-muted-foreground" />
                                    <span>{item.title}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    );
                })}
            </CommandList>
        </CommandDialog>
    );
}
