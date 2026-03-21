import { Head, Link } from '@inertiajs/react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

type MinistryItem = {
    id: number;
    ministry_id: number;
    name: string;
    slug: string;
    description: string | null;
    role: string;
    joined_at: string;
    leader_name: string | null;
    meeting_schedule: string | null;
    meeting_location: string | null;
    cover_url: string | null;
    group_count: number;
};

type GroupItem = {
    id: number;
    group_name: string;
    ministry_name: string;
    ministry_slug: string;
    joined_at: string;
};

type Props = {
    ministries: MinistryItem[];
    groups: GroupItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Ministries', href: '/my-ministries' },
];

export default function MyMinistries({ ministries, groups }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Ministries" />

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">My Ministries</h1>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/ministries">Browse All</Link>
                    </Button>
                </div>

                {ministries.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="mb-4 text-muted-foreground">You haven't joined any ministries yet.</p>
                            <Button asChild>
                                <Link href="/ministries">Explore Ministries</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {ministries.map((ministry) => (
                            <Card key={ministry.id} className="overflow-hidden">
                                {ministry.cover_url && (
                                    <div className="h-32 w-full overflow-hidden">
                                        <img
                                            src={ministry.cover_url}
                                            alt={ministry.name}
                                            className="size-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">
                                                <Link
                                                    href={`/ministries/${ministry.slug}`}
                                                    className="hover:underline"
                                                >
                                                    {ministry.name}
                                                </Link>
                                            </CardTitle>
                                            {ministry.description && (
                                                <CardDescription className="mt-1 line-clamp-2">
                                                    {ministry.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <Badge variant="secondary">{ministry.role}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    {ministry.leader_name && (
                                        <div className="flex items-center gap-2">
                                            <Users className="size-3.5" />
                                            <span>Led by {ministry.leader_name}</span>
                                        </div>
                                    )}
                                    {ministry.meeting_schedule && (
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="size-3.5" />
                                            <span>{ministry.meeting_schedule}</span>
                                        </div>
                                    )}
                                    {ministry.meeting_location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-3.5" />
                                            <span>{ministry.meeting_location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between pt-2 text-xs">
                                        <span>Joined {new Date(ministry.joined_at).toLocaleDateString()}</span>
                                        {ministry.group_count > 0 && (
                                            <span>{ministry.group_count} group{ministry.group_count !== 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {groups.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-lg font-semibold">My Groups</h2>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ministry</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {groups.map((group) => (
                                        <tr key={group.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{group.group_name}</td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/ministries/${group.ministry_slug}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {group.ministry_name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(group.joined_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
