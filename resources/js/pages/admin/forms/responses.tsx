import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { ExportDropdown } from '@/components/admin/export-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type FormField = {
    id: string;
    type: string;
    label: string;
};

type FormData = {
    id: number;
    title: string;
    slug: string;
    fields: FormField[];
    settings: { scoring_enabled?: boolean };
    responses_count: number;
};

type ResponseData = {
    id: number;
    user: { id: number; name: string; email: string } | null;
    answers: Record<string, unknown>;
    score: number | null;
    ip_address: string | null;
    submitted_at: string;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    form: { data: FormData };
    responses: PaginatedData<ResponseData>;
};

export default function FormResponses({ form: { data: form }, responses }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/forms' },
        { title: 'Forms', href: '/admin/forms' },
        { title: form.title, href: `/admin/forms/${form.slug}/edit` },
        { title: 'Responses', href: `/admin/forms/${form.slug}/responses` },
    ];

    const formatAnswer = (value: unknown): string => {
        if (value === null || value === undefined) return '—';
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Responses: ${form.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/forms">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{form.title}</h1>
                            <p className="text-sm text-muted-foreground">{form.responses_count} responses</p>
                        </div>
                    </div>
                    <ExportDropdown baseUrl={`/admin/exports/forms/${form.id}/responses`} />
                </div>

                {responses.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No responses yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {responses.data.map((response) => (
                            <Card key={response.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">
                                            {response.user ? response.user.name : 'Anonymous'}
                                            {response.user && (
                                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                                    {response.user.email}
                                                </span>
                                            )}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {form.settings.scoring_enabled && response.score !== null && (
                                                <Badge variant="outline">Score: {response.score}%</Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(response.submitted_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid gap-2 sm:grid-cols-2">
                                        {form.fields.map((field) => (
                                            <div key={field.id} className="space-y-1">
                                                <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
                                                <dd className="text-sm">{formatAnswer(response.answers[field.id])}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
