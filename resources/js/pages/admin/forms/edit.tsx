import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormEditorPanel } from '@/components/admin/form-builder/form-editor-panel';
import { FormPreviewPanel } from '@/components/admin/form-builder/form-preview-panel';
import { useFormBuilder } from '@/hooks/use-form-builder';
import type { BreadcrumbItem } from '@/types';
import type { FormData, FormField } from '@/types/forms';
import { createEmptyField } from '@/types/forms';

type Props = { form: { data: FormData } };

export default function FormEdit({ form: { data: formData } }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/forms' },
        { title: 'Forms', href: '/admin/forms' },
        { title: formData.title, href: `/admin/forms/${formData.slug}/edit` },
    ];

    const expiresDate = formData.expires_at
        ? new Date(formData.expires_at).toISOString().slice(0, 16)
        : '';

    const { data, setData, put, processing, errors, hasErrors, transform } = useForm({
        title: formData.title,
        description: formData.description ?? '',
        fields: formData.fields.length > 0 ? formData.fields : [createEmptyField()],
        settings: {
            confirmation_message: formData.settings?.confirmation_message ?? 'Thank you for your submission!',
            redirect_url: formData.settings?.redirect_url ?? '',
            scoring_enabled: formData.settings?.scoring_enabled ?? false,
            show_results: formData.settings?.show_results ?? false,
            one_response_per_user: formData.settings?.one_response_per_user ?? false,
        },
        is_multi_step: formData.is_multi_step,
        is_published: formData.is_published,
        allows_anonymous: formData.allows_anonymous,
        expires_at: expiresDate,
        max_responses: formData.max_responses ? String(formData.max_responses) : '',
        notification_emails: formData.notification_emails?.length ? formData.notification_emails : [''],
    });

    transform((formData) => ({
        ...formData,
        notification_emails: formData.notification_emails.filter(Boolean),
        max_responses: formData.max_responses ? Number(formData.max_responses) : null,
    }));

    const [expandedFieldId, setExpandedFieldId] = useState<string | null>(
        data.fields[0]?.id ?? null,
    );

    const builder = useFormBuilder(data.fields, setData as (key: 'fields', value: FormField[]) => void);

    const handleAddField = (type: string) => {
        const newId = builder.addField(type);
        setExpandedFieldId(newId);
    };

    const handleDuplicateField = (index: number) => {
        const newId = builder.duplicateField(index);
        setExpandedFieldId(newId);
    };

    const toggleExpand = (fieldId: string) => {
        setExpandedFieldId(expandedFieldId === fieldId ? null : fieldId);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/forms/${formData.slug}`);
    };

    const editorPanel = (
        <FormEditorPanel
            title={data.title}
            description={data.description}
            fields={data.fields}
            settings={data.settings}
            isPublished={data.is_published}
            allowsAnonymous={data.allows_anonymous}
            expiresAt={data.expires_at}
            maxResponses={data.max_responses}
            notificationEmails={data.notification_emails}
            errors={errors as Record<string, string>}
            hasErrors={hasErrors}
            expandedFieldId={expandedFieldId}
            onToggleExpand={toggleExpand}
            onSetTitle={(v) => setData('title', v)}
            onSetDescription={(v) => setData('description', v)}
            onSetSettings={(v) => setData('settings', v)}
            onSetIsPublished={(v) => setData('is_published', v)}
            onSetAllowsAnonymous={(v) => setData('allows_anonymous', v)}
            onSetExpiresAt={(v) => setData('expires_at', v)}
            onSetMaxResponses={(v) => setData('max_responses', v)}
            onSetNotificationEmails={(v) => setData('notification_emails', v)}
            onAddField={handleAddField}
            onMoveField={builder.moveField}
            onUpdateField={builder.updateField}
            onRemoveField={builder.removeField}
            onDuplicateField={handleDuplicateField}
            onAddOption={builder.addOption}
            onRemoveOption={builder.removeOption}
            onUpdateOption={builder.updateOption}
        />
    );

    const previewPanel = (
        <FormPreviewPanel
            title={data.title}
            description={data.description}
            fields={data.fields}
        />
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Form: ${formData.title}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/forms" className="text-sm text-muted-foreground hover:text-foreground">
                        &larr; Back to Forms
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit Form</h1>
                    <p className="text-sm text-muted-foreground">Update form fields and settings.</p>
                </div>

                {/* Desktop: side-by-side layout */}
                <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
                    <form onSubmit={handleSubmit} className="col-span-3 space-y-6">
                        {editorPanel}
                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Update Form'}
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/admin/forms">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                    <div className="col-span-2">
                        <div className="sticky top-4">
                            <p className="mb-2 text-sm font-medium text-muted-foreground">Live Preview</p>
                            {previewPanel}
                        </div>
                    </div>
                </div>

                {/* Mobile: tabbed layout */}
                <div className="lg:hidden">
                    <Tabs defaultValue="editor">
                        <TabsList>
                            <TabsTrigger value="editor">Editor</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="editor">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {editorPanel}
                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : 'Update Form'}
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href="/admin/forms">Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                        <TabsContent value="preview">
                            {previewPanel}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
