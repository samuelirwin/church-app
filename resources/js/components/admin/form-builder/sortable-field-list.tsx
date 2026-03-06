import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableFieldCard } from './sortable-field-card';
import type { FormField, FieldOption } from '@/types/forms';

type SortableFieldListProps = {
    fields: FormField[];
    scoringEnabled: boolean;
    errors: Record<string, string>;
    expandedFieldId: string | null;
    onToggleExpand: (fieldId: string) => void;
    onMoveField: (oldIndex: number, newIndex: number) => void;
    onUpdateField: (index: number, key: keyof FormField, value: unknown) => void;
    onRemoveField: (index: number) => void;
    onDuplicateField: (index: number) => void;
    onAddOption: (fieldIndex: number) => void;
    onRemoveOption: (fieldIndex: number, optionIndex: number) => void;
    onUpdateOption: (fieldIndex: number, optionIndex: number, updates: Partial<FieldOption>) => void;
};

export function SortableFieldList({
    fields,
    scoringEnabled,
    errors,
    expandedFieldId,
    onToggleExpand,
    onMoveField,
    onUpdateField,
    onRemoveField,
    onDuplicateField,
    onAddOption,
    onRemoveOption,
    onUpdateOption,
}: SortableFieldListProps) {
    // Require 8px of movement before starting a drag to prevent accidental drags when clicking inputs
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            onMoveField(oldIndex, newIndex);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <SortableFieldCard
                            key={field.id}
                            field={field}
                            fieldIndex={index}
                            totalFields={fields.length}
                            scoringEnabled={scoringEnabled}
                            errors={errors}
                            expandedFieldId={expandedFieldId}
                            onToggleExpand={onToggleExpand}
                            onUpdateField={onUpdateField}
                            onRemoveField={onRemoveField}
                            onDuplicateField={onDuplicateField}
                            onAddOption={onAddOption}
                            onRemoveOption={onRemoveOption}
                            onUpdateOption={onUpdateOption}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
