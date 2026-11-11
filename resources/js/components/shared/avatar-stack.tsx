import { cn } from '@/lib/utils';

type Person = { id: number; name: string; photo_url?: string | null };

type Props = {
    people: Person[];
    max?: number;
    size?: 'sm' | 'md';
    className?: string;
};

const sizes = {
    sm: 'size-7 text-[10px]',
    md: 'size-9 text-xs',
};

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

/**
 * Overlapping avatars with a "+N" bubble when there are more people than fit.
 */
export function AvatarStack({
    people,
    max = 4,
    size = 'sm',
    className,
}: Props) {
    const shown = people.slice(0, max);
    const hidden = people.length - shown.length;

    return (
        <div className={cn('flex -space-x-2', className)}>
            {shown.map((person) =>
                person.photo_url ? (
                    <img
                        key={person.id}
                        src={person.photo_url}
                        alt={person.name}
                        title={person.name}
                        className={cn(
                            'rounded-full object-cover ring-2 ring-background',
                            sizes[size],
                        )}
                    />
                ) : (
                    <span
                        key={person.id}
                        title={person.name}
                        className={cn(
                            'flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background',
                            sizes[size],
                        )}
                    >
                        {initials(person.name)}
                    </span>
                ),
            )}
            {hidden > 0 && (
                <span
                    className={cn(
                        'flex items-center justify-center rounded-full bg-primary/10 font-medium text-primary ring-2 ring-background',
                        sizes[size],
                    )}
                >
                    +{hidden}
                </span>
            )}
        </div>
    );
}
