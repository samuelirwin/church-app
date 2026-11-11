import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormSection } from '@/components/admin/form-section';
import { ImageUploader } from '@/components/admin/image-uploader';
import InputError from '@/components/input-error';
import { socialIconOptions } from '@/components/social-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/confirm';
import type { BreadcrumbItem } from '@/types';

type SocialLinkData = {
    platform: string;
    url: string;
    icon: string;
    sort_order: number;
};

type HeroSlideData = {
    id: number;
    title: string | null;
    subtitle: string | null;
    sort_order: number;
    is_active: boolean;
    image_url: string;
};

type VolunteerRoleData = {
    id: number;
    name: string;
    description: string | null;
    ministry: { id: number; name: string } | null;
    is_active: boolean;
};

type MenuItemData = {
    id: number;
    label: string;
    type: string;
    url: string | null;
    route: string | null;
    sort_order: number;
    is_active: boolean;
    children: MenuItemData[];
};

type ServiceTimeData = {
    id: number;
    name: string;
    start_time: string | null;
    end_time: string | null;
    sort_order: number;
    is_active: boolean;
    schedules_count: number;
};

type Props = {
    general: Record<string, string | null>;
    socialLinks: SocialLinkData[];
    heroSlides: HeroSlideData[];
    volunteerRoles: VolunteerRoleData[];
    menuItems: MenuItemData[];
    serviceTimes: ServiceTimeData[];
    logoUrl: string | null;
};

function typeLabel(type: string): string {
    return type === 'custom_url' ? 'Custom URL' : 'Internal Page';
}

function MenuItemRow({ item, depth = 0, onDelete }: { item: MenuItemData; depth?: number; onDelete: (item: MenuItemData) => void }) {
    return (
        <>
            <tr className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                    <div className="flex items-center" style={{ paddingLeft: `${depth * 1.5}rem` }}>
                        {depth > 0 && <ChevronRight className="mr-1 size-3.5 text-muted-foreground" />}
                        {item.label}
                    </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                    <Badge variant="outline" className="font-normal">{typeLabel(item.type)}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.sort_order}</td>
                <td className="px-4 py-3">
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" asChild>
                            <Link href={`/admin/menu-items/${item.id}/edit`}>
                                <Pencil className="size-3.5" />
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item)}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                </td>
            </tr>
            {item.children?.map((child) => (
                <MenuItemRow key={child.id} item={child} depth={depth + 1} onDelete={onDelete} />
            ))}
        </>
    );
}

