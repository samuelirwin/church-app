import { ListFilter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

type Option = { value: string; label: string };

type Props = {
    title: string;
    options: Option[];
    selected: string[];
    onChange: (values: string[]) => void;
};

/**
 * Filter chip: a button that opens a checklist. Shows how many values are
 * picked (or their names when only one or two), with a clear button.
 */
export function FacetedFilter({ title, options, selected, onChange }: Props) {
    const toggle = (value: string) =>
        onChange(
            selected.includes(value)
                ? selected.filter((v) => v !== value)
                : [...selected, value],
        );
    const selectedLabels = options
        .filter((o) => selected.includes(o.value))
        .map((o) => o.label);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-dashed"
                >
                    <ListFilter className="mr-1.5 size-4" />
                    {title}
                    {selected.length > 0 && (
                        <>
                            <span
                                className="mx-1.5 h-4 w-px bg-border"
                                aria-hidden
                            />
                            {selected.length > 2 ? (
                                <Badge
                                    variant="secondary"
                                    className="rounded-sm px-1.5 font-normal"
                                >
                                    {selected.length} selected
                                </Badge>
                            ) : (
                                selectedLabels.map((label) => (
                                    <Badge
                                        key={label}
                                        variant="secondary"
                                        className="mr-1 rounded-sm px-1.5 font-normal last:mr-0"
                                    >
                                        {label}
                                    </Badge>
                                ))
                            )}
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1">
                <ul
                    role="group"
                    aria-label={title}
                    className="max-h-72 overflow-y-auto"
                >
                    {options.map((option) => (
                        <li key={option.value}>
                            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                                <Checkbox
                                    checked={selected.includes(option.value)}
                                    onCheckedChange={() => toggle(option.value)}
                                />
                                {option.label}
                            </label>
                        </li>
                    ))}
                </ul>
                {selected.length > 0 && (
                    <button
                        type="button"
                        onClick={() => onChange([])}
                        className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border-t px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-3.5" />
                        Clear filter
                    </button>
                )}
            </PopoverContent>
        </Popover>
    );
}
