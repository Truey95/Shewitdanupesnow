import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Photo Collage Menu */}
      <section className="bg-black py-8">
        <div className="container mx-auto px-2 max-w-[2000px]">
          <div className="grid grid-cols-12 gap-2 auto-rows-[250px]">
            {/* Large Featured Image - Urban Collection */}
            <Link href="/collections/swdnn" className="col-span-6 row-span-2">
              <div className="relative h-full group cursor-pointer overflow-hidden">
                <img
                  src="/swdnn-feature.jpg"
                  alt="SWDNN Collection"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 flex items-end p-6">
                  <div>
                    <h3 className="text-2xl font-serif text-white mb-2">SWDNN</h3>
                    <p className="text-gray-300 text-sm">She Wit Da Nupes Now Collection</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Premium Collection */}
            <Link href="/collections/hwdkn" className="col-span-3 row-span-2">
              <div className="relative h-full group cursor-pointer overflow-hidden">
                <img
                  src="/images/hwdkn-collection.png"
                  alt="HWDKN Collection"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 flex items-end p-6">
                  <div>
                    <h3 className="text-xl font-serif text-white mb-1">HWDKN</h3>
                    <p className="text-gray-300 text-sm">He Wit Da K's Now</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Athletic Collection */}
            <Link href="/collections/hwdzn" className="col-span-3 row-span-2">
              <div className="relative h-full group cursor-pointer overflow-hidden">
                <img
                  src="/images/hwdzn-collection.png"
                  alt="HWDZN Collection"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 flex items-end p-4">
                  <h3 className="text-lg font-serif text-white">HWDZN</h3>
                </div>
              </div>
            </Link>

            {/* Casual Collection */}
            <Link href="/collections/hwdrn" className="col-span-4 row-span-1">
              <div className="relative h-full group cursor-pointer overflow-hidden">
                <img
                  src="/images/hwdrn-collection.png"
                  alt="HWDRN Collection"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 flex items-end p-4">
                  <h3 className="text-lg font-serif text-white">HWDRN</h3>
                </div>
              </div>
            </Link>

            {/* Limited Edition */}
            <Link href="/collections/hwdpn" className="col-span-8 row-span-1">
              <div className="relative h-full group cursor-pointer overflow-hidden">
                <img
                  src="/images/hwdpn-collection.png"
                  alt="HWDPN Collection"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 flex items-end p-4">
                  <h3 className="text-lg font-serif text-white">HWDPN</h3>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Section with Slideshow */}
      <Hero />

      {/* Newsletter Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-serif mb-4">Join Our Newsletter</h2>
          <p className="mb-8 text-gray-400">
            Be the first to receive updates on new arrivals, special offers, and exclusive content.
          </p>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 bg-transparent border border-white/30 text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
            />
            <Button className="bg-white text-black hover:bg-white/90">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}