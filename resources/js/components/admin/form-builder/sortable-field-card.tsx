import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FormField, FieldOption } from '@/types/forms';
import { FIELD_TYPES, hasFieldOptions } from '@/types/forms';

type SortableFieldCardProps = {
    field: FormField;
    fieldIndex: number;
    totalFields: number;
    scoringEnabled: boolean;
    errors: Record<string, string>;
    expandedFieldId: string | null;
    onToggleExpand: (fieldId: string) => void;
    onUpdateField: (index: number, key: keyof FormField, value: unknown) => void;
    onRemoveField: (index: number) => void;
    onDuplicateField: (index: number) => void;
    onAddOption: (fieldIndex: number) => void;
    onRemoveOption: (fieldIndex: number, optionIndex: number) => void;
    onUpdateOption: (fieldIndex: number, optionIndex: number, updates: Partial<FieldOption>) => void;
};

export function SortableFieldCard({
    field,
    fieldIndex,
    totalFields,
    scoringEnabled,
    errors,
    expandedFieldId,
    onToggleExpand,
    onUpdateField,
    onRemoveField,
    onDuplicateField,
    onAddOption,
    onRemoveOption,
    onUpdateOption,
}: SortableFieldCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isExpanded = expandedFieldId === field.id;
    const fieldTypeLabel = FIELD_TYPES.find((ft) => ft.value === field.type)?.label ?? field.type;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-lg border border-border bg-background transition-shadow ${
                isDragging ? 'z-50 shadow-lg ring-2 ring-primary/20' : ''
            }`}
        >
            {/* Collapsed header - always visible */}
            <div
                className="flex cursor-pointer items-center gap-2 p-3"
                onClick={() => onToggleExpand(field.id)}
            >
                <button
                    type="button"
                    className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="size-4" />
                </button>

                {isExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                )}

                <span className="flex-1 truncate text-sm font-medium">
                    {field.label || 'Untitled Field'}
                </span>

                <Badge variant="outline" className="text-xs">
                    {fieldTypeLabel}
                </Badge>

                {field.required && (
                    <Badge variant="secondary" className="text-xs">
                        Required
                    </Badge>
                )}

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateField(fieldIndex);
                        }}
                    >
                        <Copy className="size-3.5" />
                    </Button>
                    {totalFields > 1 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveField(fieldIndex);
                            }}
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="space-y-3 border-t border-border px-3 pb-4 pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label>Label *</Label>
                            <Input
                                value={field.label}
                                onChange={(e) => onUpdateField(fieldIndex, 'label', e.target.value)}
                                placeholder="Field label"
                            />
                            {errors[`fields.${fieldIndex}.label`] && (
                                <p className="text-sm text-red-500">{errors[`fields.${fieldIndex}.label`]}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Type *</Label>
                            <Select
                                value={field.type}
                                onValueChange={(v) => onUpdateField(fieldIndex, 'type', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPES.map((ft) => (
                                        <SelectItem key={ft.value} value={ft.value}>
                                            {ft.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label>Placeholder</Label>
                            <Input
                                value={field.placeholder}
                                onChange={(e) => onUpdateField(fieldIndex, 'placeholder', e.target.value)}
                            />
                        </div>
                        {scoringEnabled && (
                            <div className="space-y-1">
                                <Label>Points</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={field.points}
                                    onChange={(e) => onUpdateField(fieldIndex, 'points', Number(e.target.value))}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => onUpdateField(fieldIndex, 'required', e.target.checked)}
                            className="size-4 rounded border-input"
                        />
                        <Label>Required</Label>
                    </div>

                    {hasFieldOptions(field.type) && (
                        <div className="space-y-2">
                            <Label>Options</Label>
                            {field.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                    <Input
                                        value={option.label}
                                        onChange={(e) => {
                                            onUpdateOption(fieldIndex, optIndex, { label: e.target.value, value: e.target.value });
                                        }}
                                        placeholder="Option label"
                                        className="flex-1"
                                    />
                                    {scoringEnabled && (
                                        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={option.correct ?? false}
                                                onChange={(e) =>
                                                    onUpdateOption(fieldIndex, optIndex, { correct: e.target.checked })
                                                }
                                                className="size-3"
                                            />
                                            Correct
                                        </label>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemoveOption(fieldIndex, optIndex)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="size-3" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onAddOption(fieldIndex)}
                            >
                                Add Option
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
