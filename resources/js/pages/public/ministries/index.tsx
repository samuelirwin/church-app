import { Head, Link, router } from '@inertiajs/react';
import { Search, Users } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type MinistryData = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    cover_url: string | null;
    meeting_schedule: string | null;
    ministry_members_count: number;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    ministries: PaginatedData<MinistryData>;
    filters: { search?: string };
};

export default function MinistriesIndex({ ministries, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/ministries', { search: value || undefined }, { preserveState: true, replace: true });
    };

    return (
        <PublicLayout title="Ministries">
            <Head title="Ministries" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Ministries</h1>
                    <p className="mt-2 text-muted-foreground">Get involved and serve with us in our church ministries.</p>
                </div>

                <div className="mb-8">
                    <div className="relative sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search ministries..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {ministries.data.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No ministries found.</div>
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {ministries.data.map((ministry) => (
                                <Link key={ministry.id} href={`/ministries/${ministry.slug}`}>
                                    <Card className="group h-full transition-shadow hover:shadow-md">
                                        <div className="flex aspect-video items-center justify-center bg-muted">
                                            {ministry.cover_url ? (
                                                <img src={ministry.cover_url} alt={ministry.name} className="size-full object-cover" />
                                            ) : (
                                                <Users className="size-12 text-muted-foreground/50" />
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="text-lg font-semibold group-hover:text-primary">{ministry.name}</h3>
                                            {ministry.description && (
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ministry.description}</p>
                                            )}
                                            <div className="mt-3 flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    <Users className="mr-1 size-3" />
                                                    {ministry.ministry_members_count} members
                                                </Badge>
                                                {ministry.meeting_schedule && (
                                                    <Badge variant="outline" className="text-xs">{ministry.meeting_schedule}</Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>

                        {ministries.links.length > 3 && (
                            <div className="mt-8 flex justify-center gap-1">
                                {ministries.links.map((link, i) => (
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
