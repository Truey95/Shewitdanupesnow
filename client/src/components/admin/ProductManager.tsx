import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  DollarSign,
  Edit,
  Save,
  Upload,
  RefreshCw,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrintifyShops, usePrintifyProducts, usePrintifyProduct, usePublishPrintifyProduct } from "@/hooks/use-printify";
import { useSyncProductPrice } from "@/hooks/use-orders";

interface ProductManagerProps {
  shopId?: string;
}

export default function ProductManager({ shopId }: ProductManagerProps) {
  const { toast } = useToast();
  const { data: shops, isLoading: shopsLoading } = usePrintifyShops();
  const [selectedShop, setSelectedShop] = useState(shopId || '21023003'); // Default to She Wit Da Nupes Now shop
  const [selectedProduct, setSelectedProduct] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = usePrintifyProducts(selectedShop);
  const { data: productDetails, refetch: refetchProduct } = usePrintifyProduct(selectedShop, selectedProduct);
  const publishMutation = usePublishPrintifyProduct(selectedShop, selectedProduct);
  const syncPriceMutation = useSyncProductPrice();
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleSyncAllProducts = async () => {
    if (!selectedShop) {
      toast({
        title: "No Shop Selected",
        description: "Please select a shop to sync.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncingAll(true);
    try {
      const response = await fetch('/api/products/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopId: selectedShop }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync products');
      }

      const result = await response.json();

      toast({
        title: "Sync Completed",
        description: `Synced ${result.stats.synced} products. ${result.stats.errors} errors.`,
      });

      refetchProducts();
    } catch (error) {
      console.error('Sync all error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync products from Printify",
        variant: "destructive",
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleShopSelect = (shopId: string) => {
    setSelectedShop(shopId);
    setSelectedProduct('');
    setEditingProduct(null);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setEditingProduct(null);
  };

  const handleEditProduct = () => {
    if (productDetails) {
      setEditingProduct({
        id: productDetails.id,
        title: productDetails.title,
        description: productDetails.description || '',
        variants: productDetails.variants?.map(variant => ({
          id: variant.id,
          price: variant.price || 0,
          title: (variant as any).title || (variant as any).name || `Variant ${variant.id}`,
          sku: variant.sku || ''
        })) || []
      });
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !selectedShop) return;

    try {
      // Update in Printify
      const response = await fetch(`/api/printify/shops/${selectedShop}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingProduct.title,
          description: editingProduct.description,
          variants: editingProduct.variants.map((variant: any) => ({
            ...variant,
            price: Math.round(variant.price * 100) // Convert to cents for Printify
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to update product');
      }

      // Sync price with Printify - use the first variant's price as base
      if (editingProduct.variants.length > 0) {
        await handleSyncPrice(editingProduct.id, editingProduct.variants[0].price);
      }

      // Sync with local database
      await fetch(`/api/products/${editingProduct.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printifyData: {
            title: editingProduct.title,
            description: editingProduct.description,
            variants: editingProduct.variants
          },
          shopId: selectedShop
        }),
      });

      toast({
        title: "Product Updated",
        description: "Product details and pricing have been successfully updated and synced.",
      });

      setEditingProduct(null);
      refetchProduct();
      refetchProducts();
    } catch (error) {
      console.error('Save product error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handlePublishProduct = async () => {
    if (!selectedProduct || !selectedShop) return;

    setIsPublishing(true);
    try {
      await publishMutation.mutateAsync({});

      // Sync the published state with local database
      await fetch(`/api/products/${selectedProduct}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printifyData: {
            id: selectedProduct,
            is_published: true
          },
          shopId: selectedShop
        }),
      });

      toast({
        title: "Product Published",
        description: "Product has been successfully published to your store and synced.",
      });

      refetchProduct();
      refetchProducts();
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Failed to publish product",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const updateVariantPrice = (variantId: number, newPrice: string) => {
    if (!editingProduct) return;

    setEditingProduct({
      ...editingProduct,
      variants: editingProduct.variants.map((variant: any) =>
        variant.id === variantId ? { ...variant, price: parseFloat(newPrice) || 0 } : variant
      )
    });
  };

  const handleSyncPrice = async (productId: string, newPrice: number) => {
    if (!selectedShop) return;

    try {
      await syncPriceMutation.mutateAsync({
        productId: parseInt(productId),
        price: newPrice,
        shopId: selectedShop,
        printifyProductId: productId
      });

      toast({
        title: "Price Synced",
        description: "Product price has been synchronized with Printify successfully.",
      });

      refetchProducts();
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync price with Printify",
        variant: "destructive",
      });
    }
  };

  if (shopsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading shops...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Package className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Product Management</h2>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleSyncAllProducts}
          disabled={isSyncingAll || !selectedShop}
          className="ml-auto"
        >
          {isSyncingAll ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync All to Local DB
        </Button>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shop Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Select Shop</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shops?.map((shop: any) => (
                    <Button
                      key={shop.id}
                      variant={selectedShop === shop.id.toString() ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleShopSelect(shop.id.toString())}
                    >
                      {shop.title}
                      <Badge className="ml-auto">{shop.sales_channel}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Product List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Products</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedShop ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {productsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading products...
                      </div>
                    ) : products?.data && products.data.length > 0 ? (
                      products.data.map((product: any) => (
                        <Button
                          key={product.id}
                          variant={selectedProduct === product.id.toString() ? "default" : "outline"}
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => handleProductSelect(product.id.toString())}
                        >
                          <div>
                            <div className="font-medium">{product.title}</div>
                            <div className="text-sm opacity-70">ID: {product.id}</div>
                          </div>
                        </Button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center p-4">No products found</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center p-4">Select a shop first</p>
                )}
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Product Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProduct && productDetails ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Title</Label>
                      <p className="text-sm text-gray-600">{productDetails.title}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {(productDetails as any).is_published ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Unpublished
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Variants</Label>
                      <div className="space-y-2 mt-2">
                        {productDetails.variants?.slice(0, 3).map((variant: any) => (
                          <div key={variant.id} className="text-sm">
                            <span className="font-medium">{variant.title}</span>
                            <span className="text-gray-500 ml-2">${variant.price}</span>
                          </div>
                        ))}
                        {productDetails.variants?.length > 3 && (
                          <p className="text-xs text-gray-500">+{productDetails.variants.length - 3} more variants</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={handleEditProduct} className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Product
                      </Button>
                      <Button
                        onClick={handlePublishProduct}
                        disabled={isPublishing}
                        className="w-full"
                        variant="outline"
                      >
                        {isPublishing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Publish Product
                      </Button>
                    </div>
                  </div>
                ) : selectedProduct ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading details...
                  </div>
                ) : (
                  <p className="text-gray-500 text-center p-4">Select a product to view details</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing">
          {editingProduct ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Edit Pricing - {editingProduct.title}</span>
                  </div>
                  <Button onClick={handleSaveProduct}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Product Title</Label>
                      <Input
                        id="title"
                        value={editingProduct.title}
                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-lg font-medium">Variant Pricing</Label>
                    <div className="space-y-3 mt-3">
                      {editingProduct.variants.map((variant: any) => (
                        <div key={variant.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{variant.title}</p>
                            <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm">$</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) => updateVariantPrice(variant.id, e.target.value)}
                              className="w-24"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>
                Please select a product and click "Edit Product" to modify pricing.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="publishing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Publishing Status</span>
              </CardTitle>
              <CardDescription>
                Manage product publishing to your connected sales channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProduct && productDetails ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{productDetails.title}</h3>
                      <p className="text-sm text-gray-500">Product ID: {productDetails.id}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {productDetails.is_published ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Unpublished
                        </Badge>
                      )}
                      <Button
                        onClick={handlePublishProduct}
                        disabled={isPublishing}
                        size="sm"
                      >
                        {isPublishing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {productDetails.is_published ? 'Republish' : 'Publish'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Select a product to view and manage its publishing status.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}