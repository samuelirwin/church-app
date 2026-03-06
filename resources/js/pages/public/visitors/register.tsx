import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import visit from '@/routes/visit';

type PageProps = {
    flash?: { success?: string; error?: string };
};

const howHeardOptions = [
    { value: 'friend_family', label: 'Friend/Family' },
    { value: 'online_search', label: 'Online Search' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'drive_by', label: 'Drive By' },
    { value: 'church_event', label: 'Church Event' },
    { value: 'other', label: 'Other' },
];

export default function VisitorRegister() {
    const { flash } = usePage<PageProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        first_visit_date: new Date().toISOString().split('T')[0],
        how_heard: '',
        prayer_requests: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(visit.register.url());
    };

    // Show success message after submission
    if (flash?.success) {
        return (
            <PublicLayout title="Thank You">
                <Head title="Thank You">
                    <meta name="description" content="Thank you for registering as a visitor at our church." />
                </Head>
                <div className="mx-auto max-w-2xl px-4 py-20 text-center">
                    <CheckCircle className="mx-auto mb-4 size-16 text-green-500" />
                    <h1 className="mb-2 text-2xl font-bold">{flash.success}</h1>
                    <p className="text-muted-foreground">We look forward to connecting with you.</p>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout title="Visitor Registration">
            <Head title="Visitor Registration">
                <meta name="description" content="Register as a visitor at our church. We would love to connect with you." />
                <meta property="og:title" content="Visitor Registration" />
                <meta property="og:description" content="Register as a visitor at our church. We would love to connect with you." />
            </Head>

            <div className="mx-auto max-w-2xl px-4 py-12">
                {flash?.error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {flash.error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Welcome! We'd love to connect.</CardTitle>
                        <p className="text-muted-foreground">
                            Please fill out the form below so we can welcome you properly and stay in touch.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Your full name"
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="you@example.com"
                                    />
                                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="(555) 123-4567"
                                    />
                                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="first_visit_date">Date of Visit</Label>
                                    <Input
                                        id="first_visit_date"
                                        type="date"
                                        value={data.first_visit_date}
                                        onChange={(e) => setData('first_visit_date', e.target.value)}
                                    />
                                    {errors.first_visit_date && <p className="text-sm text-red-500">{errors.first_visit_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="how_heard">How did you hear about us?</Label>
                                    <Select
                                        value={data.how_heard}
                                        onValueChange={(v) => setData('how_heard', v)}
                                    >
                                        <SelectTrigger id="how_heard">
                                            <SelectValue placeholder="Select an option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {howHeardOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.how_heard && <p className="text-sm text-red-500">{errors.how_heard}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="prayer_requests">Prayer Requests</Label>
                                <textarea
                                    id="prayer_requests"
                                    value={data.prayer_requests}
                                    onChange={(e) => setData('prayer_requests', e.target.value)}
                                    rows={4}
                                    placeholder="Share any prayer requests or things you would like us to know..."
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                {errors.prayer_requests && <p className="text-sm text-red-500">{errors.prayer_requests}</p>}
                            </div>

                            <div className="pt-4">
                                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                    {processing ? 'Submitting...' : 'Submit Registration'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PublicLayout>
    );
}
