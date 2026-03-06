import { arrayMove } from '@dnd-kit/sortable';
import type { PageSection } from '@/types/pages';
import { createEmptySection, generateSectionId } from '@/types/pages';

type SetDataFn = (key: 'sections', value: PageSection[]) => void;

/**
 * Provides all section manipulation operations for the page builder.
 * Keeps section logic in one place so both create and edit pages stay consistent.
 */
export function useSectionBuilder(sections: PageSection[], setData: SetDataFn) {
    const addSection = (type: string = 'rich_text') => {
        const section = createEmptySection(type);
        setData('sections', [...sections, section]);
        return section.id;
    };

    const removeSection = (index: number) => {
        setData('sections', sections.filter((_, i) => i !== index));
    };

    const updateSectionData = (index: number, key: string, value: unknown) => {
        const updated = [...sections];
        updated[index] = {
            ...updated[index],
            data: { ...updated[index].data, [key]: value },
        };
        setData('sections', updated);
    };

    const updateSectionAlignment = (index: number, alignment: string) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], alignment };
        setData('sections', updated);
    };

    const moveSection = (oldIndex: number, newIndex: number) => {
        setData('sections', arrayMove(sections, oldIndex, newIndex));
    };

    const duplicateSection = (index: number) => {
        const original = sections[index];
        const duplicate: PageSection = {
            ...original,
            id: generateSectionId(),
            data: { ...original.data },
        };
        const updated = [...sections];
        updated.splice(index + 1, 0, duplicate);
        setData('sections', updated);
        return duplicate.id;
    };

    return {
        addSection,
        removeSection,
        updateSectionData,
        updateSectionAlignment,
        moveSection,
        duplicateSection,
    };
}
