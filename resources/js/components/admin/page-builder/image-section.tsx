import { ImageUploader } from '@/components/admin/image-uploader';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MediaItem } from '@/types/media';

type ImageSectionProps = {
    data: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    errors: Record<string, string>;
    sectionIndex: number;
    onFileChange: (file: File | null) => void;
};

export function ImageSection({ data, onChange, errors, sectionIndex, onFileChange }: ImageSectionProps) {
    const handleLibrarySelect = (item: MediaItem) => {
        onChange('url', item.url);
        onFileChange(null);
    };

    const handleRemove = () => {
        onChange('url', '');
    };

    return (
        <div className="space-y-4">
            <ImageUploader
                currentUrl={(data.url as string) || undefined}
                onChange={(file) => onFileChange(file)}
                onRemove={handleRemove}
                onSelectFromLibrary={handleLibrarySelect}
                label="Image"
                error={errors[`sections.${sectionIndex}.data.url`]}
            />

            <div className="space-y-2">
                <Label>Alt Text</Label>
                <Input
                    value={(data.alt_text as string) ?? ''}
                    onChange={(e) => onChange('alt_text', e.target.value)}
                    placeholder="Describe the image..."
                />
                <InputError message={errors[`sections.${sectionIndex}.data.alt_text`]} />
            </div>

            <div className="space-y-2">
                <Label>Caption</Label>
                <Input
                    value={(data.caption as string) ?? ''}
                    onChange={(e) => onChange('caption', e.target.value)}
                    placeholder="Optional caption..."
                />
                <InputError message={errors[`sections.${sectionIndex}.data.caption`]} />
            </div>
        </div>
    );
}
