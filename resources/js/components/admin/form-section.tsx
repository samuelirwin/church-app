import type { ReactNode } from 'react';

type FormSectionProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-base font-semibold">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="space-y-6">{children}</div>
        </div>
    );
}
