import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type HeroSlide = {
    id: number;
    image_url: string;
};

type HeroCarouselProps = {
    slides: HeroSlide[];
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
    ]);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on('select', onSelect);
        onSelect();

        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi]);

    const showControls = slides.length > 1;

    return (
        <>
            <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
                <div className="flex h-full">
                    {slides.map((slide) => (
                        <div key={slide.id} className="h-full min-w-0 flex-[0_0_100%]">
                            <img
                                src={slide.image_url}
                                alt=""
                                className="size-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute inset-0 bg-black/50" />

            {showControls && (
                <>
                    <button
                        onClick={scrollPrev}
                        className="absolute left-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="absolute right-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="size-5" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.id}
                                onClick={() => scrollTo(index)}
                                className={`size-2.5 rounded-full transition-all ${
                                    index === selectedIndex
                                        ? 'scale-125 bg-white'
                                        : 'bg-white/50 hover:bg-white/75'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
