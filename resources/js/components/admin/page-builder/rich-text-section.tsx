import { RichEditor } from '@/components/admin/rich-editor';
import { Label } from '@/components/ui/label';

type RichTextSectionProps = {
    data: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    errors: Record<string, string>;
    sectionIndex: number;
};

export function RichTextSection({ data, onChange, errors, sectionIndex }: RichTextSectionProps) {
    return (
        <div className="space-y-2">
            <Label>Content</Label>
            <RichEditor
                value={(data.content as string) ?? ''}
                onChange={(html) => onChange('content', html)}
                placeholder="Write your content..."
                error={errors[`sections.${sectionIndex}.data.content`]}
            />
        </div>
    );
}
