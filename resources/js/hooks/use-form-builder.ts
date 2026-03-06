import { arrayMove } from '@dnd-kit/sortable';
import type { FormField, FieldOption } from '@/types/forms';
import { createEmptyField, generateFieldId } from '@/types/forms';

type SetDataFn = (key: 'fields', value: FormField[]) => void;

/**
 * Provides all field manipulation operations for the form builder.
 * Keeps field logic in one place so both create and edit pages stay consistent.
 */
export function useFormBuilder(fields: FormField[], setData: SetDataFn) {
    const addField = (type: string = 'text') => {
        const field = createEmptyField();
        field.type = type;
        setData('fields', [...fields, field]);
        return field.id;
    };

    const removeField = (index: number) => {
        if (fields.length <= 1) return;
        setData('fields', fields.filter((_, i) => i !== index));
    };

    const updateField = (index: number, key: keyof FormField, value: unknown) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], [key]: value };
        setData('fields', updated);
    };

    const moveField = (oldIndex: number, newIndex: number) => {
        setData('fields', arrayMove(fields, oldIndex, newIndex));
    };

    const duplicateField = (index: number) => {
        const original = fields[index];
        const duplicate: FormField = {
            ...original,
            id: generateFieldId(),
            label: original.label ? `${original.label} (copy)` : '',
            options: original.options.map((opt) => ({ ...opt })),
        };
        const updated = [...fields];
        updated.splice(index + 1, 0, duplicate);
        setData('fields', updated);
        return duplicate.id;
    };

    const addOption = (fieldIndex: number) => {
        const updated = [...fields];
        updated[fieldIndex] = {
            ...updated[fieldIndex],
            options: [...updated[fieldIndex].options, { label: '', value: '', correct: false }],
        };
        setData('fields', updated);
    };

    const removeOption = (fieldIndex: number, optionIndex: number) => {
        const updated = [...fields];
        updated[fieldIndex] = {
            ...updated[fieldIndex],
            options: updated[fieldIndex].options.filter((_, i) => i !== optionIndex),
        };
        setData('fields', updated);
    };

    const updateOption = (fieldIndex: number, optionIndex: number, updates: Partial<FieldOption>) => {
        const updated = [...fields];
        const options = [...updated[fieldIndex].options];
        options[optionIndex] = { ...options[optionIndex], ...updates };
        updated[fieldIndex] = { ...updated[fieldIndex], options };
        setData('fields', updated);
    };

    return {
        addField,
        removeField,
        updateField,
        moveField,
        duplicateField,
        addOption,
        removeOption,
        updateOption,
    };
}
