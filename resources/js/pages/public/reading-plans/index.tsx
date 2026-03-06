import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type PlanData = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    cover_url: string | null;
    duration_days: number;
    enrollments_count: number;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    plans: PaginatedData<PlanData>;
    filters: { search?: string };
};

export default function ReadingPlansIndex({ plans, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/reading-plans', { search: value || undefined }, { preserveState: true, replace: true });
    };

    return (
        <PublicLayout title="Reading Plans">
            <Head title="Reading Plans" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Reading Plans</h1>
                    <p className="mt-2 text-muted-foreground">
                        Grow your faith with structured daily Bible reading plans.
                    </p>
                </div>

                <div className="mb-8">
                    <Input
                        placeholder="Search reading plans..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="max-w-md"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {plans.data.map((plan) => (
                        <Link key={plan.id} href={`/reading-plans/${plan.slug}`} className="group">
                            <Card className="h-full transition-shadow group-hover:shadow-lg">
                                {plan.cover_url && (
                                    <div className="aspect-video overflow-hidden rounded-t-lg">
                                        <img
                                            src={plan.cover_url}
                                            alt={plan.title}
                                            className="size-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="line-clamp-2 text-lg">{plan.title}</CardTitle>
                                    {plan.description && (
                                        <CardDescription className="line-clamp-2">
                                            {plan.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="size-3.5" />
                                            {plan.duration_days} days
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="size-3.5" />
                                            {plan.enrollments_count} enrolled
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {plans.data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <BookOpen className="mb-3 size-10" />
                        <p>No reading plans available yet. Check back soon!</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
