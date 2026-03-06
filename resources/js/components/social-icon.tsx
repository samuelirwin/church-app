import { Facebook, Globe, Instagram, Linkedin, MessageCircle, Music2, Twitter, Youtube } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type IconEntry = {
    value: string;
    label: string;
    icon: LucideIcon;
};

export const socialIconOptions: IconEntry[] = [
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'twitter', label: 'X / Twitter', icon: Twitter },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'tiktok', label: 'TikTok', icon: Music2 },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'website', label: 'Website', icon: Globe },
];

const iconMap: Record<string, LucideIcon> = Object.fromEntries(socialIconOptions.map((o) => [o.value, o.icon]));

export function SocialIcon({ name, className }: { name: string; className?: string }) {
    const Icon = iconMap[name] ?? Globe;
    return <Icon className={className} />;
}
