import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Tag, 
  Save, 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrintifyShops, usePrintifyProducts } from "@/hooks/use-printify";

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  category: 'swdnn' | 'hwdkn' | 'hwdrn' | 'hwdzn' | 'hwdpn';
  isVisible: boolean;
  pageRoute: string;
}

const CATEGORY_CONFIG = {
  swdnn: {
    name: "She Wit Da Nupes Now",
    route: "/collections/swdnn",
    color: "#8B0000",
    description: "Main collection"
  },
  hwdkn: {
    name: "He Wit Da K's Now", 
    route: "/collections/hwdkn",
    color: "#006400",
    description: "Greek organization themed"
  },
  hwdrn: {
    name: "He Wit Da Redz Now",
    route: "/collections/hwdrn", 
    color: "#FF0000",
    description: "Red-themed collection"
  },
  hwdzn: {
    name: "He Wit Da Zetas Now",
    route: "/collections/hwdzn",
    color: "#0000FF", 
    description: "Blue-themed collection"
  },
  hwdpn: {
    name: "He Wit Da Poodles Now",
    route: "/collections/hwdpn",
    color: "#FFD700",
    description: "Yellow-themed collection"
  }
};

export default function CategoryManager() {
  const { toast } = useToast();
  const { data: shops, isLoading: shopsLoading } = usePrintifyShops();
  const [selectedShop, setSelectedShop] = useState('21023003'); // Default to She Wit Da Nupes Now shop
  const [products, setProducts] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  
  const { data: rawProducts, isLoading: productsLoading } = usePrintifyProducts(selectedShop);

  useEffect(() => {
    if (rawProducts?.data) {
      const categorizedProducts: ProductCategory[] = rawProducts.data.map((product: any) => ({
        id: product.id.toString(),
        name: product.title || '',
        description: product.description || '',
        category: extractCategoryFromProduct(product),
        isVisible: product.is_published || false,
        pageRoute: getRouteForCategory(extractCategoryFromProduct(product))
      }));
      setProducts(categorizedProducts);
    }
  }, [rawProducts]);

  const extractCategoryFromProduct = (product: any): 'swdnn' | 'hwdkn' | 'hwdrn' | 'hwdzn' | 'hwdpn' => {
    const title = (product.title || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const tags = product.tags || [];
    
    // Check tags first
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      if (tagLower.includes('hwdkn') || tagLower.includes('kappa')) return 'hwdkn';
      if (tagLower.includes('hwdrn') || tagLower.includes('red')) return 'hwdrn';
      if (tagLower.includes('hwdzn') || tagLower.includes('zeta')) return 'hwdzn';
      if (tagLower.includes('hwdpn') || tagLower.includes('poodle')) return 'hwdpn';
      if (tagLower.includes('swdnn') || tagLower.includes('nupe')) return 'swdnn';
    }
    
    // Check title and description
    const text = `${title} ${description}`;
    if (text.includes('hwdkn') || text.includes('kappa') || text.includes("k's")) return 'hwdkn';
    if (text.includes('hwdrn') || text.includes('red')) return 'hwdrn';
    if (text.includes('hwdzn') || text.includes('zeta')) return 'hwdzn';
    if (text.includes('hwdpn') || text.includes('poodle')) return 'hwdpn';
    
    // Default to SWDNN
    return 'swdnn';
  };

  const getRouteForCategory = (category: string): string => {
    return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.route || '/collections/swdnn';
  };

  const updateProductCategory = async (productId: string, newCategory: string) => {
    if (!selectedShop) return;

    setIsSaving(true);
    const originalProduct = products.find(p => p.id === productId);
    
    try {
      // Optimistically update local state
      setProducts(products.map(p => 
        p.id === productId 
          ? { 
              ...p, 
              category: newCategory as any,
              pageRoute: getRouteForCategory(newCategory)
            }
          : p
      ));

      // Update product in Printify with category tags
      const printifyResponse = await fetch(`/api/printify/shops/${selectedShop}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: [newCategory.toUpperCase()],
        }),
      });

      if (!printifyResponse.ok) {
        const errorData = await printifyResponse.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to update product in Printify');
      }

      // Update category in local database
      const dbResponse = await fetch(`/api/products/${productId}/category`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: newCategory,
          printifyProductId: productId,
          shopId: selectedShop,
          name: originalProduct?.name,
          description: originalProduct?.description
        }),
      });

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to update product category in database');
      }

      toast({
        title: "Category Updated",
        description: `Product moved to ${CATEGORY_CONFIG[newCategory as keyof typeof CATEGORY_CONFIG]?.name}`,
      });

    } catch (error) {
      console.error('Category update error:', error);
      
      // Revert optimistic update on error
      if (originalProduct) {
        setProducts(products.map(p => 
          p.id === productId ? originalProduct : p
        ));
      }
      
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProductVisibility = async (productId: string) => {
    if (!selectedShop) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    setIsSaving(true);
    try {
      const newVisibility = !product.isVisible;
      
      // Update local state immediately
      setProducts(products.map(p => 
        p.id === productId ? { ...p, isVisible: newVisibility } : p
      ));

      // Update product visibility in Printify
      const endpoint = newVisibility 
        ? `/api/printify/shops/${selectedShop}/products/${productId}/publish`
        : `/api/printify/shops/${selectedShop}/products/${productId}/unpublish`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${newVisibility ? 'publish' : 'unpublish'} product`);
      }

      toast({
        title: newVisibility ? "Product Published" : "Product Unpublished",
        description: `Product is now ${newVisibility ? 'visible' : 'hidden'} on ${CATEGORY_CONFIG[product.category]?.name} page`,
      });

    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update visibility",
        variant: "destructive",
      });
      
      // Revert local state on error
      setProducts(products.map(p => 
        p.id === productId ? { ...p, isVisible: !product.isVisible } : p
      ));
    } finally {
      setIsSaving(false);
    }
  };

  const getProductsByCategory = (category: string) => {
    return products.filter(p => p.category === category);
  };

  if (shopsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span className="text-lg">Loading shops...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Tag className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600">Organize products into collections and manage page visibility</p>
        </div>
      </div>

      {/* Shop Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {shops?.map((shop: any) => (
              <Button
                key={shop.id}
                variant={selectedShop === shop.id.toString() ? "default" : "outline"}
                className="h-auto p-4 justify-start"
                onClick={() => setSelectedShop(shop.id.toString())}
              >
                <div className="text-left">
                  <div className="font-medium">{shop.title}</div>
                  <div className="text-xs opacity-70 capitalize">{shop.sales_channel}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Overview */}
      {selectedShop && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const categoryProducts = getProductsByCategory(key);
            const visibleProducts = categoryProducts.filter(p => p.isVisible);
            
            return (
              <Card key={key} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      style={{ backgroundColor: config.color, color: 'white' }}
                      className="text-xs"
                    >
                      {key.toUpperCase()}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {visibleProducts.length}/{categoryProducts.length} visible
                    </div>
                  </div>
                  <CardTitle className="text-sm font-medium">{config.name}</CardTitle>
                  <CardDescription className="text-xs">{config.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-500 mb-2">
                    Route: {config.route}
                  </div>
                  <div className="space-y-1">
                    {categoryProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="text-xs text-gray-700 truncate">
                        {product.isVisible ? '👁️' : '🚫'} {product.name}
                      </div>
                    ))}
                    {categoryProducts.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{categoryProducts.length - 3} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Category Management */}
      {selectedShop && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Categories</CardTitle>
            <CardDescription>
              Assign products to categories and control their visibility on collection pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading products...
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge 
                          style={{ 
                            backgroundColor: CATEGORY_CONFIG[product.category]?.color || '#gray',
                            color: 'white'
                          }}
                          className="text-xs"
                        >
                          {product.category.toUpperCase()}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          {product.isVisible ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500">
                            {product.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{product.description}</p>
                      <p className="text-xs text-gray-400">Route: {product.pageRoute}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Select
                        value={product.category}
                        onValueChange={(value) => updateProductCategory(product.id, value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {key.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleProductVisibility(product.id)}
                        disabled={isSaving}
                        className="p-2"
                      >
                        {product.isVisible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">No products available in this shop</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedShop && (
        <Alert>
          <Package className="w-4 h-4" />
          <AlertDescription>
            Please select a shop to manage product categories.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}