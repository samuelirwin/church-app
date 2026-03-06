import { FolderOpen, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { MediaBrowser } from '@/components/admin/media-browser';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/media';

type MultiImageUploaderProps = {
    currentUrls?: Array<{ id: number; url: string }>;
    onFilesChange: (files: File[]) => void;
    onRemove?: (mediaId: number) => void;
    onSelectFromLibrary?: (items: MediaItem[]) => void;
    label?: string;
    error?: string;
    accept?: string;
};

export function MultiImageUploader({
    currentUrls = [],
    onFilesChange,
    onRemove,
    onSelectFromLibrary,
    label = 'Images',
    error,
    accept = 'image/*',
}: MultiImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [newFiles, setNewFiles] = useState<Array<{ id: string; file: File; preview: string }>>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [browserOpen, setBrowserOpen] = useState(false);

    const addFiles = useCallback(
        (files: FileList | File[]) => {
            const entries = Array.from(files)
                .filter((f) => f.type.startsWith('image/'))
                .map((file) => ({
                    id: crypto.randomUUID(),
                    file,
                    preview: URL.createObjectURL(file),
                }));

            const updated = [...newFiles, ...entries];
            setNewFiles(updated);
            onFilesChange(updated.map((e) => e.file));
        },
        [newFiles, onFilesChange],
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            addFiles(e.dataTransfer.files);
        }
    };

    const removeNew = (id: string) => {
        const entry = newFiles.find((f) => f.id === id);
        if (entry) {
            URL.revokeObjectURL(entry.preview);
        }
        const updated = newFiles.filter((f) => f.id !== id);
        setNewFiles(updated);
        onFilesChange(updated.map((e) => e.file));
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>

            <div className="flex flex-wrap gap-3">
                {currentUrls.map((img) => (
                    <div key={img.id} className="relative inline-block">
                        <img
                            src={img.url}
                            alt="Cover"
                            className="h-32 w-32 rounded-lg border object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => onRemove?.(img.id)}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white shadow-sm transition-colors hover:bg-destructive"
                        >
                            <Trash2 className="size-3" />
                        </button>
                    </div>
                ))}

                {newFiles.map((entry) => (
                    <div key={entry.id} className="relative inline-block">
                        <img
                            src={entry.preview}
                            alt="New upload"
                            className="h-32 w-32 rounded-lg border object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeNew(entry.id)}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white shadow-sm transition-colors hover:bg-destructive"
                        >
                            <Trash2 className="size-3" />
                        </button>
                    </div>
                ))}

                {onSelectFromLibrary && (
                    <button
                        type="button"
                        onClick={() => setBrowserOpen(true)}
                        className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50"
                    >
                        <FolderOpen className="mb-1 h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Browse</span>
                    </button>
                )}

                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        'flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                        isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50',
                    )}
                >
                    <svg
                        className="mb-1 h-6 w-6 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                    <span className="text-xs text-muted-foreground">Add image</span>
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple
                onChange={handleFileChange}
                className="hidden"
            />

            <InputError message={error} />

            {onSelectFromLibrary && (
                <MediaBrowser
                    open={browserOpen}
                    onOpenChange={setBrowserOpen}
                    onSelect={onSelectFromLibrary}
                    mimeFilter="image/"
                    multiple
                />
            )}
        </div>
    );
}
