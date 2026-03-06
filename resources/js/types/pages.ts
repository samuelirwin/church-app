export type PageSection = {
    id: string;
    type: string;
    alignment: string;
    data: Record<string, unknown>;
};

export type PageData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    redirect_url: string | null;
    layout: string;
    sections: PageSection[] | null;
    cover_urls: string[];
    cover_media?: Array<{ id: number; url: string }>;
    category: { id: number; name: string; slug: string } | null;
    creator: { id: number; name: string } | null;
    tags: string[];
    page_url?: string;
    is_published: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

export const SECTION_TYPES = [
    { value: 'rich_text', label: 'Rich Text' },
    { value: 'form_embed', label: 'Form Embed' },
    { value: 'image', label: 'Image' },
    { value: 'call_to_action', label: 'Call to Action' },
    { value: 'video_embed', label: 'Video Embed' },
    { value: 'qr_code', label: 'QR Code' },
] as const;

export const PAGE_LAYOUTS = [
    { value: 'full_width', label: 'Full Width' },
    { value: 'sidebar_right', label: 'Sidebar Right' },
    { value: 'sidebar_left', label: 'Sidebar Left' },
    { value: 'two_column', label: 'Two Column' },
    { value: 'landing', label: 'Landing Page' },
] as const;

export const SECTION_ALIGNMENTS = [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'center', label: 'Center' },
    { value: 'full', label: 'Full Width' },
] as const;

export function generateSectionId(): string {
    return crypto.randomUUID();
}

export function createEmptySection(type: string = 'rich_text'): PageSection {
    const base = {
        id: generateSectionId(),
        type,
        alignment: 'full',
    };

    const dataMap: Record<string, Record<string, unknown>> = {
        rich_text: { content: '' },
        form_embed: { form_id: null, heading: '' },
        image: { alt_text: '', caption: '' },
        call_to_action: { heading: '', body: '', button_label: '', button_url: '' },
        video_embed: { url: '' },
        qr_code: { url_mode: 'page', custom_url: '' },
    };

    return { ...base, data: dataMap[type] ?? {} };
}
