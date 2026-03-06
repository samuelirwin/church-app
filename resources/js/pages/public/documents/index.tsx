import { Head, Link, router } from '@inertiajs/react';
import { FileSpreadsheet, FileText, Image, Presentation, Search } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DocumentData = {
    id: number;
    title: string;
    slug: string;
    file_mime_type: string | null;
    is_pdf: boolean;
    is_image: boolean;
    thumbnail_url: string | null;
    category: { id: number; name: string } | null;
    created_at: string;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    documents: PaginatedData<DocumentData>;
    filters: { search?: string; category_id?: string };
    categories: Array<{ id: number; name: string }>;
};

function getFileIcon(doc: DocumentData) {
    if (doc.is_pdf) return <FileText className="size-10 text-red-500" />;
    if (doc.is_image) return <Image className="size-10 text-blue-500" />;
    if (doc.file_mime_type?.includes('spreadsheet') || doc.file_mime_type?.includes('excel')) {
        return <FileSpreadsheet className="size-10 text-green-600" />;
    }
    if (doc.file_mime_type?.includes('presentation') || doc.file_mime_type?.includes('powerpoint')) {
        return <Presentation className="size-10 text-orange-600" />;
    }
    return <FileText className="size-10 text-blue-600" />;
}

export default function DocumentsIndex({ documents, filters, categories }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/documents', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/documents', newFilters, { preserveState: true, replace: true });
    };

    return (
        <PublicLayout title="Documents">
            <Head title="Documents" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Documents</h1>
                    <p className="mt-2 text-muted-foreground">Browse and download documents shared by the church.</p>
                </div>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                    <div className="relative sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search documents..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select onValueChange={(v) => handleFilter('category_id', v)} defaultValue={filters.category_id ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {documents.data.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        No documents found matching your criteria.
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {documents.data.map((doc) => (
                                <Link key={doc.id} href={`/documents/${doc.slug}`}>
                                    <Card className="group h-full transition-shadow hover:shadow-md">
                                        <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                                            {doc.thumbnail_url ? (
                                                <img src={doc.thumbnail_url} alt={doc.title} className="size-full object-cover" />
                                            ) : (
                                                getFileIcon(doc)
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="line-clamp-2 font-medium group-hover:text-primary">{doc.title}</h3>
                                            <div className="mt-2 flex items-center gap-2">
                                                {doc.category && <Badge variant="outline" className="text-xs">{doc.category.name}</Badge>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>

                        {documents.links.length > 3 && (
                            <div className="mt-8 flex justify-center gap-1">
                                {documents.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </PublicLayout>
    );
}
