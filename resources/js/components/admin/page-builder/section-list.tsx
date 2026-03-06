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
import { SectionEditor } from './section-editor';
import { SECTION_TYPES, type PageSection } from '@/types/pages';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Plus } from 'lucide-react';

type PublishedForm = { id: number; title: string; slug: string };

type SectionListProps = {
    sections: PageSection[];
    publishedForms: PublishedForm[];
    errors: Record<string, string>;
    onMoveSection: (oldIndex: number, newIndex: number) => void;
    onUpdateSectionData: (index: number, key: string, value: unknown) => void;
    onUpdateSectionAlignment: (index: number, alignment: string) => void;
    onRemoveSection: (index: number) => void;
    onDuplicateSection: (index: number) => void;
    onAddSection: (type: string) => void;
    onSectionFileChange?: (index: number, file: File | null) => void;
};

export function SectionList({
    sections,
    publishedForms,
    errors,
    onMoveSection,
    onUpdateSectionData,
    onUpdateSectionAlignment,
    onRemoveSection,
    onDuplicateSection,
    onAddSection,
    onSectionFileChange,
}: SectionListProps) {
    const [addType, setAddType] = useState('rich_text');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            onMoveSection(oldIndex, newIndex);
        }
    };

    return (
        <div className="space-y-3">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {sections.map((section, index) => (
                            <SectionEditor
                                key={section.id}
                                section={section}
                                sectionIndex={index}
                                publishedForms={publishedForms}
                                errors={errors}
                                onUpdateData={onUpdateSectionData}
                                onUpdateAlignment={onUpdateSectionAlignment}
                                onRemove={onRemoveSection}
                                onDuplicate={onDuplicateSection}
                                onFileChange={onSectionFileChange}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="flex items-center gap-2">
                <Select value={addType} onValueChange={setAddType}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SECTION_TYPES.map((st) => (
                            <SelectItem key={st.value} value={st.value}>
                                {st.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAddSection(addType)}
                >
                    <Plus className="mr-1 size-4" />
                    Add Section
                </Button>
            </div>
        </div>
    );
}
