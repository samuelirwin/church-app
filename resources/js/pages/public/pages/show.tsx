import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { HeroCarousel } from '@/components/public/hero-carousel';
import { SectionRenderer } from '@/components/public/section-renderer';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { stripHtml } from '@/lib/utils';
import type { PageData } from '@/types/pages';

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

type Props = {
    page: { data: PageData };
    embeddedForms: Record<number, EmbeddedForm>;
    pageUrl: string;
};

export default function PageShow({ page: { data: page }, embeddedForms, pageUrl }: Props) {
    const hasCover = page.cover_urls && page.cover_urls.length > 0;
    const description = page.description ? stripHtml(page.description).substring(0, 160) : '';

    return (
        <PublicLayout title={page.title}>
            <Head title={page.title}>
                {description && <meta name="description" content={description} />}
                <meta property="og:title" content={page.title} />
                {description && <meta property="og:description" content={description} />}
                <meta property="og:type" content="website" />
            </Head>

            {/* Hero / Cover */}
            {hasCover ? (
                <HeroCarousel
                    images={page.cover_urls}
                    title={page.title}
                    description={page.description ? stripHtml(page.description) : null}
                />
            ) : (
                <div className="bg-muted/50 py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold sm:text-4xl">{page.title}</h1>
                        {page.description && (
                            <div
                                className="prose prose-sm mt-3 max-w-none text-muted-foreground"
                                dangerouslySetInnerHTML={{ __html: page.description }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Content Sections */}
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {page.sections && page.sections.length > 0 && (
                    <SectionRenderer
                        sections={page.sections}
                        embeddedForms={embeddedForms}
                        pageUrl={pageUrl}
                    />
                )}

                {/* Tags */}
                {page.tags && page.tags.length > 0 && (
                    <div className="mt-12 border-t pt-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Tag className="size-4 text-muted-foreground" />
                            {page.tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
