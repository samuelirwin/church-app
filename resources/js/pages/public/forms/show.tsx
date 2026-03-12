import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormFieldRenderer, type FormField } from '@/components/form-field-renderer';

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
                            {form.fields.map((field) => (
                                <FormFieldRenderer
                                    key={field.id}
                                    field={field}
                                    value={data.answers[field.id]}
                                    error={errors[`answers.${field.id}` as keyof typeof errors]}
                                    onChange={updateAnswer}
                                />
                            ))}

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
