import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type DemoAccount = {
    role: string;
    email: string;
    password: string;
};

const demoAccounts: DemoAccount[] = [
    { role: 'Admin', email: 'admin@example.test', password: 'password' },
    { role: 'Staff', email: 'staff@example.test', password: 'password' },
    { role: 'Counselor', email: 'counselor@example.test', password: 'password' },
    { role: 'Leader', email: 'leader@example.test', password: 'password' },
    { role: 'Member', email: 'member@example.test', password: 'password' },
];

type Props = {
    status?: string;
    canResetPassword: boolean;
    isDemo: boolean;
};

export default function Login({
    status,
    canResetPassword,
    isDemo,
}: Props) {
    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {isDemo && (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                    <p className="mb-3 text-center text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Demo Credentials
                    </p>
                    <div className="space-y-2">
                        {demoAccounts.map((account) => (
                            <div
                                key={account.role}
                                className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-xs dark:bg-amber-900/30"
                            >
                                <span className="font-medium text-amber-900 dark:text-amber-100">
                                    {account.role}
                                </span>
                                <span className="font-mono text-amber-700 dark:text-amber-300">
                                    {account.email}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
                        Password for all accounts: <span className="font-mono font-semibold">password</span>
                    </p>
                </div>
            )}
        </AuthLayout>
    );
}
