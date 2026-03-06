import { Link, useForm } from '@inertiajs/react';
import type { PageSection } from '@/types/pages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import QrCode from '@/components/qr-code';

type EmbeddedForm = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    fields: Array<{
        id: string;
        type: string;
        label: string;
        placeholder: string;
        required: boolean;
        options: Array<{ label: string; value: string }>;
    }>;
    settings: { confirmation_message?: string } | null;
    allows_anonymous: boolean;
};

type SectionRendererProps = {
    sections: PageSection[];
    embeddedForms: Record<number, EmbeddedForm>;
    pageUrl?: string;
};

function getAlignmentClass(alignment: string): string {
    return {
        left: 'text-left',
        right: 'text-right',
        center: 'text-center mx-auto',
        full: 'w-full',
    }[alignment] ?? 'w-full';
}

function getMaxWidth(alignment: string): string {
    return alignment === 'full' ? 'max-w-none' : 'max-w-3xl';
}

function getEmbedUrl(url: string): string | null {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    if (url.includes('embed') || url.includes('player')) return url;
    return null;
}

function EmbeddedFormRenderer({ form }: { form: EmbeddedForm }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm<Record<string, unknown>>({
        answers: Object.fromEntries(
            (form.fields ?? []).map((field) => [field.id, field.type === 'checkbox' ? [] : '']),
        ),
    });

    const answers = (data.answers ?? {}) as Record<string, unknown>;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/forms/${form.slug}/submit`);
    };

    if (recentlySuccessful) {
        return (
            <div className="rounded-lg border bg-green-50 p-6 text-center dark:bg-green-900/20">
                <p className="text-lg font-medium text-green-700 dark:text-green-300">
                    {form.settings?.confirmation_message ?? 'Thank you for your submission!'}
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {(form.fields ?? []).map((field) => (
                <div key={field.id} className="space-y-1">
                    <Label>
                        {field.label}
                        {field.required && <span className="text-destructive"> *</span>}
                    </Label>

                    {field.type === 'textarea' ? (
                        <textarea
                            value={(answers[field.id] as string) ?? ''}
                            onChange={(e) => setData('answers', { ...answers, [field.id]: e.target.value })}
                            placeholder={field.placeholder}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    ) : field.type === 'select' ? (
                        <select
                            value={(answers[field.id] as string) ?? ''}
                            onChange={(e) => setData('answers', { ...answers, [field.id]: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="">Select...</option>
                            {field.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    ) : field.type === 'radio' ? (
                        <div className="space-y-2">
                            {field.options.map((opt) => (
                                <label key={opt.value} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        name={field.id}
                                        value={opt.value}
                                        checked={answers[field.id] === opt.value}
                                        onChange={(e) => setData('answers', { ...answers, [field.id]: e.target.value })}
                                        className="size-4"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    ) : field.type === 'checkbox' ? (
                        <div className="space-y-2">
                            {field.options.map((opt) => (
                                <label key={opt.value} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        value={opt.value}
                                        checked={((answers[field.id] as string[]) ?? []).includes(opt.value)}
                                        onChange={(e) => {
                                            const current = (answers[field.id] as string[]) ?? [];
                                            const updated = e.target.checked
                                                ? [...current, opt.value]
                                                : current.filter((v: string) => v !== opt.value);
                                            setData('answers', { ...answers, [field.id]: updated });
                                        }}
                                        className="size-4"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    ) : (
                        <Input
                            type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={(answers[field.id] as string) ?? ''}
                            onChange={(e) => setData('answers', { ...answers, [field.id]: e.target.value })}
                            placeholder={field.placeholder}
                        />
                    )}

                    <InputError message={(errors as Record<string, string>)[`answers.${field.id}`]} />
                </div>
            ))}

            <Button type="submit" disabled={processing}>
                {processing ? 'Submitting...' : 'Submit'}
            </Button>
        </form>
    );
}

export function SectionRenderer({ sections, embeddedForms, pageUrl }: SectionRendererProps) {
    return (
        <div className="space-y-12">
            {sections.map((section) => {
                const alignClass = getAlignmentClass(section.alignment);
                const maxWidth = getMaxWidth(section.alignment);

                switch (section.type) {
                    case 'rich_text':
                        return (
                            <div key={section.id} className={`${alignClass} ${maxWidth}`}>
                                <div
                                    className="prose prose-sm max-w-none sm:prose-base"
                                    dangerouslySetInnerHTML={{ __html: (section.data.content as string) ?? '' }}
                                />
                            </div>
                        );

                    case 'form_embed': {
                        const formId = section.data.form_id as number;
                        const form = formId ? embeddedForms[formId] : null;
                        return (
                            <div key={section.id} className={`${alignClass} ${maxWidth}`}>
                                {(section.data.heading as string) && (
                                    <h2 className="mb-4 text-2xl font-bold">
                                        {section.data.heading as string}
                                    </h2>
                                )}
                                {form ? (
                                    <div className="rounded-lg border bg-card p-6">
                                        <EmbeddedFormRenderer form={form} />
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">Form not available.</p>
                                )}
                            </div>
                        );
                    }

                    case 'image':
                        return (
                            <div key={section.id} className={`${alignClass} ${maxWidth}`}>
                                {(section.data.url as string) && (
                                    <figure>
                                        <img
                                            src={section.data.url as string}
                                            alt={(section.data.alt_text as string) ?? ''}
                                            className="w-full rounded-lg"
                                        />
                                        {(section.data.caption as string) && (
                                            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                                                {section.data.caption as string}
                                            </figcaption>
                                        )}
                                    </figure>
                                )}
                            </div>
                        );

                    case 'call_to_action':
                        return (
                            <div key={section.id} className={`rounded-xl bg-primary/5 p-8 sm:p-12 ${alignClass}`}>
                                <h2 className="text-2xl font-bold sm:text-3xl">
                                    {(section.data.heading as string) ?? ''}
                                </h2>
                                {(section.data.body as string) && (
                                    <div
                                        className="prose prose-sm mt-3 max-w-none"
                                        dangerouslySetInnerHTML={{ __html: section.data.body as string }}
                                    />
                                )}
                                {(section.data.button_label as string) && (section.data.button_url as string) && (
                                    <div className="mt-6">
                                        <Link
                                            href={section.data.button_url as string}
                                            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                        >
                                            {section.data.button_label as string}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );

                    case 'video_embed': {
                        const embedUrl = getEmbedUrl((section.data.url as string) ?? '');
                        return (
                            <div key={section.id} className={`${alignClass} ${maxWidth}`}>
                                {embedUrl ? (
                                    <div className="aspect-video overflow-hidden rounded-lg">
                                        <iframe
                                            src={embedUrl}
                                            title="Video"
                                            className="h-full w-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">Invalid video URL.</p>
                                )}
                            </div>
                        );
                    }

                    case 'qr_code': {
                        const qrUrl = (section.data.url_mode as string) === 'custom'
                            ? (section.data.custom_url as string) ?? ''
                            : pageUrl ?? '';
                        return (
                            <div key={section.id} className={`flex justify-center ${alignClass} ${maxWidth}`}>
                                {qrUrl && <QrCode path={qrUrl} size={200} alt="QR Code" />}
                            </div>
                        );
                    }

                    default:
                        return null;
                }
            })}
        </div>
    );
}
