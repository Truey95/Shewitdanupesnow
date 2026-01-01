import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useShopifyProduct } from "@/hooks/use-shopify";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShopifyConfigAlert } from "@/components/ShopifyConfigAlert";
import { useToast } from "@/hooks/use-toast";
import { addToCart } from "@/lib/cart";
import type { ShopifyProduct, ShopifyVariant } from "@/types/shopify";

export default function ShopifyProductDetail() {
  const { productId } = useParams();
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const { toast } = useToast();

  const { 
    data, 
    isLoading, 
    error 
  } = useShopifyProduct(productId || "");

  // Get the product from data
  const product = data?.product;

  // Set the first variant as default when product loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0].id.toString());
    }
  }, [product]);

  // Show error if any
  useEffect(() => {
    if (error) {
      console.error('Product error:', error);
      toast({
        title: "Error Loading Product",
        description: "Failed to load product details. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    const variant = product.variants.find(v => v.id.toString() === selectedVariant);
    if (!variant) return;
    
    addToCart({
      id: product.id,
      name: product.title,
      price: parseFloat(variant.price),
      size: variant.title,
      image: product.image ? product.image.src : (product.images.length > 0 ? product.images[0].src : ''),
      quantity
    });
    
    toast({
      title: "Added to Cart",
      description: `${product.title} (${variant.title}) has been added to your cart.`,
    });
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(price));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ShopifyConfigAlert />
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-200 aspect-square rounded-md" />
            <div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
              <div className="h-32 bg-gray-200 rounded mb-8" />
              <div className="h-10 bg-gray-200 rounded w-full mb-4" />
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ShopifyConfigAlert />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/shopify">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ShopifyConfigAlert />
      
      <div className="mb-4">
        <Link href="/shopify">
          <Button variant="ghost" size="sm">
            ← Back to Products
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gray-100 rounded-md">
          <img
            src={product.image ? product.image.src : (product.images.length > 0 ? product.images[0].src : '')}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          <p className="text-2xl text-primary font-semibold mb-6">
            {product.variants && product.variants.length > 0 ? 
              formatPrice(product.variants.find(v => v.id.toString() === selectedVariant)?.price || product.variants[0].price) : 
              'Price unavailable'}
          </p>
          
          <div className="mb-6" dangerouslySetInnerHTML={{ __html: product.body_html || '' }} />
          
          {/* Variant Selection */}
          {product.variants && product.variants.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                {product.options[0]?.name || 'Options'}
              </label>
              <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {product.variants.map((variant: ShopifyVariant) => (
                    <SelectItem key={variant.id} value={variant.id.toString()}>
                      {variant.title} - {formatPrice(variant.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              >
                -
              </Button>
              <span className="px-4">{quantity}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuantity(prev => prev + 1)}
              >
                +
              </Button>
            </div>
          </div>
          
          {/* Add to Cart */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleAddToCart}
            disabled={!selectedVariant}
          >
            Add to Cart
          </Button>
          
          {/* Additional Info */}
          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Vendor:</span> {product.vendor}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium">Type:</span> {product.product_type}
            </p>
            {product.tags && (
              <p className="text-sm text-gray-500">
                <span className="font-medium">Tags:</span> {product.tags}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}