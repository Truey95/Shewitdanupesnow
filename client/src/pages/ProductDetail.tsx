import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { addToCart } from "@/lib/cart";
import { usePrintifyShops, usePrintifyProduct } from "@/hooks/use-printify";
import { Skeleton } from "@/components/ui/skeleton";
import type { PrintifyProductImage, PrintifyVariant, PrintifyProduct } from "@/types/printify";
import { sampleProducts } from "@/data/sample-products";
import { ApiConfigAlert } from "@/components/ApiConfigAlert";
import { PublishingManager } from "@/components/PublishingManager";

export default function ProductDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [selectedSize, setSelectedSize] = useState("");
  const [printifyProductId, setPrintifyProductId] = useState<string>("");
  const [dbShopId, setDbShopId] = useState<string>("");
  const { toast } = useToast();

  // Get the first shop ID
  const { data: shops, isLoading: isLoadingShops, error: shopsError } = usePrintifyShops();
  const shopId = shops && shops.length > 0 ? shops[0]?.id?.toString() : "";

  // Check if ID is a local database ID or Printify ID, and get the Printify ID
  useEffect(() => {
    const checkProductId = async () => {
      if (!id) {
        console.log('[ProductDetail] No product ID provided');
        return;
      }

      // If ID looks like a Printify ID (long hex string), use it directly
      if (id.length > 10 && /^[a-f0-9]+$/.test(id)) {
        setPrintifyProductId(id);
      } else {
        // Otherwise, it's a local database ID - fetch the Printify ID
        try {
          const response = await fetch(`/api/products/${id}`);

          if (response.ok) {
            const product = await response.json();

            // Check both possible field names for compatibility
            const printifyId = product.printifyProductId || product.printify_product_id;
            const printifyShopId = product.printifyShopId || product.printify_shop_id;

            if (printifyId) {
              setPrintifyProductId(printifyId);
              if (printifyShopId) {
                setDbShopId(printifyShopId);
              }
            } else {
              throw new Error('No Printify product ID found');
            }
          } else {
            throw new Error('Product not found in database');
          }
        } catch (error) {
          toast({
            title: "Product not found",
            description: "We couldn't find the product you're looking for.",
            variant: "destructive",
          });
          navigate("/products");
        }
      }
    };

    checkProductId();
  }, [id, toast, navigate]);

  // Use the shop ID from the database if available, otherwise fallback to the first shop
  const activeShopId = dbShopId || shopId;

  // Get the product data from the Printify API
  const { data: productData, isLoading: isLoadingProduct, error: productError } = usePrintifyProduct(
    activeShopId,
    printifyProductId
  );

  const product = productData;
  const isLoading = isLoadingShops || isLoadingProduct || !printifyProductId;
  const error = shopsError || productError;

  // Redirect to products page if there's an error
  useEffect(() => {
    if (error && !isLoading && printifyProductId) {
      toast({
        title: "Product not found",
        description: "We couldn't find the product you're looking for.",
        variant: "destructive",
      });
      navigate("/products");
    }
  }, [error, isLoading, printifyProductId, toast, navigate]);

  // Get available sizes from the enabled variants only
  const getSizesFromVariants = (variants: PrintifyVariant[] = []) => {
    // Extract unique sizes from enabled variants only
    const sizes = new Set<string>();
    variants.forEach(variant => {
      if (variant.is_enabled && variant.title) {
        // Extract size from variant title (e.g., "Black / S" -> "S")
        const titleParts = variant.title.split(' / ');
        if (titleParts.length >= 2) {
          const size = titleParts[titleParts.length - 1]; // Last part is the size
          sizes.add(size);
        }
      }
    });

    return Array.from(sizes).map(size => ({
      size,
      inStock: 1 // We're assuming all enabled variants are in stock
    }));
  };

  // Get the first image or a placeholder
  const getMainImage = (images: PrintifyProductImage[] = []) => {
    if (images.length > 0 && images[0].src) {
      return images[0].src;
    }
    return "/images/product-placeholder.jpg";
  };

  // Get the price from the first enabled variant (convert cents to dollars)
  const getPrice = (variants: PrintifyVariant[] = []) => {
    if (variants.length > 0) {
      // Prioritize enabled variants for accurate pricing
      const enabledVariant = variants.find(v => v.is_enabled);
      const variantToUse = enabledVariant || variants[0];
      return variantToUse.price / 100; // Convert cents to dollars
    }
    return 0;
  };

  // This function is no longer needed as we handle add to cart in renderProductDetails

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="bg-gray-200 aspect-square w-full max-w-xl rounded-lg mb-4" />
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  // If API request failed but we have sample products, try to use one of them
  if (!product) {
    // Try to find a sample product with the matching ID
    const sampleProduct = sampleProducts.find(p => p.id === id);

    // If we found a sample product, use it instead
    if (sampleProduct) {
      return renderProductDetails(sampleProduct);
    }

    // If no sample product matches, show the not found message
    return (
      <div className="container mx-auto py-8">
        {/* API Configuration Alert */}
        <ApiConfigAlert />

        <div className="text-center mt-8">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <p className="mt-2">We couldn't find the product you're looking for.</p>
          <Button
            className="mt-4"
            onClick={() => navigate("/products")}
          >
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  // Function to render product details 
  function renderProductDetails(productToRender: PrintifyProduct) {
    const sizes = getSizesFromVariants(productToRender.variants);
    const mainImage = getMainImage(productToRender.images);
    const price = getPrice(productToRender.variants);

    return (
      <div className="container mx-auto py-8">
        {/* API Configuration Alert */}
        <ApiConfigAlert />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="aspect-square">
            <img
              src={mainImage}
              alt={productToRender.title}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/images/product-placeholder.jpg';
              }}
            />
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{productToRender.title}</h1>
              <p className="text-2xl text-primary">${price.toFixed(2)}</p>
            </div>

            <div>
              <h3 className="font-medium mb-4">Select Size</h3>
              {sizes.length > 0 ? (
                <RadioGroup
                  value={selectedSize}
                  onValueChange={setSelectedSize}
                  className="grid grid-cols-4 gap-2"
                >
                  {sizes.map((size) => (
                    <div key={size.size}>
                      <RadioGroupItem
                        value={size.size}
                        id={size.size}
                        className="peer sr-only"
                        disabled={size.inStock === 0}
                      />
                      <Label
                        htmlFor={size.size}
                        className="flex h-12 items-center justify-center rounded-md border border-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
                      >
                        {size.size}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <p>No sizes available</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (!selectedSize) {
                    toast({
                      title: "Please select a size",
                      variant: "destructive",
                    });
                    return;
                  }

                  addToCart({
                    id: productToRender.id,
                    name: productToRender.title,
                    price: getPrice(productToRender.variants), // Already converted to dollars
                    size: selectedSize,
                    image: getMainImage(productToRender.images),
                    quantity: 1,
                  });

                  toast({
                    title: "Added to cart",
                    description: `${productToRender.title} - Size ${selectedSize}`,
                  });
                }}
                disabled={sizes.length === 0}
                variant="outline"
              >
                Add to Cart
              </Button>

              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (!selectedSize) {
                    toast({
                      title: "Please select a size",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Add to cart and then navigate to checkout
                  addToCart({
                    id: productToRender.id,
                    name: productToRender.title,
                    price: getPrice(productToRender.variants), // Already converted to dollars
                    size: selectedSize,
                    image: getMainImage(productToRender.images),
                    quantity: 1,
                  });

                  // Navigate to cart/checkout page
                  navigate("/cart");
                }}
                disabled={sizes.length === 0}
              >
                Buy Now
              </Button>
            </div>


            <div className="prose prose-sm">
              <h3>Product Details</h3>
              <p>{productToRender.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For the real product from API, use our rendering function
  return renderProductDetails(product);
}
