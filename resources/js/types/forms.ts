export type FieldOption = {
    label: string;
    value: string;
    correct?: boolean;
};

export type FormField = {
    id: string;
    type: string;
    label: string;
    placeholder: string;
    required: boolean;
    options: FieldOption[];
    points: number;
    step: number;
};

export type FormSettings = {
    confirmation_message: string;
    redirect_url: string | null;
    scoring_enabled: boolean;
    show_results: boolean;
    one_response_per_user: boolean;
};

export type FormData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    fields: FormField[];
    settings: FormSettings;
    is_multi_step: boolean;
    is_published: boolean;
    allows_anonymous: boolean;
    expires_at: string | null;
    max_responses: number | null;
    notification_emails: string[] | null;
};

export const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'rating', label: 'Rating' },
    { value: 'scale', label: 'Scale' },
] as const;

export function generateFieldId(): string {
    return crypto.randomUUID();
}

export function createEmptyField(): FormField {
    return {
        id: generateFieldId(),
        type: 'text',
        label: '',
        placeholder: '',
        required: false,
        options: [],
        points: 0,
        step: 1,
    };
}

export function hasFieldOptions(type: string): boolean {
    return ['select', 'radio', 'checkbox'].includes(type);
}
