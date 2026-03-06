import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentPreview } from '@/components/document-preview';
import { stripHtml } from '@/lib/utils';

type DocumentData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    visibility: string;
    visibility_label: string;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    file_mime_type: string | null;
    is_pdf: boolean;
    is_image: boolean;
    category: { id: number; name: string } | null;
    uploader: { id: number; name: string } | null;
    tags: string[];
    created_at: string;
    updated_at: string;
};

type Props = {
    document: { data: DocumentData };
};

export default function DocumentShow({ document: { data: doc } }: Props) {
    const metaDescription = doc.description ? stripHtml(doc.description).substring(0, 160) : '';

    return (
        <PublicLayout title={doc.title}>
            <Head title={doc.title}>
                <meta name="description" content={metaDescription} />
                <meta property="og:title" content={doc.title} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:type" content="article" />
            </Head>

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/documents" className="hover:text-foreground">Documents</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{doc.title}</span>
                </nav>

                <div className="mb-4 flex flex-wrap gap-2">
                    {doc.category && <Badge variant="outline">{doc.category.name}</Badge>}
                    {doc.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>

                <h1 className="text-3xl font-bold">{doc.title}</h1>

                {doc.uploader && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Uploaded by {doc.uploader.name}
                    </p>
                )}

                {doc.description && (
                    <div className="mt-6">
                        <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: doc.description }} />
                    </div>
                )}

                {doc.file_url && doc.file_name && doc.file_size && doc.file_mime_type && (
                    <div className="mt-8">
                        <DocumentPreview
                            fileUrl={doc.file_url}
                            fileName={doc.file_name}
                            fileSize={doc.file_size}
                            mimeType={doc.file_mime_type}
                            isPdf={doc.is_pdf}
                            isImage={doc.is_image}
                        />
                    </div>
                )}

                <Card className="mt-8">
                    <CardContent className="p-4">
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="font-medium text-muted-foreground">Uploaded</dt>
                                <dd>{new Date(doc.created_at).toLocaleDateString()}</dd>
                            </div>
                            {doc.updated_at !== doc.created_at && (
                                <div>
                                    <dt className="font-medium text-muted-foreground">Last Updated</dt>
                                    <dd>{new Date(doc.updated_at).toLocaleDateString()}</dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>
            </div>
        </PublicLayout>
    );
}
