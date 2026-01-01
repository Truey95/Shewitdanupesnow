import { useState, useEffect } from "react";
import { useShopifyProducts, useShopifyCollections } from "@/hooks/use-shopify";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShopifyConfigAlert } from "@/components/ShopifyConfigAlert";
import type { ShopifyProduct } from "@/types/shopify";

export default function ShopifyProducts() {
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const { toast } = useToast();

  // Get products
  const { 
    data: productsData, 
    isLoading: isLoadingProducts, 
    error: productsError 
  } = useShopifyProducts();

  // Get collections
  const { 
    data: collectionsData, 
    isLoading: isLoadingCollections, 
    error: collectionsError 
  } = useShopifyCollections();

  // Effect to show errors if any
  useEffect(() => {
    if (productsError) {
      console.error('Products error:', productsError);
      toast({
        title: "Error Loading Products",
        description: "Failed to load Shopify products. Please check API configuration or try again later.",
        variant: "destructive",
      });
    }
    if (collectionsError) {
      console.error('Collections error:', collectionsError);
      toast({
        title: "Error Loading Collections",
        description: "Failed to load Shopify collections. Please check API configuration or try again later.",
        variant: "destructive",
      });
    }
  }, [productsError, collectionsError, toast]);

  // Log data for debugging
  useEffect(() => {
    if (productsData) {
      console.log('Shopify products data:', productsData);
    }
    if (collectionsData) {
      console.log('Shopify collections data:', collectionsData);
    }
  }, [productsData, collectionsData]);

  // Get products array from data
  const products = productsData?.products || [];
  const collections = collectionsData?.collections || [];

  // Filter products based on search and selected collection
  const filteredProducts = products.filter((product: ShopifyProduct) => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase());
    // If "all" is selected or no collection is selected, show all products
    const matchesCollection = selectedCollection === "all" || selectedCollection === "";
    return matchesSearch && matchesCollection;
  });

  const getProductImage = (product: ShopifyProduct) => {
    // Check if product has images and return the first image
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    // If product has a featured image
    if (product.image && product.image.src) {
      return product.image.src;
    }
    return 'https://via.placeholder.com/400?text=No+Image'; // Fallback image
  };

  const formatPrice = (price: string) => {
    // Convert string price to number and format as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(price));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Shopify API Configuration Alert */}
      <ShopifyConfigAlert />
      
      <h1 className="text-2xl font-bold mb-6">Shopify Products</h1>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        
        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id.toString()}>
                {collection.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {(isLoadingProducts || isLoadingCollections) && (
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

      {/* Products Grid */}
      {!isLoadingProducts && !isLoadingCollections && (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={getProductImage(product)}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h2 className="font-semibold truncate">{product.title}</h2>
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-medium text-primary">
                          {product.variants && product.variants.length > 0
                            ? formatPrice(product.variants[0].price)
                            : 'Price unavailable'}
                        </p>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}