export default function SiteSettingsEdit({ general, socialLinks, heroSlides, volunteerRoles, menuItems, serviceTimes, logoUrl }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Site Settings', href: '/admin/site-settings' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT' as const,
        church_name: general.church_name ?? '',
        tagline: general.tagline ?? '',
        address: general.address ?? '',
        phone: general.phone ?? '',
        email: general.email ?? '',
        hero_tagline: general.hero_tagline ?? '',
        hero_heading: general.hero_heading ?? '',
        hero_subheading: general.hero_subheading ?? '',
        social_links: socialLinks.length > 0 ? socialLinks : [] as SocialLinkData[],
        logo_image: null as File | null,
        remove_logo: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/site-settings', { forceFormData: true });
    };

    const addSocialLink = () => {
        setData('social_links', [...data.social_links, { platform: '', url: '', icon: 'website', sort_order: data.social_links.length }]);
    };

    const removeSocialLink = (index: number) => {
        setData(
            'social_links',
            data.social_links.filter((_, i) => i !== index),
        );
    };

    const updateSocialLink = (index: number, field: keyof SocialLinkData, value: string | number) => {
        const updated = [...data.social_links];
        updated[index] = { ...updated[index], [field]: value };
        setData('social_links', updated);
    };

    const handleDeleteSlide = async (slide: HeroSlideData) => {
        if (await confirmAction({ title: `Delete this hero slide${slide.title ? ` "${slide.title}"` : ''}?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/hero-slides/${slide.id}`);
        }
    };

    const handleDeleteServiceTime = async (serviceTime: ServiceTimeData) => {
        if (await confirmAction({ title: `Delete service time "${serviceTime.name}"?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/service-times/${serviceTime.id}`);
        }
    };

    const handleDeleteVolunteerRole = async (role: VolunteerRoleData) => {
        if (await confirmAction({ title: `Delete volunteer role "${role.name}"?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/volunteer-roles/${role.id}`);
        }
    };

    const handleDeleteMenuItem = async (item: MenuItemData) => {
        const childWarning = item.children?.length > 0 ? ' and all its children' : '';
        if (await confirmAction({ title: `Delete "${item.label}"${childWarning}?`, confirmLabel: 'Delete', destructive: true })) {
            router.delete(`/admin/menu-items/${item.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Site Settings" />

            <div className="flex flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Site Settings</h1>
                    <p className="text-sm text-muted-foreground">Manage church information, hero section, navigation, service times, and volunteer roles.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="general" className="space-y-6">
                        <TabsList className="flex-wrap">
                            <TabsTrigger value="general">General Info</TabsTrigger>
                            <TabsTrigger value="hero">Hero Section</TabsTrigger>
                            <TabsTrigger value="social">Social Links</TabsTrigger>
                            <TabsTrigger value="service-times">Service Times</TabsTrigger>
                            <TabsTrigger value="volunteer-roles">Volunteer Roles</TabsTrigger>
                            <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-6">
                            <FormSection title="Site Logo" description="Upload a logo to replace the default icon across the site.">
                                <ImageUploader
                                    currentUrl={data.remove_logo ? null : logoUrl}
                                    onChange={(file) => {
                                        setData('logo_image', file);
                                        if (file) {
                                            setData('remove_logo', false);
                                        }
                                    }}
                                    onRemove={() => {
                                        setData('logo_image', null);
                                        setData('remove_logo', true);
                                    }}
                                    label="Logo"
                                    error={errors.logo_image}
                                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                />
                            </FormSection>

                            <FormSection title="Church Information" description="Basic details about your church.">
                                <div className="space-y-2">
                                    <Label htmlFor="church_name">Church Name *</Label>
                                    <Input id="church_name" value={data.church_name} onChange={(e) => setData('church_name', e.target.value)} />
                                    <InputError message={errors.church_name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tagline">Tagline</Label>
                                    <Input id="tagline" value={data.tagline} onChange={(e) => setData('tagline', e.target.value)} placeholder="A short description of your church" />
                                    <InputError message={errors.tagline} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="123 Main St, City, State" />
                                    <InputError message={errors.address} />
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="(555) 123-4567" />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="info@church.org" />
                                        <InputError message={errors.email} />
                                    </div>
                                </div>
                            </FormSection>
                        </TabsContent>

                        <TabsContent value="hero" className="space-y-6">
                            <FormSection title="Hero Text" description="Text displayed on the homepage hero banner.">
                                <div className="space-y-2">
                                    <Label htmlFor="hero_tagline">Tagline</Label>
                                    <Input
                                        id="hero_tagline"
                                        value={data.hero_tagline}
                                        onChange={(e) => setData('hero_tagline', e.target.value)}
                                        placeholder="Join us this Sunday"
                                    />
                                    <InputError message={errors.hero_tagline} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hero_heading">Heading</Label>
                                    <Input
                                        id="hero_heading"
                                        value={data.hero_heading}
                                        onChange={(e) => setData('hero_heading', e.target.value)}
                                        placeholder="Welcome Home"
                                    />
                                    <InputError message={errors.hero_heading} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hero_subheading">Subheading</Label>
                                    <Input
                                        id="hero_subheading"
                                        value={data.hero_subheading}
                                        onChange={(e) => setData('hero_subheading', e.target.value)}
                                        placeholder="A place where faith grows, community thrives, and everyone belongs."
                                    />
                                    <InputError message={errors.hero_subheading} />
                                </div>
                            </FormSection>

                            <FormSection title="Hero Slides" description="Background images that cycle behind the hero text. When no slides exist, a gradient background is shown.">
                                <div className="flex justify-end">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/admin/hero-slides/create">
                                            <Plus className="mr-1 size-4" />
                                            Add Slide
                                        </Link>
                                    </Button>
                                </div>

                                {heroSlides.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Image</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-card">
                                                {heroSlides.map((slide) => (
                                                    <tr key={slide.id} className="hover:bg-muted/30">
                                                        <td className="px-4 py-3">
                                                            {slide.image_url ? (
                                                                <img
                                                                    src={slide.image_url}
                                                                    alt={slide.title ?? 'Hero slide'}
                                                                    className="h-12 w-20 rounded object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-12 w-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                                                    No image
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium">{slide.title || '(No title)'}</div>
                                                            {slide.subtitle && (
                                                                <div className="max-w-xs truncate text-xs text-muted-foreground">{slide.subtitle}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">{slide.sort_order}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant={slide.is_active ? 'default' : 'secondary'}>
                                                                {slide.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button type="button" variant="ghost" size="sm" asChild>
                                                                    <Link href={`/admin/hero-slides/${slide.id}/edit`}>
                                                                        <Pencil className="size-3.5" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteSlide(slide)}
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No hero slides yet. Add one to display a background image carousel on the homepage.</p>
                                )}
                            </FormSection>
                        </TabsContent>

                        <TabsContent value="social" className="space-y-6">
                            <FormSection title="Social Media Links" description="Add links to your church's social media profiles.">
                                {data.social_links.length > 0 ? (
                                    <div className="space-y-4">
                                        {data.social_links.map((link, index) => (
                                            <div key={index} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                                                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                                                    <div className="space-y-1">
                                                        <Label>Platform</Label>
                                                        <Input
                                                            value={link.platform}
                                                            onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                                            placeholder="e.g. Facebook"
                                                        />
                                                        <InputError message={errors[`social_links.${index}.platform` as keyof typeof errors]} />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label>URL</Label>
                                                        <Input
                                                            value={link.url}
                                                            onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                                            placeholder="https://..."
                                                        />
                                                        <InputError message={errors[`social_links.${index}.url` as keyof typeof errors]} />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label>Icon</Label>
                                                        <Select value={link.icon} onValueChange={(value) => updateSocialLink(index, 'icon', value)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select icon" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {socialIconOptions.map((opt) => (
                                                                    <SelectItem key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError message={errors[`social_links.${index}.icon` as keyof typeof errors]} />
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="mt-6 shrink-0 text-destructive hover:text-destructive"
                                                    onClick={() => removeSocialLink(index)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No social links added yet.</p>
                                )}

                                <Button type="button" variant="outline" onClick={addSocialLink}>
                                    <Plus className="mr-2 size-4" />
                                    Add Social Link
                                </Button>
                            </FormSection>
                        </TabsContent>

                        <TabsContent value="service-times" className="space-y-6">
                            <FormSection title="Service Times" description="Define the service time slots used for scheduling.">
                                <div className="flex justify-end">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/admin/service-times/create">
                                            <Plus className="mr-1 size-4" />
                                            Add Service Time
                                        </Link>
                                    </Button>
                                </div>

                                {serviceTimes.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Schedules</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-card">
                                                {serviceTimes.map((st) => (
                                                    <tr key={st.id} className="hover:bg-muted/30">
                                                        <td className="px-4 py-3 font-medium">{st.name}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {st.start_time && st.end_time
                                                                ? `${st.start_time.slice(0, 5)} - ${st.end_time.slice(0, 5)}`
                                                                : st.start_time ? st.start_time.slice(0, 5) : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">{st.sort_order}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant={st.is_active ? 'default' : 'secondary'}>
                                                                {st.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">{st.schedules_count}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button type="button" variant="ghost" size="sm" asChild>
                                                                    <Link href={`/admin/service-times/${st.id}/edit`}>
                                                                        <Pencil className="size-3.5" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteServiceTime(st)}
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No service times defined yet.</p>
                                )}
                            </FormSection>
                        </TabsContent>

                        <TabsContent value="volunteer-roles" className="space-y-6">
                            <FormSection title="Volunteer Roles" description="Roles that volunteers can be assigned to for scheduling.">
                                <div className="flex justify-end">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/admin/volunteer-roles/create">
                                            <Plus className="mr-1 size-4" />
                                            Add Role
                                        </Link>
                                    </Button>
                                </div>

                                {volunteerRoles.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ministry</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-card">
                                                {volunteerRoles.map((role) => (
                                                    <tr key={role.id} className="hover:bg-muted/30">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium">{role.name}</div>
                                                            {role.description && (
                                                                <div className="max-w-xs truncate text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: role.description }} />
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {role.ministry?.name ?? '-'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant={role.is_active ? 'default' : 'secondary'}>
                                                                {role.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button type="button" variant="ghost" size="sm" asChild>
                                                                    <Link href={`/admin/volunteer-roles/${role.id}/edit`}>
                                                                        <Pencil className="size-3.5" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteVolunteerRole(role)}
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No volunteer roles defined yet.</p>
                                )}
                            </FormSection>
                        </TabsContent>

                        <TabsContent value="menu-items" className="space-y-6">
                            <FormSection title="Menu Items" description="Navigation items displayed in the public menu.">
                                <div className="flex justify-end">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href="/admin/menu-items/create">
                                            <Plus className="mr-1 size-4" />
                                            Add Menu Item
                                        </Link>
                                    </Button>
                                </div>

                                {menuItems.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Label</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-card">
                                                {menuItems.map((item) => (
                                                    <MenuItemRow key={item.id} item={item} onDelete={handleDeleteMenuItem} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No menu items defined yet.</p>
                                )}
                            </FormSection>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6 flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Settings'}
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
