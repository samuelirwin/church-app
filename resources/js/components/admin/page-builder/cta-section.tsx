import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichEditor } from '@/components/admin/rich-editor';
import InputError from '@/components/input-error';

type CtaSectionProps = {
    data: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    errors: Record<string, string>;
    sectionIndex: number;
};

export function CtaSection({ data, onChange, errors, sectionIndex }: CtaSectionProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Heading *</Label>
                <Input
                    value={(data.heading as string) ?? ''}
                    onChange={(e) => onChange('heading', e.target.value)}
                    placeholder="e.g. Join Us This Sunday"
                />
                <InputError message={errors[`sections.${sectionIndex}.data.heading`]} />
            </div>

            <div className="space-y-2">
                <Label>Body</Label>
                <RichEditor
                    value={(data.body as string) ?? ''}
                    onChange={(html) => onChange('body', html)}
                    placeholder="Supporting text..."
                    error={errors[`sections.${sectionIndex}.data.body`]}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label>Button Label</Label>
                    <Input
                        value={(data.button_label as string) ?? ''}
                        onChange={(e) => onChange('button_label', e.target.value)}
                        placeholder="e.g. Learn More"
                    />
                    <InputError message={errors[`sections.${sectionIndex}.data.button_label`]} />
                </div>
                <div className="space-y-2">
                    <Label>Button URL</Label>
                    <Input
                        value={(data.button_url as string) ?? ''}
                        onChange={(e) => onChange('button_url', e.target.value)}
                        placeholder="/sermons or https://..."
                    />
                    <InputError message={errors[`sections.${sectionIndex}.data.button_url`]} />
                </div>
            </div>
        </div>
    );
}
