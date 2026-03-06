import type { PageSection } from '@/types/pages';
import { SECTION_TYPES, SECTION_ALIGNMENTS } from '@/types/pages';

type PagePreviewProps = {
    title: string;
    description: string;
    layout: string;
    sections: PageSection[];
    coverUrls: string[];
};

function SectionPreview({ section }: { section: PageSection }) {
    const typeLabel = SECTION_TYPES.find((st) => st.value === section.type)?.label ?? section.type;

    const alignmentClass = {
        left: 'text-left',
        right: 'text-right',
        center: 'text-center mx-auto',
        full: 'w-full',
    }[section.alignment] ?? '';

    switch (section.type) {
        case 'rich_text':
            return (
                <div className={alignmentClass}>
                    {(section.data.content as string) ? (
                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: section.data.content as string }}
                        />
                    ) : (
                        <p className="italic text-muted-foreground">Rich text content...</p>
                    )}
                </div>
            );

        case 'form_embed':
            return (
                <div className={`rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 ${alignmentClass}`}>
                    {(section.data.heading as string) && (
                        <p className="mb-1 font-medium">{section.data.heading as string}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        [Embedded Form{section.data.form_id ? ` #${section.data.form_id}` : ''}]
                    </p>
                </div>
            );

        case 'image':
            return (
                <div className={alignmentClass}>
                    {(section.data.url as string) ? (
                        <figure>
                            <img
                                src={section.data.url as string}
                                alt={(section.data.alt_text as string) ?? ''}
                                className="max-h-48 rounded-lg object-cover"
                            />
                            {(section.data.caption as string) && (
                                <figcaption className="mt-1 text-xs text-muted-foreground">
                                    {section.data.caption as string}
                                </figcaption>
                            )}
                        </figure>
                    ) : (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground">Image placeholder</p>
                        </div>
                    )}
                </div>
            );

        case 'call_to_action':
            return (
                <div className={`rounded-lg bg-primary/10 p-4 ${alignmentClass}`}>
                    <p className="text-lg font-bold">
                        {(section.data.heading as string) || 'CTA Heading'}
                    </p>
                    {(section.data.body as string) && (
                        <div
                            className="prose prose-sm mt-1 max-w-none"
                            dangerouslySetInnerHTML={{ __html: section.data.body as string }}
                        />
                    )}
                    {(section.data.button_label as string) && (
                        <span className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                            {section.data.button_label as string}
                        </span>
                    )}
                </div>
            );

        case 'video_embed':
            return (
                <div className={alignmentClass}>
                    {(section.data.url as string) ? (
                        <div className="aspect-video rounded-lg bg-muted">
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                Video: {section.data.url as string}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground">Video placeholder</p>
                        </div>
                    )}
                </div>
            );

        case 'qr_code':
            return (
                <div className={`rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center ${alignmentClass}`}>
                    <p className="text-sm text-muted-foreground">
                        [QR Code — {(section.data.url_mode as string) === 'custom' ? 'Custom URL' : 'Page URL'}]
                    </p>
                </div>
            );

        default:
            return (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    Unknown section: {typeLabel}
                </div>
            );
    }
}

export function PagePreview({ title, description, layout, sections, coverUrls }: PagePreviewProps) {
    return (
        <div className="overflow-hidden rounded-lg border bg-background">
            {/* Cover preview */}
            {coverUrls.length > 0 ? (
                <div className="relative h-32 overflow-hidden">
                    <img
                        src={coverUrls[0]}
                        alt="Cover"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white">
                        <p className="text-sm font-bold">{title || 'Page Title'}</p>
                    </div>
                    {coverUrls.length > 1 && (
                        <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                            {coverUrls.length} slides
                        </span>
                    )}
                </div>
            ) : (
                <div className="bg-muted/50 p-3">
                    <p className="text-sm font-bold">{title || 'Page Title'}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            )}

            {/* Sections preview */}
            <div className="space-y-3 p-3">
                {sections.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Add sections to see a preview
                    </p>
                ) : (
                    sections.map((section) => (
                        <SectionPreview key={section.id} section={section} />
                    ))
                )}
            </div>

            {/* Layout indicator */}
            <div className="border-t bg-muted/30 px-3 py-1.5">
                <p className="text-[10px] text-muted-foreground">
                    Layout: {layout.replace('_', ' ')}
                </p>
            </div>
        </div>
    );
}
