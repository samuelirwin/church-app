import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem, User } from '@/types';

type RoleOption = {
    value: string;
    label: string;
};

type Props = {
    user: User;
    roles: RoleOption[];
};

export default function UserEdit({ user, roles }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/users' },
        { title: 'Users', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}/edit` },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        role: user.role,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/admin/users/${user.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit User: ${user.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Users</Link>
                    <h1 className="mt-2 text-2xl font-bold">Edit User Role</h1>
                    <p className="text-sm text-muted-foreground">Update the role for <strong>{user.name}</strong> ({user.email}).</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <FormSection title="Role Assignment" description="Choose the role for this user.">
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={data.role} onValueChange={(value) => setData('role', value as User['role'])}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role} />
                        </div>
                    </FormSection>


                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Update Role'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/users">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
