import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { pageTransition, fadeInStagger, itemFadeIn } from "@/components/animations/page-transitions";
import { usePrintifyShops, usePrintifyProducts } from "@/hooks/use-printify";
import { Skeleton } from "@/components/ui/skeleton";
import type { PrintifyProduct } from "@/types/printify";

export default function NewArrivals() {
  const { data: shops, isLoading: isLoadingShops } = usePrintifyShops();
  const [shopId, setShopId] = useState<string>("");
  
  useEffect(() => {
    if (shops && shops.length > 0) {
      setShopId(shops[0].id);
    }
  }, [shops]);

  const { data: productsResponse, isLoading: isLoadingProducts } = usePrintifyProducts(shopId);
  
  // Format Printify products to match our ProductCard component's expected structure
  const formatProducts = (products?: PrintifyProduct[]) => {
    if (!products) return [];
    
    return products.map(product => ({
      id: product.id, // Keep as string to avoid parsing errors
      name: product.title,
      price: (() => {
        // Use enabled variant pricing or fallback to first variant
        const enabledVariant = product.variants?.find(v => v.is_enabled);
        const variantToUse = enabledVariant || product.variants?.[0];
        return variantToUse?.price ? variantToUse.price / 100 : 0; // Convert cents to dollars
      })(),
      imageUrl: product.images && product.images.length > 0 && product.images[0].src
        ? product.images[0].src 
        : "/images/product-placeholder.jpg"
    }));
  };

  const isLoading = isLoadingShops || isLoadingProducts || !shopId;
  const formattedProducts = formatProducts(productsResponse?.data);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="container mx-auto px-4 py-12"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">New Arrivals</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our latest collections and exclusive releases. Be the first to showcase these fresh designs.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-4">
              <Skeleton className="h-[300px] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={fadeInStagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {formattedProducts.map((product) => (
            <motion.div key={product.id} variants={itemFadeIn}>
              <ProductCard product={product} />
            </motion.div>
          ))}

          {formattedProducts.length === 0 && (
            <div className="col-span-4 text-center py-8">
              <p>No products found. New arrivals will be added soon.</p>
            </div>
          )}
        </motion.div>
      )}

      <div className="mt-16 text-center">
        <Button variant="outline" className="mx-auto">
          View All Products
        </Button>
      </div>
    </motion.div>
  );
}