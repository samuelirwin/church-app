import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import QrCode from '@/components/qr-code';

type QrCodeSectionProps = {
    data: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    errors: Record<string, string>;
    sectionIndex: number;
};

export function QrCodeSection({ data, onChange, errors, sectionIndex }: QrCodeSectionProps) {
    const urlMode = (data.url_mode as string) ?? 'page';
    const customUrl = (data.custom_url as string) ?? '';

    const previewPath = urlMode === 'custom' && customUrl ? customUrl : window.location.origin;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>QR Code Target</Label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="radio"
                            name={`section_${sectionIndex}_url_mode`}
                            value="page"
                            checked={urlMode === 'page'}
                            onChange={() => onChange('url_mode', 'page')}
                            className="size-4"
                        />
                        Page URL
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="radio"
                            name={`section_${sectionIndex}_url_mode`}
                            value="custom"
                            checked={urlMode === 'custom'}
                            onChange={() => onChange('url_mode', 'custom')}
                            className="size-4"
                        />
                        Custom URL
                    </label>
                </div>
            </div>

            {urlMode === 'custom' && (
                <div className="space-y-2">
                    <Label>Custom URL *</Label>
                    <Input
                        type="url"
                        value={customUrl}
                        onChange={(e) => onChange('custom_url', e.target.value)}
                        placeholder="https://example.com"
                    />
                    <InputError message={errors[`sections.${sectionIndex}.data.custom_url`]} />
                </div>
            )}

            <div className="flex justify-center rounded-lg border bg-white p-4">
                <QrCode path={previewPath} size={160} alt="QR Code preview" />
            </div>

            <p className="text-xs text-muted-foreground">
                {urlMode === 'page'
                    ? 'The QR code will point to this page\'s public URL.'
                    : 'The QR code will point to the custom URL above.'}
            </p>
        </div>
    );
}
