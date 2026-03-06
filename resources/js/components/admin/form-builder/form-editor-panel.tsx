import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { FormSection } from '@/components/admin/form-section';
import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichEditor } from '@/components/admin/rich-editor';
import { FieldPalette } from './field-palette';
import { SortableFieldList } from './sortable-field-list';
import type { FormField, FieldOption, FormSettings } from '@/types/forms';

type FormEditorPanelProps = {
    title: string;
    description: string;
    fields: FormField[];
    settings: FormSettings;
    isPublished: boolean;
    allowsAnonymous: boolean;
    expiresAt: string;
    maxResponses: string;
    notificationEmails: string[];
    errors: Record<string, string>;
    hasErrors: boolean;
    expandedFieldId: string | null;
    onToggleExpand: (fieldId: string) => void;
    onSetTitle: (value: string) => void;
    onSetDescription: (value: string) => void;
    onSetSettings: (value: FormSettings) => void;
    onSetIsPublished: (value: boolean) => void;
    onSetAllowsAnonymous: (value: boolean) => void;
    onSetExpiresAt: (value: string) => void;
    onSetMaxResponses: (value: string) => void;
    onSetNotificationEmails: (value: string[]) => void;
    onAddField: (type: string) => void;
    onMoveField: (oldIndex: number, newIndex: number) => void;
    onUpdateField: (index: number, key: keyof FormField, value: unknown) => void;
    onRemoveField: (index: number) => void;
    onDuplicateField: (index: number) => void;
    onAddOption: (fieldIndex: number) => void;
    onRemoveOption: (fieldIndex: number, optionIndex: number) => void;
    onUpdateOption: (fieldIndex: number, optionIndex: number, updates: Partial<FieldOption>) => void;
};

export function FormEditorPanel({
    title,
    description,
    fields,
    settings,
    isPublished,
    allowsAnonymous,
    expiresAt,
    maxResponses,
    notificationEmails,
    errors,
    hasErrors,
    expandedFieldId,
    onToggleExpand,
    onSetTitle,
    onSetDescription,
    onSetSettings,
    onSetIsPublished,
    onSetAllowsAnonymous,
    onSetExpiresAt,
    onSetMaxResponses,
    onSetNotificationEmails,
    onAddField,
    onMoveField,
    onUpdateField,
    onRemoveField,
    onDuplicateField,
    onAddOption,
    onRemoveOption,
    onUpdateOption,
}: FormEditorPanelProps) {
    const detailsKeys = ['title', 'description'];
    const fieldKeys = Object.keys(errors).filter((k) => k === 'fields' || k.startsWith('fields.'));
    const settingsKeys = ['expires_at', 'max_responses', 'notification_emails'];

    const hasDetailsErrors = useMemo(() => detailsKeys.some((k) => errors[k]), [errors]);
    const hasFieldErrors = useMemo(() => fieldKeys.length > 0, [errors]);
    const hasSettingsErrors = useMemo(() => settingsKeys.some((k) => errors[k]) || Object.keys(errors).some((k) => k.startsWith('notification_emails.')), [errors]);

    const errorDot = <span className="ml-1 inline-block size-2 rounded-full bg-red-500" />;

    return (
        <Tabs defaultValue="details">
            {hasErrors && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        Please fix the errors below before saving. Check each tab for details.
                    </AlertDescription>
                </Alert>
            )}

            <TabsList>
                <TabsTrigger value="details">
                    Details{hasDetailsErrors && errorDot}
                </TabsTrigger>
                <TabsTrigger value="fields">
                    Form Builder ({fields.length}){hasFieldErrors && errorDot}
                </TabsTrigger>
                <TabsTrigger value="settings">
                    Settings{hasSettingsErrors && errorDot}
                </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details">
                <FormSection title="Form Details" description="Title and description.">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => onSetTitle(e.target.value)}
                        />
                        <InputError message={errors.title} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <RichEditor
                            id="description"
                            value={description}
                            onChange={(html) => onSetDescription(html)}
                            error={errors.description}
                        />
                    </div>
                </FormSection>
            </TabsContent>

            {/* Fields Tab */}
            <TabsContent value="fields">
                <div className="space-y-4">
                    <FormSection title="Add Field" description="Click a field type to add it to your form.">
                        <FieldPalette onAddField={onAddField} />
                    </FormSection>

                    <FormSection title="Fields" description="Drag to reorder. Click to expand.">
                        <InputError message={errors.fields} />
                        <SortableFieldList
                            fields={fields}
                            scoringEnabled={settings.scoring_enabled}
                            errors={errors}
                            expandedFieldId={expandedFieldId}
                            onToggleExpand={onToggleExpand}
                            onMoveField={onMoveField}
                            onUpdateField={onUpdateField}
                            onRemoveField={onRemoveField}
                            onDuplicateField={onDuplicateField}
                            onAddOption={onAddOption}
                            onRemoveOption={onRemoveOption}
                            onUpdateOption={onUpdateOption}
                        />
                    </FormSection>
                </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
                <FormSection title="Settings" description="Submission limits, notifications, and scoring.">
                    <div className="space-y-2">
                        <Label htmlFor="confirmation_message">Confirmation Message</Label>
                        <Input
                            id="confirmation_message"
                            value={settings.confirmation_message}
                            onChange={(e) => onSetSettings({ ...settings, confirmation_message: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="expires_at">Expires At</Label>
                            <Input
                                id="expires_at"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => onSetExpiresAt(e.target.value)}
                            />
                            <InputError message={errors.expires_at} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_responses">Max Responses</Label>
                            <Input
                                id="max_responses"
                                type="number"
                                min={1}
                                value={maxResponses}
                                onChange={(e) => onSetMaxResponses(e.target.value)}
                                placeholder="Unlimited"
                            />
                            <InputError message={errors.max_responses} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) => onSetIsPublished(e.target.checked)}
                                className="size-4 rounded border-input"
                            />
                            <Label>Published</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={allowsAnonymous}
                                onChange={(e) => onSetAllowsAnonymous(e.target.checked)}
                                className="size-4 rounded border-input"
                            />
                            <Label>Allow Anonymous Submissions</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={settings.one_response_per_user}
                                onChange={(e) => onSetSettings({ ...settings, one_response_per_user: e.target.checked })}
                                className="size-4 rounded border-input"
                            />
                            <Label>One Response Per User</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={settings.scoring_enabled}
                                onChange={(e) => onSetSettings({ ...settings, scoring_enabled: e.target.checked })}
                                className="size-4 rounded border-input"
                            />
                            <Label>Enable Scoring</Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Notification Emails</Label>
                        {notificationEmails.map((email, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        const updated = [...notificationEmails];
                                        updated[i] = e.target.value;
                                        onSetNotificationEmails(updated);
                                    }}
                                    placeholder="email@example.com"
                                />
                                {notificationEmails.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onSetNotificationEmails(notificationEmails.filter((_, idx) => idx !== i))}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onSetNotificationEmails([...notificationEmails, ''])}
                        >
                            Add Email
                        </Button>
                    </div>
                </FormSection>
            </TabsContent>
        </Tabs>
    );
}
