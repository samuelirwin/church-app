import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RichTextSection } from './rich-text-section';
import { FormEmbedSection } from './form-embed-section';
import { ImageSection } from './image-section';
import { CtaSection } from './cta-section';
import { VideoEmbedSection } from './video-embed-section';
import { QrCodeSection } from './qr-code-section';
import { SECTION_TYPES, SECTION_ALIGNMENTS, type PageSection } from '@/types/pages';

type PublishedForm = { id: number; title: string; slug: string };

type SectionEditorProps = {
    section: PageSection;
    sectionIndex: number;
    publishedForms: PublishedForm[];
    errors: Record<string, string>;
    onUpdateData: (index: number, key: string, value: unknown) => void;
    onUpdateAlignment: (index: number, alignment: string) => void;
    onRemove: (index: number) => void;
    onDuplicate: (index: number) => void;
    onFileChange?: (index: number, file: File | null) => void;
};

export function SectionEditor({
    section,
    sectionIndex,
    publishedForms,
    errors,
    onUpdateData,
    onUpdateAlignment,
    onRemove,
    onDuplicate,
    onFileChange,
}: SectionEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const typeLabel = SECTION_TYPES.find((st) => st.value === section.type)?.label ?? section.type;

    const renderSectionContent = () => {
        switch (section.type) {
            case 'rich_text':
                return (
                    <RichTextSection
                        data={section.data}
                        onChange={(key, value) => onUpdateData(sectionIndex, key, value)}
                        errors={errors}
                        sectionIndex={sectionIndex}
                    />
                );
            case 'form_embed':
                return (
                    <FormEmbedSection
                        data={section.data}
                        publishedForms={publishedForms}
                        onChange={(key, value) => onUpdateData(sectionIndex, key, value)}
                        errors={errors}
                        sectionIndex={sectionIndex}
                    />
                );
            case 'image':
                return (
                    <ImageSection
                        data={section.data}
                        onChange={(key, value) => onUpdateData(sectionIndex, key, value)}
                        errors={errors}
                        sectionIndex={sectionIndex}
                        onFileChange={(file) => onFileChange?.(sectionIndex, file)}
                    />
                );
            case 'call_to_action':
                return (
                    <CtaSection
                        data={section.data}
                        onChange={(key, value) => onUpdateData(sectionIndex, key, value)}
                        errors={errors}
                        sectionIndex={sectionIndex}
                    />
                );
            case 'video_embed':
                return (
                    <VideoEmbedSection
                        data={section.data}
                        onChange={(key, value) => onUpdateData(sectionIndex, key, value)}
                        errors={errors}
                        sectionIndex={sectionIndex}
                    />
                );
            case 'qr_code':
                return (
                    <QrCodeSection
                        data={section.data}
                        onChange={(key, value) => onUpdateData(sectionIndex, key, value)}
                        errors={errors}
                        sectionIndex={sectionIndex}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-lg border border-border bg-background transition-shadow ${
                isDragging ? 'z-50 shadow-lg ring-2 ring-primary/20' : ''
            }`}
        >
            {/* Header */}
            <div
                className="flex cursor-pointer items-center gap-2 p-3"
                onClick={() => setIsExpanded(!isExpanded)}
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
                    {typeLabel}
                </span>

                <Badge variant="outline" className="text-xs">
                    {SECTION_ALIGNMENTS.find((a) => a.value === section.alignment)?.label ?? section.alignment}
                </Badge>

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(sectionIndex);
                        }}
                    >
                        <Copy className="size-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(sectionIndex);
                        }}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="space-y-4 border-t border-border px-3 pb-4 pt-3">
                    <div className="space-y-1">
                        <Label>Alignment</Label>
                        <Select
                            value={section.alignment}
                            onValueChange={(v) => onUpdateAlignment(sectionIndex, v)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SECTION_ALIGNMENTS.map((a) => (
                                    <SelectItem key={a.value} value={a.value}>
                                        {a.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {renderSectionContent()}
                </div>
            )}
        </div>
    );
}
