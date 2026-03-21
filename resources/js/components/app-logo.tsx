import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name, siteSettings } = usePage().props;
    const logoUrl = siteSettings?.logoUrl;

    return (
        <>
            {logoUrl && (
                <img src={logoUrl} alt={name} className="size-8 rounded-md object-contain" />
            )}
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {name}
                </span>
            </div>
        </>
    );
}
