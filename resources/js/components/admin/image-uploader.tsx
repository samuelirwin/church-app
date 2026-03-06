import { Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { MediaBrowser } from '@/components/admin/media-browser';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/media';

type ImageUploaderProps = {
    currentUrl?: string | null;
    onChange: (file: File | null) => void;
    onRemove?: () => void;
    onSelectFromLibrary?: (item: MediaItem) => void;
    label?: string;
    error?: string;
    accept?: string;
};

export function ImageUploader({
    currentUrl,
    onChange,
    onRemove,
    onSelectFromLibrary,
    label = 'Image',
    error,
    accept = 'image/*',
}: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [browserOpen, setBrowserOpen] = useState(false);

    const hasImage = preview || currentUrl;

    const handleFile = useCallback(
        (file: File | null) => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }

            if (file) {
                setPreview(URL.createObjectURL(file));
            } else {
                setPreview(null);
            }

            onChange(file);
        },
        [onChange, preview],
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    };

    const handleRemove = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onChange(null);
        onRemove?.();
    };

    const handleLibrarySelect = (items: MediaItem[]) => {
        if (items.length > 0 && onSelectFromLibrary) {
            onSelectFromLibrary(items[0]);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>

            {hasImage ? (
                <div className="relative">
                    <img
                        src={preview ?? currentUrl!}
                        alt="Preview"
                        className="max-h-64 w-full rounded-lg border object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm transition-colors hover:bg-destructive"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        'flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                        isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50',
                    )}
                >
                    <svg
                        className="mb-2 h-8 w-8 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                        />
                    </svg>
                    <span className="text-xs text-muted-foreground">Click or drag</span>
                    {onSelectFromLibrary && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setBrowserOpen(true);
                            }}
                            className="mt-1 text-xs text-primary hover:underline"
                        >
                            or browse library
                        </button>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />

            <InputError message={error} />

            {onSelectFromLibrary && (
                <MediaBrowser
                    open={browserOpen}
                    onOpenChange={setBrowserOpen}
                    onSelect={handleLibrarySelect}
                    mimeFilter="image/"
                />
            )}
        </div>
    );
}
