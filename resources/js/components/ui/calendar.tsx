import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * DayPicker styled with the app's Tailwind tokens.
 */
function Calendar({
    className,
    classNames,
    ...props
}: React.ComponentProps<typeof DayPicker>) {
    return (
        <DayPicker
            className={cn('text-sm', className)}
            classNames={{
                months: 'relative flex flex-col gap-4',
                month: 'flex flex-col gap-3',
                month_caption: 'flex h-8 items-center justify-center px-8',
                caption_label: 'flex items-center gap-1 font-medium',
                dropdowns: 'flex items-center gap-1.5',
                dropdown_root:
                    'relative rounded-md border px-2 py-1 hover:bg-muted has-focus:ring-2 has-focus:ring-ring',
                dropdown: 'absolute inset-0 cursor-pointer opacity-0',
                nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
                button_previous: cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'size-8',
                ),
                button_next: cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'size-8',
                ),
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'w-9 text-xs font-normal text-muted-foreground',
                week: 'mt-1 flex w-full',
                day: 'size-9 p-0 text-center',
                day_button:
                    'size-9 rounded-md transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                selected:
                    '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
                today: '[&>button]:font-semibold [&>button]:underline [&>button]:underline-offset-4',
                outside: 'text-muted-foreground/50',
                disabled: 'pointer-events-none text-muted-foreground/40',
                hidden: 'invisible',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className: chevronClass }) => {
                    const Icon =
                        orientation === 'left'
                            ? ChevronLeft
                            : orientation === 'right'
                              ? ChevronRight
                              : ChevronDown;
                    return <Icon className={cn('size-4', chevronClass)} />;
                },
            }}
            {...props}
        />
    );
}

export { Calendar };
