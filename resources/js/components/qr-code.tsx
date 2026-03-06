interface QrCodeProps {
    path: string;
    size?: number;
    className?: string;
    alt?: string;
}

export default function QrCode({ path, size = 200, className, alt = 'QR Code' }: QrCodeProps) {
    // Full URLs use the ?url= query param; relative paths use the /qr/{path} route
    const isFullUrl = /^https?:\/\//.test(path);
    const src = isFullUrl
        ? `/qr?url=${encodeURIComponent(path)}&size=${size}`
        : `/qr/${path.replace(/^\//, '')}?size=${size}`;

    return <img src={src} width={size} height={size} className={className} alt={alt} loading="lazy" />;
}
