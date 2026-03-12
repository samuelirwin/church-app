import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FieldOption = { label: string; value: string };

export type FormField = {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: FieldOption[];
    step?: number;
};

type Props = {
    field: FormField;
    value: unknown;
    error?: string;
    onChange: (fieldId: string, value: unknown) => void;
};

export function FormFieldRenderer({ field, value, error, onChange }: Props) {
    const toggleCheckbox = (optionValue: string) => {
        const current = (value as string[]) || [];
        const updated = current.includes(optionValue)
            ? current.filter((v) => v !== optionValue)
            : [...current, optionValue];
        onChange(field.id, updated);
    };

    switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
            return (
                <div className="space-y-2">
                    <Label htmlFor={field.id}>
                        {field.label} {field.required && '*'}
                    </Label>
                    <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={(value as string) || ''}
                        onChange={(e) => onChange(field.id, e.target.value)}
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            );

        case 'textarea':
            return (
                <div className="space-y-2">
                    <Label htmlFor={field.id}>
                        {field.label} {field.required && '*'}
                    </Label>
                    <textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        value={(value as string) || ''}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        rows={4}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            );

        case 'date':
            return (
                <div className="space-y-2">
                    <Label htmlFor={field.id}>
                        {field.label} {field.required && '*'}
                    </Label>
                    <Input
                        id={field.id}
                        type="date"
                        value={(value as string) || ''}
                        onChange={(e) => onChange(field.id, e.target.value)}
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            );

        case 'select':
            return (
                <div className="space-y-2">
                    <Label>
                        {field.label} {field.required && '*'}
                    </Label>
                    <Select value={(value as string) || ''} onValueChange={(v) => onChange(field.id, v)}>
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            );

        case 'radio':
            return (
                <div className="space-y-2">
                    <Label>
                        {field.label} {field.required && '*'}
                    </Label>
                    <div className="space-y-2">
                        {field.options?.map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={opt.value}
                                    checked={(value as string) === opt.value}
                                    onChange={(e) => onChange(field.id, e.target.value)}
                                    className="size-4"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            );

        case 'checkbox':
            return (
                <div className="space-y-2">
                    <Label>
                        {field.label} {field.required && '*'}
                    </Label>
                    <div className="space-y-2">
                        {field.options?.map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={((value as string[]) || []).includes(opt.value)}
                                    onChange={() => toggleCheckbox(opt.value)}
                                    className="size-4 rounded border-input"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            );

        case 'rating':
            return (
                <div className="space-y-2">
                    <Label>
                        {field.label} {field.required && '*'}
                    </Label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => onChange(field.id, String(star))}
                                className={`text-2xl ${Number(value) >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            );

        case 'scale':
            return (
                <div className="space-y-2">
                    <Label>
                        {field.label} {field.required && '*'}
                    </Label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => onChange(field.id, String(num))}
                                className={`flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                                    String(value) === String(num)
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-input hover:bg-muted'
                                }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            );

        default:
            return null;
    }
}
