import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PAGE_LAYOUTS } from '@/types/pages';

type LayoutSelectorProps = {
    value: string;
    onChange: (layout: string) => void;
};

const layoutThumbnails: Record<string, React.ReactNode> = {
    full_width: (
        <div className="flex h-full flex-col gap-0.5 p-1">
            <div className="h-2 w-full rounded-sm bg-current opacity-30" />
            <div className="flex-1 rounded-sm bg-current opacity-20" />
        </div>
    ),
    sidebar_right: (
        <div className="flex h-full gap-0.5 p-1">
            <div className="flex-[2] rounded-sm bg-current opacity-20" />
            <div className="flex-1 rounded-sm bg-current opacity-30" />
        </div>
    ),
    sidebar_left: (
        <div className="flex h-full gap-0.5 p-1">
            <div className="flex-1 rounded-sm bg-current opacity-30" />
            <div className="flex-[2] rounded-sm bg-current opacity-20" />
        </div>
    ),
    two_column: (
        <div className="flex h-full gap-0.5 p-1">
            <div className="flex-1 rounded-sm bg-current opacity-20" />
            <div className="flex-1 rounded-sm bg-current opacity-20" />
        </div>
    ),
    landing: (
        <div className="flex h-full flex-col gap-0.5 p-1">
            <div className="h-3 w-full rounded-sm bg-current opacity-30" />
            <div className="flex-1 rounded-sm bg-current opacity-15" />
            <div className="h-2 w-full rounded-sm bg-current opacity-25" />
        </div>
    ),
};

export function LayoutSelector({ value, onChange }: LayoutSelectorProps) {
    return (
        <div className="space-y-2">
            <Label>Page Layout</Label>
            <div className="grid grid-cols-5 gap-2">
                {PAGE_LAYOUTS.map((layout) => (
                    <button
                        key={layout.value}
                        type="button"
                        onClick={() => onChange(layout.value)}
                        className={cn(
                            'flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors',
                            value === layout.value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                        )}
                    >
                        <div className="h-10 w-full rounded border border-current/20">
                            {layoutThumbnails[layout.value]}
                        </div>
                        <span className="text-[10px] font-medium leading-tight">
                            {layout.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
