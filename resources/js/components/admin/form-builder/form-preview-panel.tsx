import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FieldPreviewRenderer } from './field-preview-renderer';
import type { FormField } from '@/types/forms';

type FormPreviewPanelProps = {
    title: string;
    description: string;
    fields: FormField[];
};

/**
 * Renders a live preview of the form as it will appear to respondents.
 * Sits outside the <form> element so disabled inputs don't interfere with submission.
 */
export function FormPreviewPanel({ title, description, fields }: FormPreviewPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title || 'Untitled Form'}</CardTitle>
                {description && (
                    <p
                        className="text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                )}
            </CardHeader>
            <CardContent className="space-y-5">
                {fields.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Add fields to see them here
                    </p>
                ) : (
                    fields.map((field) => (
                        <FieldPreviewRenderer key={field.id} field={field} />
                    ))
                )}
                <div className="pt-2">
                    <Button disabled className="disabled:cursor-default disabled:opacity-60">
                        Submit
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
