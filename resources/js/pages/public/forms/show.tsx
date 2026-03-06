import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FieldOption = { label: string; value: string };

type FormField = {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: FieldOption[];
    step?: number;
};

type FormSettings = {
    confirmation_message?: string;
    scoring_enabled?: boolean;
    show_results?: boolean;
    one_response_per_user?: boolean;
};

type FormData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    fields: FormField[];
    settings: FormSettings;
    is_multi_step: boolean;
    is_active: boolean;
    expires_at: string | null;
};

type Props = {
    form: { data: FormData };
    hasResponded: boolean;
};

type PageProps = {
    flash?: { success?: string; error?: string };
};

export default function FormShow({ form: { data: form }, hasResponded }: Props) {
    const { flash } = usePage<PageProps>().props;

    const initialAnswers: Record<string, unknown> = {};
    form.fields.forEach((field) => {
        initialAnswers[field.id] = field.type === 'checkbox' ? [] : '';
    });

    const { data, setData, post, processing, errors } = useForm({
        answers: initialAnswers,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/forms/${form.slug}/submit`);
    };

    const updateAnswer = (fieldId: string, value: unknown) => {
        setData('answers', { ...data.answers, [fieldId]: value });
    };

    const toggleCheckbox = (fieldId: string, optionValue: string) => {
        const current = (data.answers[fieldId] as string[]) || [];
        const updated = current.includes(optionValue)
            ? current.filter((v) => v !== optionValue)
            : [...current, optionValue];
        updateAnswer(fieldId, updated);
    };

    // Show success message after submission
    if (flash?.success) {
        return (
            <PublicLayout title={form.title}>
                <Head title={form.title} />
                <div className="mx-auto max-w-2xl px-4 py-20 text-center">
                    <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
                    <h1 className="mb-2 text-2xl font-bold">{flash.success}</h1>
                    <p className="text-muted-foreground">Your response has been recorded.</p>
                </div>
            </PublicLayout>
        );
    }

    // Show already responded message
    if (hasResponded) {
        return (
            <PublicLayout title={form.title}>
                <Head title={form.title} />
                <div className="mx-auto max-w-2xl px-4 py-20 text-center">
                    <h1 className="mb-2 text-2xl font-bold">{form.title}</h1>
                    <p className="text-muted-foreground">You have already submitted a response to this form.</p>
                </div>
            </PublicLayout>
        );
    }

    // Show inactive form message
    if (!form.is_active) {
        return (
            <PublicLayout title={form.title}>
                <Head title={form.title} />
                <div className="mx-auto max-w-2xl px-4 py-20 text-center">
                    <h1 className="mb-2 text-2xl font-bold">{form.title}</h1>
                    <p className="text-muted-foreground">This form is no longer accepting responses.</p>
                </div>
            </PublicLayout>
        );
    }

    const renderField = (field: FormField) => {
        const fieldError = errors[`answers.${field.id}` as keyof typeof errors];

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label} {field.required && '*'}
                        </Label>
                        <Input
                            id={field.id}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={(data.answers[field.id] as string) || ''}
                            onChange={(e) => updateAnswer(field.id, e.target.value)}
                        />
                        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label} {field.required && '*'}
                        </Label>
                        <textarea
                            id={field.id}
                            placeholder={field.placeholder}
                            value={(data.answers[field.id] as string) || ''}
                            onChange={(e) => updateAnswer(field.id, e.target.value)}
                            rows={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
                    </div>
                );

            case 'date':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label} {field.required && '*'}
                        </Label>
                        <Input
                            id={field.id}
                            type="date"
                            value={(data.answers[field.id] as string) || ''}
                            onChange={(e) => updateAnswer(field.id, e.target.value)}
                        />
                        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
                    </div>
                );

            case 'select':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label>
                            {field.label} {field.required && '*'}
                        </Label>
                        <Select
                            value={(data.answers[field.id] as string) || ''}
                            onValueChange={(v) => updateAnswer(field.id, v)}
                        >
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
                        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
                    </div>
                );

            case 'radio':
                return (
                    <div key={field.id} className="space-y-2">
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
                                        checked={(data.answers[field.id] as string) === opt.value}
                                        onChange={(e) => updateAnswer(field.id, e.target.value)}
                                        className="size-4"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label>
                            {field.label} {field.required && '*'}
                        </Label>
                        <div className="space-y-2">
                            {field.options?.map((opt) => (
                                <label key={opt.value} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={((data.answers[field.id] as string[]) || []).includes(opt.value)}
                                        onChange={() => toggleCheckbox(field.id, opt.value)}
                                        className="size-4 rounded border-input"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
                    </div>
                );

            case 'rating':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label>
                            {field.label} {field.required && '*'}
                        </Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => updateAnswer(field.id, String(star))}
                                    className={`text-2xl ${Number(data.answers[field.id]) >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
                    </div>
                );

            case 'scale':
                return (
                    <div key={field.id} className="space-y-2">
                        <Label>
                            {field.label} {field.required && '*'}
                        </Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => updateAnswer(field.id, String(num))}
                                    className={`flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                                        String(data.answers[field.id]) === String(num)
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input hover:bg-muted'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <PublicLayout title={form.title}>
            <Head title={form.title} />

            <div className="mx-auto max-w-2xl px-4 py-12">
                {flash?.error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {flash.error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{form.title}</CardTitle>
                        {form.description && (
                            <p className="text-muted-foreground">{form.description}</p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {form.fields.map(renderField)}

                            <div className="pt-4">
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                    {processing ? 'Submitting...' : 'Submit'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PublicLayout>
    );
}
