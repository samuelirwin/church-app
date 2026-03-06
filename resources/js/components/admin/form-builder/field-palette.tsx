import {
    Type,
    AlignLeft,
    Mail,
    Hash,
    Calendar,
    ChevronDown,
    CircleDot,
    CheckSquare,
    Star,
    SlidersHorizontal,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FIELD_TYPE_CONFIG = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'textarea', label: 'Text Area', icon: AlignLeft },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'select', label: 'Dropdown', icon: ChevronDown },
    { value: 'radio', label: 'Radio', icon: CircleDot },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { value: 'rating', label: 'Rating', icon: Star },
    { value: 'scale', label: 'Scale', icon: SlidersHorizontal },
] as const;

type FieldPaletteProps = {
    onAddField: (type: string) => void;
};

export function FieldPalette({ onAddField }: FieldPaletteProps) {
    return (
        <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-5 gap-2">
                {FIELD_TYPE_CONFIG.map(({ value, label, icon: Icon }) => (
                    <Tooltip key={value}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => onAddField(value)}
                                className="flex flex-col items-center gap-1 rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-foreground"
                            >
                                <Icon className="size-4" />
                                <span className="text-[10px] leading-tight">{label}</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Add {label} field</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}
