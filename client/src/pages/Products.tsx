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
import { cn } from "@/lib/utils";

const EXCLUDED_KEYWORDS = ['SWDNN', 'HWDKN', 'HWDZN', 'HWDRN', 'HWDPN', 'HWTPN'];

const PRODUCT_TYPES = [
  { id: 'all', label: 'All Products' },
  { id: 'shirts', label: 'Shirts', keywords: ['shirt', 'tee', 'top', 'blouse', 'polo'] },
  { id: 'shoes', label: 'Shoes', keywords: ['shoe', 'sneaker', 'boot', 'sandal'] },
  { id: 'shorts', label: 'Shorts', keywords: ['short', 'trunk'] },
  { id: 'bags', label: 'Bags', keywords: ['bag', 'backpack', 'tote', 'purse'] },
  { id: 'hats', label: 'Hats', keywords: ['hat', 'cap', 'beanie'] },
  { id: 'towels', label: 'Towels', keywords: ['towel'] },
];

export default function Products() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState('all');
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

  // Extract products from the API response
  const products: PrintifyProduct[] = (productsData && productsData.data && Array.isArray(productsData.data))
    ? productsData.data
    : [];

  // Filter products
  const filteredProducts = products.filter((product: PrintifyProduct) => {
    const titleUpper = product.title.toUpperCase();

    // 1. Exclude special categories
    if (EXCLUDED_KEYWORDS.some(keyword => titleUpper.includes(keyword))) {
      return false;
    }

    // 2. Filter by Search
    if (search && !product.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // 3. Filter by Type
    if (selectedType !== 'all') {
      const typeConfig = PRODUCT_TYPES.find(t => t.id === selectedType);
      if (typeConfig?.keywords) {
        const matchesType = typeConfig.keywords.some(k => titleUpper.includes(k.toUpperCase()) || (product.tags && product.tags.includes(k)));
        if (!matchesType) return false;
      }
    }

    return true;
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

      <h1 className="text-4xl font-bold mb-8 text-center font-serif">Our Products</h1>

      {/* Filters and Search */}
      <div className="flex flex-col gap-6 mb-8">

        {/* Type Filter Bar */}
        <div className="flex flex-wrap gap-2 justify-center">
          {PRODUCT_TYPES.map((type) => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? "default" : "outline"}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                "rounded-full px-6 transition-all",
                selectedType === type.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent"
              )}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex justify-center">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md w-full"
          />
        </div>
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
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
              <Button
                variant="link"
                onClick={() => { setSearch(''); setSelectedType('all'); }}
                className="mt-2"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow border-none shadow-sm">
                <Link href={`/product/${product.id}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400?text=No+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>
                </Link>

                <CardContent className="p-4 bg-card">
                  <Link href={`/product/${product.id}`} className="block">
                    <h3 className="font-medium text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors truncate" title={product.title}>{product.title}</h3>
                    <p className="text-lg font-bold mb-3 text-red-600">
                      ${(() => {
                        // Find the first enabled variant for accurate pricing
                        const enabledVariant = product.variants?.find(v => v.is_enabled);
                        const priceToShow = enabledVariant?.price || product.variants?.[0]?.price;
                        return priceToShow ? (priceToShow / 100).toFixed(2) : 'N/A';
                      })()}
                    </p>
                  </Link>

                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <Button variant="secondary" className="flex-1 text-xs" asChild size="sm">
                      <Link href={`/product/${product.id}`}>View</Link>
                    </Button>

                    <Button
                      variant="default"
                      className="flex-1 text-xs"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        // Quick add the first enabled variant to cart
                        if (product.variants && product.variants.length > 0) {
                          const enabledVariant = product.variants.find(v => v.is_enabled) || product.variants[0];
                          const size = (enabledVariant.options as any)?.size || 'One Size';

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
                      Add
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