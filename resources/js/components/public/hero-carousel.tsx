import { useCallback, useEffect, useRef, useState } from 'react';

type HeroCarouselProps = {
    images: string[];
    title: string;
    description?: string | null;
};

export function HeroCarousel({ images, title, description }: HeroCarouselProps) {
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval>>(null);

    const count = images.length;
    const isCarousel = count > 1;

    const advance = useCallback(() => {
        setCurrent((prev) => (prev + 1) % count);
    }, [count]);

    useEffect(() => {
        if (!isCarousel || isPaused) return;

        timerRef.current = setInterval(advance, 5000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isCarousel, isPaused, advance]);

    if (count === 0) return null;

    return (
        <div
            className="relative h-[320px] w-full overflow-hidden sm:h-[400px] lg:h-[480px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {images.map((url, index) => (
                <div
                    key={index}
                    className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{ opacity: index === current ? 1 : 0 }}
                >
                    <img
                        src={url}
                        alt={`${title} - slide ${index + 1}`}
                        className="h-full w-full object-cover"
                    />
                </div>
            ))}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Title overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
                <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-base text-white/80 sm:text-lg">{description}</p>
                )}
            </div>

            {/* Dots */}
            {isCarousel && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setCurrent(index)}
                            className={`h-2 w-2 rounded-full transition-all ${
                                index === current
                                    ? 'w-6 bg-white'
                                    : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
