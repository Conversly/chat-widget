"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
    images: string[];
    className?: string;
}

export function ImageCarousel({ images, className }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) return null;

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const currentImage = images[currentIndex];
    const isSingle = images.length === 1;

    return (
        <div className={cn("relative rounded-lg overflow-hidden group/carousel mt-2", className)}>
            <div className="aspect-video w-full bg-gray-100 relative">
                <img
                    src={currentImage}
                    alt={`Citation image ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                />
            </div>

            {!isSingle && (
                <>
                    <button
                        onClick={handlePrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors opacity-0 group-hover/carousel:opacity-100"
                        title="Previous image"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors opacity-0 group-hover/carousel:opacity-100"
                        title="Next image"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-colors",
                                    index === currentIndex
                                        ? "bg-white"
                                        : "bg-white/40 hover:bg-white/60"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
