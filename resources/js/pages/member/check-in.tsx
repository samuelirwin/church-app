import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Person = {
    id: number;
    full_name: string;
    is_self: boolean;
    checked_in: boolean;
};

type Props = {
    session: {
        token: string;
        title: string;
        source_label: string;
        occurred_on: string;
        is_open: boolean;
    };
    people: Person[];
};

export default function CheckIn({ session, people }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Check In', href: `/check-in/${session.token}` },
    ];

    // Pre-select everyone who isn't checked in yet, so a family can check in with one tap.
    const { data, setData, post, processing, errors, setError } = useForm({
        member_ids: people.filter((p) => !p.checked_in).map((p) => p.id),
    });

    const allCheckedIn = people.every((p) => p.checked_in);

    const toggle = (id: number) => {
        setData(
            'member_ids',
            data.member_ids.includes(id)
                ? data.member_ids.filter((m) => m !== id)
                : [...data.member_ids, id],
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.member_ids.length === 0) {
            setError('member_ids', 'Choose at least one person to check in.');
            return;
        }
        post(`/check-in/${session.token}`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Check In" />

            <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{session.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {session.source_label} &middot;{' '}
                            {new Date(session.occurred_on).toLocaleDateString(
                                undefined,
                                { dateStyle: 'full' },
                            )}
                        </p>
                    </CardHeader>
                    <CardContent>
                        {!session.is_open ? (
                            <p className="text-sm text-muted-foreground">
                                Check-in for this session is closed. It only
                                opens on the day.
                            </p>
                        ) : allCheckedIn ? (
                            <div className="flex flex-col items-center gap-2 py-6 text-center">
                                <CheckCircle2 className="size-12 text-green-600" />
                                <p className="font-medium">
                                    You're all checked in. Welcome!
                                </p>
                            </div>
                        ) : (
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-4"
                                noValidate
                            >
                                <p className="text-sm text-muted-foreground">
                                    Who's here today?
                                </p>
                                <ul className="space-y-2">
                                    {people.map((person) => (
                                        <li key={person.id}>
                                            <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                                                <input
                                                    type="checkbox"
                                                    className="size-5 rounded border-input"
                                                    checked={
                                                        person.checked_in ||
                                                        data.member_ids.includes(
                                                            person.id,
                                                        )
                                                    }
                                                    disabled={person.checked_in}
                                                    onChange={() =>
                                                        toggle(person.id)
                                                    }
                                                />
                                                <span className="flex-1 font-medium">
                                                    {person.full_name}
                                                    {person.is_self && (
                                                        <span className="text-muted-foreground">
                                                            {' '}
                                                            (you)
                                                        </span>
                                                    )}
                                                </span>
                                                {person.checked_in && (
                                                    <span className="text-xs text-green-600">
                                                        Checked in
                                                    </span>
                                                )}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                                <InputError message={errors.member_ids} />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={processing}
                                >
                                    Check In
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
