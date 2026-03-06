import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FormField } from '@/types/forms';

type FieldPreviewRendererProps = {
    field: FormField;
};

/**
 * Renders a single form field in a disabled preview state.
 * Mirrors the public form show page rendering but all inputs are non-interactive.
 */
export function FieldPreviewRenderer({ field }: FieldPreviewRendererProps) {
    if (!field.label && !field.type) return null;

    const displayLabel = field.label || 'Untitled Field';

    switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
            return (
                <div className="space-y-2">
                    <Label className="text-sm">
                        {displayLabel} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                        type={field.type}
                        placeholder={field.placeholder || ''}
                        disabled
                        className="disabled:cursor-default disabled:opacity-60"
                    />
                </div>
            );

        case 'textarea':
            return (
                <div className="space-y-2">
                    <Label className="text-sm">
                        {displayLabel} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <textarea
                        placeholder={field.placeholder || ''}
                        disabled
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-default disabled:opacity-60"
                    />
                </div>
            );

        case 'date':
            return (
                <div className="space-y-2">
                    <Label className="text-sm">
                        {displayLabel} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input type="date" disabled className="disabled:cursor-default disabled:opacity-60" />
                </div>
            );

        case 'select':
            return (
                <div className="space-y-2">
                    <Label className="text-sm">
                        {displayLabel} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select disabled>
                        <SelectTrigger className="disabled:cursor-default disabled:opacity-60">
                            <SelectValue placeholder={field.placeholder || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options.map((opt, i) => (
                                <SelectItem key={i} value={opt.value || `opt-${i}`}>
                                    {opt.label || 'Option'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );

        case 'radio':
            return (
                <div className="space-y-2">
                    <Label className="text-sm">
                        {displayLabel} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="space-y-1.5">
                        {field.options.length > 0 ? (
                            field.options.map((opt, i) => (
                                <label key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="radio" disabled className="size-4" />
                                    {opt.label || 'Option'}
                                </label>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No options added yet</p>
                        )}
                    </div>
                </div>
            );

        case 'checkbox':
            return (
                <div className="space-y-2">
                    <Label className="text-sm">
                        {displayLabel} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="space-y-1.5">
                        {field.options.length > 0 ? (
                            field.options.map((opt, i) => (
                                <label key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="checkbox" disabled className="size-4 rounded border-input" />
                                    {opt.label || 'Option'}
                                </label>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No options added yet</p>
                        )}
                    </div>
                </div>
            );

        case 'rating':
            return (
                <div className="space-y-2">
                    <Label className="text-sm">
                        {displayLabel} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="text-xl text-gray-300">
                                ★
                            </span>
                        ))}
                    </div>
                </div>
            );

        case 'scale':
            return (
                <div className="space-y-2">
                    <Label className="text-sm">
                        {displayLabel} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <span
                                key={num}
                                className="flex size-7 items-center justify-center rounded-md border border-input text-xs text-muted-foreground"
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>
            );

        default:
            return null;
    }
}
