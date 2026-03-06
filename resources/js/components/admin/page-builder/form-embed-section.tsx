import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';

type PublishedForm = { id: number; title: string; slug: string };

type FormEmbedSectionProps = {
    data: Record<string, unknown>;
    publishedForms: PublishedForm[];
    onChange: (key: string, value: unknown) => void;
    errors: Record<string, string>;
    sectionIndex: number;
};

export function FormEmbedSection({ data, publishedForms, onChange, errors, sectionIndex }: FormEmbedSectionProps) {
    const formId = data.form_id ? String(data.form_id) : '';

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Form *</Label>
                <Select
                    value={formId}
                    onValueChange={(v) => onChange('form_id', Number(v))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a form..." />
                    </SelectTrigger>
                    <SelectContent>
                        {publishedForms.map((form) => (
                            <SelectItem key={form.id} value={String(form.id)}>
                                {form.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors[`sections.${sectionIndex}.data.form_id`]} />
            </div>

            <div className="space-y-2">
                <Label>Heading (optional)</Label>
                <Input
                    value={(data.heading as string) ?? ''}
                    onChange={(e) => onChange('heading', e.target.value)}
                    placeholder="e.g. Fill out this form..."
                />
                <InputError message={errors[`sections.${sectionIndex}.data.heading`]} />
            </div>
        </div>
    );
}
