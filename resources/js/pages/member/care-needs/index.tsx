import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { careStatusColors } from '@/types/care-needs';
import type { Option } from '@/types/members';

type MyCareNeed = {
    id: number;
    title: string;
    type_label: string;
    status: string;
    status_label: string;
    person_name: string;
    share_on_prayer_wall: boolean;
    created_at: string;
};

type Props = {
    careNeeds: MyCareNeed[];
    household: Array<{ id: number; full_name: string; is_self: boolean }>;
    types: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Care Needs', href: '/my-care-needs' },
];

export default function MyCareNeeds({ careNeeds, household, types }: Props) {
    const self = household.find((p) => p.is_self);

    const { data, setData, post, processing, errors, setError, clearErrors } =
        useForm({
            member_id: self ? String(self.id) : '',
            type: '',
            title: '',
            description: '',
            is_confidential: false,
            share_on_prayer_wall: false,
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        const clientErrors: Record<string, string> = {};
        if (!data.type) {
            clientErrors.type = 'Choose what kind of help you need.';
        }
        if (!data.title.trim()) {
            clientErrors.title = 'Give your request a short title.';
        }
        if (Object.keys(clientErrors).length > 0) {
            setError(clientErrors as Record<keyof typeof data, string>);
            return;
        }
        post('/my-care-needs', {
            preserveScroll: true,
            onSuccess: () =>
                setData({
                    ...data,
                    type: '',
                    title: '',
                    description: '',
                    is_confidential: false,
                    share_on_prayer_wall: false,
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Care Needs" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">My Care Needs</h1>
                        <p className="text-sm text-muted-foreground">
                            Let the care team know how we can pray for you or
                            help.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/prayer-wall">Prayer Wall</Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ask for Help</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-4"
                                noValidate
                            >
                                {household.length > 1 && (
                                    <div className="space-y-2">
                                        <Label htmlFor="member_id">
                                            Who is this for?
                                        </Label>
                                        <Select
                                            value={data.member_id}
                                            onValueChange={(v) =>
                                                setData('member_id', v)
                                            }
                                        >
                                            <SelectTrigger id="member_id">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {household.map((p) => (
                                                    <SelectItem
                                                        key={p.id}
                                                        value={String(p.id)}
                                                    >
                                                        {p.full_name}
                                                        {p.is_self
                                                            ? ' (me)'
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.member_id}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="type">
                                        What kind of help? *
                                    </Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(v) =>
                                            setData('type', v)
                                        }
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Choose one" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map((t) => (
                                                <SelectItem
                                                    key={t.value}
                                                    value={t.value}
                                                >
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Short title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData('title', e.target.value)
                                        }
                                        placeholder="e.g. Surgery on Friday"
                                    />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Anything else we should know?
                                    </Label>
                                    <Textarea
                                        id="description"
                                        rows={4}
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={errors.description} />
                                </div>
                                <label className="flex items-start gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 size-4 rounded border-input"
                                        checked={data.is_confidential}
                                        onChange={(e) =>
                                            setData({
                                                ...data,
                                                is_confidential:
                                                    e.target.checked,
                                                share_on_prayer_wall: e.target
                                                    .checked
                                                    ? false
                                                    : data.share_on_prayer_wall,
                                            })
                                        }
                                    />
                                    <span>
                                        Keep this private (only pastors and
                                        admins will see it)
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 size-4 rounded border-input"
                                        checked={data.share_on_prayer_wall}
                                        disabled={data.is_confidential}
                                        onChange={(e) =>
                                            setData(
                                                'share_on_prayer_wall',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <span>
                                        Share the title on the members' prayer
                                        wall (first name only)
                                    </span>
                                </label>
                                <Button type="submit" disabled={processing}>
                                    Send Request
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {careNeeds.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    You haven't made any requests yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-border text-sm">
                                    {careNeeds.map((need) => (
                                        <li
                                            key={need.id}
                                            className="flex items-start justify-between gap-2 py-3"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {need.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {need.type_label} &middot;
                                                    for {need.person_name}{' '}
                                                    &middot;{' '}
                                                    {new Date(
                                                        need.created_at,
                                                    ).toLocaleDateString()}
                                                    {need.share_on_prayer_wall &&
                                                        ' · on prayer wall'}
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${careStatusColors[need.status] ?? ''}`}
                                            >
                                                {need.status_label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
