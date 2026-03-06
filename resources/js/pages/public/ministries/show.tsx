import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { stripHtml } from '@/lib/utils';

type MinistryData = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    body: string | null;
    cover_url: string | null;
    leader: { id: number; name: string } | null;
    meeting_schedule: string | null;
    meeting_location: string | null;
};

type GroupData = {
    id: number;
    name: string;
    description: string | null;
    meeting_day: string | null;
    meeting_time: string | null;
    meeting_location: string | null;
    max_members: number | null;
    is_full: boolean;
    available_spots: number | null;
    group_members_count: number;
};

type Props = {
    ministry: { data: MinistryData };
    groups: { data: GroupData[] };
};

export default function MinistryShow({ ministry: { data: ministry }, groups }: Props) {
    const { auth } = usePage().props;
    const isLoggedIn = !!auth.user;

    const handleJoinMinistry = () => {
        router.post(`/ministries/${ministry.id}/join`);
    };

    const handleJoinGroup = (groupId: number) => {
        router.post(`/groups/${groupId}/join`);
    };

    return (
        <PublicLayout title={ministry.name}>
            <Head title={ministry.name}>
                <meta name="description" content={ministry.description ? stripHtml(ministry.description).substring(0, 160) : ''} />
                <meta property="og:title" content={ministry.name} />
                <meta property="og:description" content={ministry.description ? stripHtml(ministry.description).substring(0, 160) : ''} />
                <meta property="og:type" content="article" />
            </Head>

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <nav className="mb-6 text-sm text-muted-foreground">
                    <Link href="/ministries" className="hover:text-foreground">Ministries</Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{ministry.name}</span>
                </nav>

                <h1 className="text-3xl font-bold">{ministry.name}</h1>

                {ministry.leader && (
                    <p className="mt-2 text-muted-foreground">Led by {ministry.leader.name}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {ministry.meeting_schedule && (
                        <div className="flex items-center gap-1">
                            <CalendarDays className="size-4" />
                            {ministry.meeting_schedule}
                        </div>
                    )}
                    {ministry.meeting_location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="size-4" />
                            {ministry.meeting_location}
                        </div>
                    )}
                </div>

                {isLoggedIn && (
                    <div className="mt-6">
                        <Button onClick={handleJoinMinistry}>Join This Ministry</Button>
                    </div>
                )}

                {ministry.description && (
                    <div className="mt-6 prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: ministry.description }} />
                )}

                {ministry.body && (
                    <div className="mt-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: ministry.body }} />
                )}

                {groups.data.length > 0 && (
                    <div className="mt-10">
                        <h2 className="mb-4 text-xl font-semibold">Small Groups</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {groups.data.map((group) => (
                                <Card key={group.id}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">{group.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {group.description && (
                                            <p className="text-sm text-muted-foreground">{group.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            {group.meeting_day && <Badge variant="outline">{group.meeting_day}</Badge>}
                                            {group.meeting_time && <Badge variant="outline">{group.meeting_time}</Badge>}
                                            {group.meeting_location && (
                                                <Badge variant="outline">
                                                    <MapPin className="mr-1 size-3" />
                                                    {group.meeting_location}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Users className="size-3.5" />
                                                {group.group_members_count} members
                                                {group.max_members && ` / ${group.max_members}`}
                                            </span>
                                            {isLoggedIn && !group.is_full && (
                                                <Button size="sm" variant="outline" onClick={() => handleJoinGroup(group.id)}>
                                                    Join
                                                </Button>
                                            )}
                                            {group.is_full && <Badge variant="destructive">Full</Badge>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
