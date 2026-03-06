import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FormSection } from '@/components/admin/form-section';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

type ParentOption = {
    id: number;
    label: string;
    depth: number;
};

type AvailablePage = {
    label: string;
    path: string;
};

type EnumOption = {
    value: string;
    label: string;
};

type PublishedPage = {
    id: number;
    title: string;
    slug: string;
};

type Props = {
    parentOptions: ParentOption[];
    availablePages: AvailablePage[];
    publishedPages: PublishedPage[];
    types: EnumOption[];
    targets: EnumOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Site Settings', href: '/admin/site-settings' },
    { title: 'Create Menu Item', href: '/admin/menu-items/create' },
];

export default function MenuItemCreate({ parentOptions, availablePages, publishedPages, types, targets }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        label: '',
        type: 'internal_page',
        route: '',
        url: '',
        page_id: '' as string | number,
        target: '_self',
        parent_id: '' as string | number,
        sort_order: '0',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/menu-items');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Menu Item" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <Link href="/admin/site-settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Site Settings</Link>
                    <h1 className="mt-2 text-2xl font-bold">Create Menu Item</h1>
                    <p className="text-sm text-muted-foreground">Add a new item to the public navigation menu.</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                    <FormSection title="Menu Item Details" description="Label, type, and link configuration.">
                        <div className="space-y-2">
                            <Label htmlFor="label">Label *</Label>
                            <Input id="label" value={data.label} onChange={(e) => setData('label', e.target.value)} placeholder="Menu item label" />
                            <InputError message={errors.label} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parent_id">Parent</Label>
                            <select
                                id="parent_id"
                                value={data.parent_id}
                                onChange={(e) => setData('parent_id', e.target.value ? Number(e.target.value) : '')}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                            >
                                <option value="">None (Top Level)</option>
                                {parentOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.depth > 0 ? `\u00A0\u00A0\u2014 ${option.label}` : option.label}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.parent_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Type *</Label>
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                            >
                                {types.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.type} />
                        </div>

                        {data.type === 'internal_page' && (
                            <div className="space-y-2">
                                <Label htmlFor="route">Internal Page *</Label>
                                <select
                                    id="route"
                                    value={data.route}
                                    onChange={(e) => setData('route', e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                                >
                                    <option value="">Select a page...</option>
                                    {availablePages.map((page) => (
                                        <option key={page.path} value={page.path}>{page.label} ({page.path})</option>
                                    ))}
                                </select>
                                <InputError message={errors.route} />
                            </div>
                        )}

                        {data.type === 'page' && (
                            <div className="space-y-2">
                                <Label htmlFor="page_id">Page *</Label>
                                <select
                                    id="page_id"
                                    value={data.page_id}
                                    onChange={(e) => setData('page_id', e.target.value ? Number(e.target.value) : '')}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                                >
                                    <option value="">Select a page...</option>
                                    {publishedPages.map((page) => (
                                        <option key={page.id} value={page.id}>{page.title} (/pages/{page.slug})</option>
                                    ))}
                                </select>
                                <InputError message={errors.page_id} />
                            </div>
                        )}

                        {data.type === 'custom_url' && (
                            <div className="space-y-2">
                                <Label htmlFor="url">Custom URL *</Label>
                                <Input id="url" type="url" value={data.url} onChange={(e) => setData('url', e.target.value)} placeholder="https://example.com" />
                                <InputError message={errors.url} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="target">Target *</Label>
                            <select
                                id="target"
                                value={data.target}
                                onChange={(e) => setData('target', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                            >
                                {targets.map((target) => (
                                    <option key={target.value} value={target.value}>{target.label}</option>
                                ))}
                            </select>
                            <InputError message={errors.target} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input id="sort_order" type="number" min="0" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                            <InputError message={errors.sort_order} />
                        </div>

                        <div className="flex items-center gap-2">
                            <input id="is_active" type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="size-4 rounded border-input" />
                            <Label htmlFor="is_active">Active (visible in navigation)</Label>
                        </div>
                    </FormSection>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Menu Item'}</Button>
                        <Button variant="outline" asChild><Link href="/admin/site-settings">Cancel</Link></Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
