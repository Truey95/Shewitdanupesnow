import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useProductsByCategory } from "@/hooks/use-products-by-category";
import ProductCard from "@/components/ProductCard";
import { Loader2 } from "lucide-react";

export default function HWDPNCollection() {
  const { data: productsData, isLoading, error } = useProductsByCategory('hwdpn');

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#FFD700' }}>
      <div className="container mx-auto py-16">
        <h1 className="text-6xl font-serif mb-4" style={{ color: '#00008B' }}>
          He Wit Da Poodles Now
        </h1>
        
        <p className="text-xl mb-12" style={{ color: '#00008B', opacity: 0.8 }}>
          Yellow-Themed Collection
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mr-3" style={{ color: '#00008B' }} />
            <span className="text-lg" style={{ color: '#00008B' }}>Loading products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-lg" style={{ color: '#00008B' }}>Unable to load products at this time.</p>
          </div>
        ) : productsData?.data && productsData.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productsData.data.filter(product => product.isActive).map((product) => (
              <ProductCard 
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: product.imageUrl
                }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="aspect-square bg-white/10 rounded-lg p-6 flex items-center justify-center">
              <p className="text-2xl" style={{ color: '#00008B' }}>Coming Soon</p>
            </div>
          </div>
        )}

        <Link href="/">
          <Button 
            className="mt-8"
            style={{ 
              backgroundColor: '#00008B',
              color: '#FFD700'
            }}
          >
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
