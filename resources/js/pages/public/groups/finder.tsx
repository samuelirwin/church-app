import { Head, Link, router, usePage } from '@inertiajs/react';
import { MapPin, Search, Users } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/layouts/public-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type GroupData = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    meeting_day: string | null;
    meeting_time: string | null;
    meeting_location: string | null;
    max_members: number | null;
    is_full: boolean;
    available_spots: number | null;
    group_members_count: number;
    ministry: { id: number; name: string } | null;
    leader: { id: number; name: string } | null;
};

type PaginatedData<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    groups: PaginatedData<GroupData>;
    filters: { meeting_day?: string; location?: string; available_only?: string };
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function GroupFinder({ groups, filters }: Props) {
    const { auth } = usePage().props;
    const [location, setLocation] = useState(filters.location ?? '');

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        router.get('/groups/finder', newFilters, { preserveState: true, replace: true });
    };

    const handleLocationSearch = (value: string) => {
        setLocation(value);
        router.get('/groups/finder', { ...filters, location: value || undefined }, { preserveState: true, replace: true });
    };

    const handleJoinGroup = (groupId: number) => {
        router.post(`/groups/${groupId}/join`);
    };

    return (
        <PublicLayout title="Group Finder">
            <Head title="Group Finder" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Find a Small Group</h1>
                    <p className="mt-2 text-muted-foreground">Connect with others in a small group that fits your schedule.</p>
                </div>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row">
                    <Select onValueChange={(v) => handleFilter('meeting_day', v)} defaultValue={filters.meeting_day ?? 'all'}>
                        <SelectTrigger className="sm:w-[180px]">
                            <SelectValue placeholder="Meeting Day" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Day</SelectItem>
                            {days.map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by location..."
                            value={location}
                            onChange={(e) => handleLocationSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="available_only"
                            type="checkbox"
                            checked={filters.available_only === '1'}
                            onChange={(e) => handleFilter('available_only', e.target.checked ? '1' : 'all')}
                            className="size-4 rounded border-input"
                        />
                        <label htmlFor="available_only" className="text-sm">Available only</label>
                    </div>
                </div>

                {groups.data.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No groups found matching your criteria.</div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {groups.data.map((group) => (
                            <Card key={group.id} className="h-full">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{group.name}</CardTitle>
                                    {group.ministry && (
                                        <p className="text-sm text-muted-foreground">{group.ministry.name}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {group.description && (
                                        <p className="line-clamp-2 text-sm text-muted-foreground">{group.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
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
                                            {group.group_members_count}
                                            {group.max_members && ` / ${group.max_members}`}
                                        </span>
                                        {auth.user && !group.is_full ? (
                                            <Button size="sm" variant="outline" onClick={() => handleJoinGroup(group.id)}>
                                                Join
                                            </Button>
                                        ) : group.is_full ? (
                                            <Badge variant="destructive">Full</Badge>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
