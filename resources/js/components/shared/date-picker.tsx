import { format, isValid, parse } from 'date-fns';
import { CalendarDays, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Props = {
    id?: string;
    /** Date as "YYYY-MM-DD" (or empty), the same format a native date input uses, so forms and validation are unchanged. */
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Earliest / latest selectable date, as "YYYY-MM-DD". */
    min?: string;
    max?: string;
    /** Show month/year dropdowns, for dates far from today such as birthdays. */
    withYearDropdown?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    className?: string;
    'aria-invalid'?: boolean;
};

const toDate = (value: string | undefined): Date | undefined => {
    if (!value) {
        return undefined;
    }
    const parsed = parse(value.slice(0, 10), 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? parsed : undefined;
};

/**
 * Button that opens a calendar popover. Works with the keyboard (arrows move
 * between days, Enter picks, Esc closes) and can be cleared.
 */
export function DatePicker({
    id,
    value,
    onChange,
    placeholder = 'Pick a date',
    min,
    max,
    withYearDropdown = false,
    clearable = true,
    disabled = false,
    className,
    'aria-invalid': ariaInvalid,
}: Props) {
    const [open, setOpen] = useState(false);
    const selected = toDate(value);
    const minDate = toDate(min);
    const maxDate = toDate(max);

    const disabledDays = [
        ...(minDate ? [{ before: minDate }] : []),
        ...(maxDate ? [{ after: maxDate }] : []),
    ];

    return (
        <div className={cn('relative', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        aria-invalid={ariaInvalid}
                        className={cn(
                            'w-full justify-start gap-2 px-3 font-normal',
                            !selected && 'text-muted-foreground',
                            clearable && selected && 'pr-9',
                        )}
                    >
                        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                        {selected
                            ? format(selected, 'MMM d, yyyy')
                            : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                    <Calendar
                        mode="single"
                        selected={selected}
                        defaultMonth={selected ?? maxDate ?? undefined}
                        onSelect={(date) => {
                            onChange(date ? format(date, 'yyyy-MM-dd') : '');
                            setOpen(false);
                        }}
                        disabled={
                            disabledDays.length ? disabledDays : undefined
                        }
                        captionLayout={withYearDropdown ? 'dropdown' : 'label'}
                        startMonth={
                            withYearDropdown
                                ? (minDate ?? new Date(1920, 0))
                                : minDate
                        }
                        endMonth={
                            withYearDropdown
                                ? (maxDate ??
                                  new Date(new Date().getFullYear() + 5, 11))
                                : maxDate
                        }
                        autoFocus
                    />
                </PopoverContent>
            </Popover>
            {clearable && selected && !disabled && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear date"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    );
}
