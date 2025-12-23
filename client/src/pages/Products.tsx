import { useState, useEffect } from "react";
import { usePrintifyShops, usePrintifyProducts } from "@/hooks/use-printify";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ApiConfigAlert } from "@/components/ApiConfigAlert";
import { sampleProducts } from "@/data/sample-products";
import { addToCart } from "@/lib/cart";
import type { PrintifyProduct } from "@/types/printify";

export default function Products() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // First, get the shops
  const { data: shopsData, isLoading: isLoadingShops, error: shopsError } = usePrintifyShops();

  // Get products from the first shop (if available) or fallback to the known shop ID
  const shopId = (Array.isArray(shopsData) && shopsData[0]?.id) || "21023003";
  const { data: productsData, isLoading: isLoadingProducts, error: productsError } = usePrintifyProducts(shopId || "");

  // Effect to show errors if any
  useEffect(() => {
    if (shopsError) {
      console.error('Shops error:', shopsError);
      toast({
        title: "Error Loading Shops",
        description: "Failed to load shop information. Please try again later.",
        variant: "destructive",
      });
    }
    if (productsError) {
      console.error('Products error:', productsError);
      toast({
        title: "Error Loading Products",
        description: "Failed to load products. Please try again later.",
        variant: "destructive",
      });
    }
  }, [shopsError, productsError, toast]);

  // Log data for debugging
  useEffect(() => {
    if (shopsData) {
      console.log('Shops data:', shopsData);
    }
    if (productsData) {
      console.log('Products data:', productsData);
      console.log('Products data structure:', {
        hasData: !!productsData,
        dataShape: productsData ? Object.keys(productsData) : [],
        isArray: Array.isArray(productsData?.data),
        length: productsData?.data?.length || 0
      });
    }
  }, [shopsData, productsData]);

  // Extract products from the API response
  const products: PrintifyProduct[] = (productsData && productsData.data && Array.isArray(productsData.data))
    ? productsData.data
    : [];

  // Filter products based on search
  const filteredProducts = products.filter((product: PrintifyProduct) => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getProductImage = (product: PrintifyProduct) => {
    // Check if product has images and return the first preview image or first image
    if (product.images && product.images.length > 0) {
      const previewImage = product.images.find((img) => img.position === 'preview');
      return previewImage ? previewImage.src : product.images[0].src;
    }
    return 'https://via.placeholder.com/400?text=No+Image'; // Fallback image
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* API Configuration Alert */}
      <ApiConfigAlert />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Loading State */}
      {(isLoadingShops || isLoadingProducts) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-md mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {(shopsError || productsError) && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Products</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      )}

      {/* Products Grid */}
      {!isLoadingShops && !isLoadingProducts && !shopsError && !productsError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Products Found</h2>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <Link href={`/product/${product.id}`} className="block">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400?text=No+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>
                </Link>

                <CardContent className="p-4">
                  <Link href={`/product/${product.id}`} className="block">
                    <h3 className="font-medium text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                    <p className="text-lg font-bold mb-3">
                      ${(() => {
                        // Find the first enabled variant for accurate pricing
                        const enabledVariant = product.variants?.find(v => v.is_enabled);
                        const priceToShow = enabledVariant?.price || product.variants?.[0]?.price;
                        return priceToShow ? (priceToShow / 100).toFixed(2) : 'N/A';
                      })()}
                    </p>
                  </Link>

                  <div className="flex items-center justify-between gap-2">
                    <Button variant="secondary" className="flex-1" asChild>
                      <Link href={`/product/${product.id}`}>View Details</Link>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        // Quick add the first enabled variant to cart
                        if (product.variants && product.variants.length > 0) {
                          const enabledVariant = product.variants.find(v => v.is_enabled) || product.variants[0];
                          const size = enabledVariant.options?.size || 'One Size';

                          addToCart({
                            id: typeof product.id === 'string' ? parseInt(product.id) : 9999,
                            name: product.title,
                            price: enabledVariant.price / 100, // Convert cents to dollars
                            size: size,
                            image: getProductImage(product),
                            quantity: 1,
                          });

                          toast({
                            title: "Added to cart",
                            description: `${product.title} - ${size}`,
                          });
                        } else {
                          toast({
                            title: "Cannot add to cart",
                            description: "No variants available for this product",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Quick Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}