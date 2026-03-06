import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type TagInputProps = {
    value: string[];
    onChange: (tags: string[]) => void;
    suggestions?: string[];
    placeholder?: string;
    error?: string;
};

export function TagInput({ value, onChange, suggestions = [], placeholder = 'Add a tag...', error }: TagInputProps) {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredSuggestions = suggestions.filter(
        (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s),
    );

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setInput('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const removeTag = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value.length - 1);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                {value.map((tag, i) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(i)}
                            className="ml-0.5 rounded-sm hover:bg-muted-foreground/20"
                        >
                            <X className="size-3" />
                        </button>
                    </Badge>
                ))}
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder={value.length === 0 ? placeholder : ''}
                        className="h-6 w-full min-w-[80px] border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {showSuggestions && input && filteredSuggestions.length > 0 && (
                        <div className="absolute left-0 top-full z-10 mt-1 max-h-32 w-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                            {filteredSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => addTag(suggestion)}
                                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
