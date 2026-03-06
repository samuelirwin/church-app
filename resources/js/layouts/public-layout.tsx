import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronDown, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { SocialIcon } from '@/components/social-icon';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useFlashMessages } from '@/hooks/use-flash-messages';
import { dashboard, login, register } from '@/routes';
import type { NavigationMenuItem } from '@/types';

type PublicLayoutProps = {
    children: ReactNode;
    title?: string;
};

function formatTime(time: string | null): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return minutes === 0 ? `${displayHours}:00 ${period}` : `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

function isActive(url: string, currentPath: string): boolean {
    if (url === '/') {
        return currentPath === '/';
    }
    return currentPath === url || currentPath.startsWith(url + '/');
}

function DesktopDropdown({ item, currentPath }: { item: NavigationMenuItem; currentPath: string }) {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEnter = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setOpen(true);
    }, []);

    const handleLeave = useCallback(() => {
        timeoutRef.current = setTimeout(() => setOpen(false), 150);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const hasActiveChild = item.children.some(
        (child) => isActive(child.url, currentPath) || child.children?.some((gc) => isActive(gc.url, currentPath)),
    );

    return (
        <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    hasActiveChild
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
            >
                {item.label}
                <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95">
                    {item.children.map((child) => (
                        <div key={child.id}>
                            {child.children?.length > 0 ? (
                                <>
                                    <span className="block px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {child.label}
                                    </span>
                                    {child.children.map((grandchild) => (
                                        <Link
                                            key={grandchild.id}
                                            href={grandchild.url}
                                            target={grandchild.target}
                                            className={`block rounded-sm px-3 py-1.5 pl-5 text-sm transition-colors ${
                                                isActive(grandchild.url, currentPath)
                                                    ? 'bg-accent text-accent-foreground'
                                                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                                            }`}
                                        >
                                            {grandchild.label}
                                        </Link>
                                    ))}
                                </>
                            ) : (
                                <Link
                                    href={child.url}
                                    target={child.target}
                                    className={`block rounded-sm px-3 py-1.5 text-sm transition-colors ${
                                        isActive(child.url, currentPath)
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                >
                                    {child.label}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MobileNavItem({
    item,
    currentPath,
    onNavigate,
    depth = 0,
}: {
    item: NavigationMenuItem;
    currentPath: string;
    onNavigate: () => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = item.children?.length > 0;

    const paddingClass = depth === 0 ? 'pl-3' : depth === 1 ? 'pl-6' : 'pl-9';

    if (hasChildren) {
        return (
            <div>
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className={`flex w-full items-center justify-between rounded-md ${paddingClass} pr-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground`}
                >
                    {item.label}
                    <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded && (
                    <div className="space-y-0.5">
                        {item.children.map((child) => (
                            <MobileNavItem key={child.id} item={child} currentPath={currentPath} onNavigate={onNavigate} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.url}
            target={item.target}
            className={`block rounded-md ${paddingClass} pr-3 py-2 text-sm font-medium ${
                isActive(item.url, currentPath)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={onNavigate}
        >
            {item.label}
        </Link>
    );
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
    const { auth, name, navigation, siteSettings, serviceTimes } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

    useFlashMessages();

    return (
        <>
            {title && <Head title={title} />}
            <Toaster position="top-right" richColors closeButton />

            <div className="flex min-h-screen flex-col bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5">
                            {siteSettings?.logoUrl ? (
                                <img src={siteSettings.logoUrl} alt={name} className="h-8 w-auto object-contain" />
                            ) : (
                                <div className="flex size-8 items-center justify-center rounded-lg bg-earth-dark text-earth-light">
                                    <AppLogoIcon className="size-5 fill-current" />
                                </div>
                            )}
                            <span className="font-heading text-lg font-semibold tracking-tight">{name}</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden items-center gap-0.5 lg:flex">
                            {navigation.map((item) =>
                                item.children?.length > 0 ? (
                                    <DesktopDropdown key={item.id} item={item} currentPath={currentPath} />
                                ) : (
                                    <Link
                                        key={item.id}
                                        href={item.url}
                                        target={item.target}
                                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                            isActive(item.url, currentPath)
                                                ? 'bg-accent text-accent-foreground'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                ),
                            )}
                            <Link
                                href="/visit"
                                className="ml-1 rounded-md bg-bronze px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-bronze/90"
                            >
                                Visit
                            </Link>
                        </nav>

                        {/* Auth Buttons */}
                        <div className="hidden items-center gap-2 lg:flex">
                            {auth.user ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={dashboard()}>Dashboard</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={login()}>Log in</Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href={register()}>Register</Link>
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <span className="sr-only">Open main menu</span>
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>

                    {/* Mobile Nav */}
                    {mobileMenuOpen && (
                        <div className="border-t border-border lg:hidden">
                            <div className="space-y-1 px-4 py-3">
                                {navigation.map((item) => (
                                    <MobileNavItem
                                        key={item.id}
                                        item={item}
                                        currentPath={currentPath}
                                        onNavigate={() => setMobileMenuOpen(false)}
                                    />
                                ))}
                                <Link
                                    href="/visit"
                                    className="block rounded-md bg-bronze/10 px-3 py-2 text-sm font-semibold text-bronze"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Plan Your Visit
                                </Link>

                                <div className="border-t border-border pt-3">
                                    {auth.user ? (
                                        <Link
                                            href={dashboard()}
                                            className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                                        >
                                            Dashboard
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                href={login()}
                                                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                                            >
                                                Log in
                                            </Link>
                                            <Link
                                                href={register()}
                                                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
                                            >
                                                Register
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* Main Content */}
                <main className="flex-1">{children}</main>

                {/* Footer */}
                <footer className="bg-earth-dark text-earth-light">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Brand */}
                            <div className="sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-2.5">
                                    {siteSettings?.logoUrl ? (
                                        <img src={siteSettings.logoUrl} alt={name} className="h-8 w-auto object-contain" />
                                    ) : (
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-golden/20 text-golden">
                                            <AppLogoIcon className="size-5 fill-current" />
                                        </div>
                                    )}
                                    <span className="font-heading text-lg font-semibold tracking-tight text-earth-light">{name}</span>
                                </div>
                                {siteSettings?.general?.tagline ? (
                                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-earth-light/60">{siteSettings.general.tagline}</p>
                                ) : (
                                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-earth-light/60">
                                        Building community through faith, fellowship, and service. All are welcome here.
                                    </p>
                                )}
                                <div className="mt-4 space-y-1.5 text-sm text-earth-light/60">
                                    {siteSettings?.general?.address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-3.5 shrink-0" />
                                            <span>{siteSettings.general.address}</span>
                                        </div>
                                    )}
                                    {siteSettings?.general?.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="size-3.5 shrink-0" />
                                            <span>{siteSettings.general.phone}</span>
                                        </div>
                                    )}
                                    {siteSettings?.general?.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="size-3.5 shrink-0" />
                                            <a href={`mailto:${siteSettings.general.email}`} className="transition-colors hover:text-golden">
                                                {siteSettings.general.email}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-golden">Quick Links</h3>
                                <ul className="mt-4 space-y-2.5">
                                    {navigation.map((item) => (
                                        <li key={item.id}>
                                            <Link
                                                href={item.url}
                                                target={item.target}
                                                className="text-sm text-earth-light/60 transition-colors hover:text-golden"
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Service Times */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-golden">Service Times</h3>
                                <ul className="mt-4 space-y-2.5 text-sm text-earth-light/60">
                                    {serviceTimes && serviceTimes.length > 0 ? (
                                        serviceTimes.map((st) => (
                                            <li key={st.id}>
                                                {st.name}:{' '}
                                                {st.start_time && st.end_time
                                                    ? `${formatTime(st.start_time)} \u2013 ${formatTime(st.end_time)}`
                                                    : st.start_time
                                                      ? formatTime(st.start_time)
                                                      : '\u2013'}
                                            </li>
                                        ))
                                    ) : (
                                        <li>Check back for service times.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Connect */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-golden">Connect</h3>
                                {siteSettings?.socialLinks && siteSettings.socialLinks.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {siteSettings.socialLinks.map((link, index) => (
                                            <a
                                                key={index}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={link.platform}
                                                className="flex size-9 items-center justify-center rounded-lg bg-earth-light/10 text-earth-light/60 transition-colors hover:bg-golden/20 hover:text-golden"
                                            >
                                                <SocialIcon name={link.icon} className="size-4" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                                <ul className="mt-4 space-y-2.5">
                                    <li>
                                        <Link href="/visit" className="text-sm text-earth-light/60 transition-colors hover:text-golden">
                                            Plan Your Visit
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/register" className="text-sm text-earth-light/60 transition-colors hover:text-golden">
                                            Create an Account
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/ministries" className="text-sm text-earth-light/60 transition-colors hover:text-golden">
                                            Find a Ministry
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/events" className="text-sm text-earth-light/60 transition-colors hover:text-golden">
                                            Upcoming Events
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-12 border-t border-earth-light/10 pt-8 text-center text-sm text-earth-light/40">
                            &copy; {new Date().getFullYear()} {name}. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
