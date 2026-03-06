import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

type VideoEmbedSectionProps = {
    data: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    errors: Record<string, string>;
    sectionIndex: number;
};

function getEmbedUrl(url: string): string | null {
    if (!url) return null;

    // YouTube
    const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    // Already an embed URL
    if (url.includes('embed') || url.includes('player')) return url;

    return null;
}

export function VideoEmbedSection({ data, onChange, errors, sectionIndex }: VideoEmbedSectionProps) {
    const url = (data.url as string) ?? '';
    const embedUrl = getEmbedUrl(url);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Video URL *</Label>
                <Input
                    value={url}
                    onChange={(e) => onChange('url', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                />
                <InputError message={errors[`sections.${sectionIndex}.data.url`]} />
                <p className="text-xs text-muted-foreground">
                    Supports YouTube and Vimeo URLs.
                </p>
            </div>

            {embedUrl && (
                <div className="aspect-video overflow-hidden rounded-lg border">
                    <iframe
                        src={embedUrl}
                        title="Video preview"
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}
        </div>
    );
}
