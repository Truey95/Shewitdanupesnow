"use client"

import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { cn } from "@/lib/utils"

interface SlideshowProps extends React.HTMLAttributes<HTMLDivElement> {
  slides: {
    src: string;
    alt: string;
  }[];
  options?: any;
}

export function Slideshow({ slides, className, options, ...props }: SlideshowProps) {
  const [emblaRef] = useEmblaCarousel({
    loop: true,
    ...options,
  })

  return (
    <div 
      ref={emblaRef} 
      className={cn("overflow-hidden w-full relative h-screen", className)}
      {...props}
    >
      <div className="flex h-full">
        {slides.map((slide, index) => (
          <div 
            key={index}
            className="flex-[0_0_100%] min-w-0 relative h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
            <img
              src={slide.src}
              alt={slide.alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}