import { Slideshow } from "@/components/ui/slideshow"

const slides = [
  {
    src: "/images/hero-slide-1.png",
    alt: "Fashion models in red swimwear"
  },
  // More slides can be added here later
]

export function Hero() {
  return (
    <section className="w-full h-screen relative">
      <Slideshow 
        slides={slides}
        options={{
          loop: true,
          dragFree: true,
        }}
      />
      {/* Overlay with Hero Title and Tagline */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-serif font-bold mb-4 tracking-wider drop-shadow-2xl">
            SHE WIT DA NUPES NOW
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl font-bold italic tracking-wide drop-shadow-xl">
            SHE LIKE YOU BUT SHE LOVE ME
          </p>
        </div>
      </div>
    </section>
  )
}