import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    list: ReactNode;
    detail: ReactNode;
    /** When nothing is selected the detail column shows `placeholder` instead. */
    hasSelection: boolean;
    placeholder: ReactNode;
};

/**
 * List on the left, selected item on the right, each scrolling on its own.
 * On small screens only one side shows at a time: the list, or the detail
 * once something is selected (the detail provides its own close button).
 */
export function SplitView({ list, detail, hasSelection, placeholder }: Props) {
    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
            <div
                className={cn(
                    'min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto',
                    hasSelection && 'hidden lg:block',
                )}
            >
                {list}
            </div>
            <div
                className={cn(
                    'min-w-0 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:rounded-xl lg:border lg:bg-card lg:p-5',
                    !hasSelection && 'hidden lg:block',
                )}
            >
                {hasSelection ? detail : placeholder}
            </div>
        </div>
    );
}
