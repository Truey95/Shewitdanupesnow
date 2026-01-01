import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  Edit, 
  Save, 
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  Tags
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrintifyShops, usePrintifyProducts } from "@/hooks/use-printify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditableProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  status: 'published' | 'unpublished';
  isEditing: boolean;
  originalTitle: string;
  originalDescription: string;
  originalPrice: string;
  originalCategory: string;
  variants?: Array<{
    id: string;
    price: number;
    title?: string;
  }>;
}

const CATEGORIES = [
  { value: 'swdnn', label: 'SWDNN - She Wit Da Nupes Now' },
  { value: 'hwdkn', label: 'HWDKN - He Wit Da K\'s Now' },
  { value: 'hwdrn', label: 'HWDRN - He Wit Da Redz Now' },
  { value: 'hwdzn', label: 'HWDZN - He Wit Da Zetas Now' },
  { value: 'hwdpn', label: 'HWDPN - He Wit Da Poodles Now' }
];

export default function ProductEditor() {
  const { toast } = useToast();
  const { data: shops, isLoading: shopsLoading } = usePrintifyShops();
  const [selectedShop, setSelectedShop] = useState('21023003'); // Default to She Wit Da Nupes Now shop
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<EditableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: rawProducts, isLoading: productsLoading } = usePrintifyProducts(selectedShop);

  useEffect(() => {
    if (rawProducts?.data) {
      const editableProducts: EditableProduct[] = rawProducts.data.map((product: any) => ({
        id: product.id.toString(),
        title: product.title || '',
        description: product.description || '',
        price: product.variants?.[0]?.price ? (product.variants[0].price / 100).toFixed(2) : '0.00',
        category: 'swdnn', // Default category
        status: product.is_published ? 'published' : 'unpublished',
        isEditing: false,
        originalTitle: product.title || '',
        originalDescription: product.description || '',
        originalPrice: product.variants?.[0]?.price ? (product.variants[0].price / 100).toFixed(2) : '0.00',
        originalCategory: 'swdnn',
        variants: product.variants?.map((variant: any) => ({
          id: variant.id,
          price: variant.price || 0,
          title: variant.title || ''
        }))
      }));
      setProducts(editableProducts);
    }
  }, [rawProducts]);

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEdit = (productId: string) => {
    setProducts(products.map(product =>
      product.id === productId
        ? { ...product, isEditing: !product.isEditing }
        : product
    ));
  };

  const updateProduct = (productId: string, field: keyof EditableProduct, value: string) => {
    setProducts(products.map(product =>
      product.id === productId
        ? { ...product, [field]: value }
        : product
    ));
  };

  const saveProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || isSaving) return; // Prevent multiple saves

    console.log('[Frontend] Starting product save for productId:', productId);
    console.log('[Frontend] Product data being saved:', {
      title: product.title,
      price: product.price,
      category: product.category,
      shopId: selectedShop
    });

    setIsSaving(true);
    try {
      const priceValue = parseFloat(product.price);
      if (isNaN(priceValue) || priceValue < 0) {
        throw new Error('Invalid price value');
      }

      // Single comprehensive update call to avoid multiple API calls and potential loops
      console.log('[Frontend] Sending update request to backend...');
      console.log('[Frontend] Request URL:', `/api/products/${productId}/update`);
      
      const updateResponse = await fetch(`/api/products/${productId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: product.title,
          description: product.description,
          price: priceValue,
          category: product.category,
          shopId: selectedShop,
          printifyProductId: productId,
          variants: product.variants || []
        }),
      });
      
      console.log('[Frontend] Backend response status:', updateResponse.status);
      console.log('[Frontend] Backend response headers:', Object.fromEntries(updateResponse.headers.entries()));

      if (!updateResponse.ok) {
        console.error('[Frontend] Backend request failed with status:', updateResponse.status);
        let errorData = {};
        try {
          errorData = await updateResponse.json();
          console.error('[Frontend] Backend error response:', errorData);
        } catch (jsonError) {
          console.error('[Frontend] Failed to parse backend error response as JSON:', jsonError);
          const errorText = await updateResponse.text().catch(() => 'Unable to read error response');
          console.error('[Frontend] Backend error response text:', errorText);
        }
        throw new Error((errorData as any).details || (errorData as any).error || `Backend request failed with status ${updateResponse.status}`);
      }
      
      const responseData = await updateResponse.json();
      console.log('[Frontend] Backend success response:', responseData);

      // Update local state only after all operations succeed
      setProducts(products.map(p =>
        p.id === productId
          ? {
              ...p,
              isEditing: false,
              originalTitle: p.title,
              originalDescription: p.description,
              originalPrice: p.price,
              originalCategory: p.category
            }
          : p
      ));

      console.log('[Frontend] Product save completed successfully');
      toast({
        title: "Product Updated",
        description: `"${product.title}" has been successfully updated and synced with Printify.`,
      });
    } catch (error) {
      console.error('[Frontend] Save product error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        productId,
        productTitle: product?.title
      });
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      });
    } finally {
      console.log('[Frontend] Resetting loading state');
      setIsSaving(false);
    }
  };

  const cancelEdit = (productId: string) => {
    setProducts(products.map(product =>
      product.id === productId
        ? {
            ...product,
            isEditing: false,
            title: product.originalTitle,
            description: product.originalDescription,
            price: product.originalPrice,
            category: product.originalCategory
          }
        : product
    ));
  };

  const saveAllChanges = async () => {
    if (isSaving) return; // Prevent concurrent saves
    
    const editedProducts = products.filter(p => 
      p.isEditing && (
        p.title !== p.originalTitle || 
        p.description !== p.originalDescription || 
        p.price !== p.originalPrice ||
        p.category !== p.originalCategory
      )
    );

    if (editedProducts.length === 0) {
      toast({
        title: "No Changes",
        description: "No products have been modified.",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Process products sequentially to avoid API rate limits and conflicts
      const results = [];
      for (const product of editedProducts) {
        try {
          await saveProduct(product.id);
          results.push({ success: true, productId: product.id });
        } catch (error) {
          results.push({ success: false, productId: product.id, error });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        toast({
          title: "All Changes Saved",
          description: `Successfully updated ${successful} product(s).`,
        });
      } else {
        toast({
          title: "Partial Save Completed",
          description: `${successful} product(s) saved, ${failed} failed. Check individual products for errors.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Save all changes error:', error);
      toast({
        title: "Bulk Update Failed",
        description: "Failed to save product changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (shopsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading shops...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Editor</h2>
          <p className="text-gray-600">Edit product details, prices, and categories</p>
        </div>
        {products.some(p => p.isEditing) && (
          <Button 
            onClick={saveAllChanges}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save All Changes
          </Button>
        )}
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

      {/* Product Management */}
      {selectedShop && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Products</CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Badge variant="outline">
                  {filteredProducts.length} products
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading products...
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 transition-all ${
                      product.isEditing 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={
                            product.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {product.status === 'published' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {product.status}
                        </Badge>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <DollarSign className="w-4 h-4" />
                          {product.isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={product.price}
                              onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                              className="w-24 h-6 text-xs"
                              placeholder="0.00"
                            />
                          ) : (
                            <span>${product.price}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {product.isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => saveProduct(product.id)}
                              disabled={isSaving}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelEdit(product.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEdit(product.id)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Product Title</Label>
                          {product.isEditing ? (
                            <Input
                              value={product.title}
                              onChange={(e) => updateProduct(product.id, 'title', e.target.value)}
                              className="mt-1"
                              placeholder="Enter product title"
                            />
                          ) : (
                            <p className="mt-1 text-gray-900 font-medium">{product.title || 'No title set'}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Description</Label>
                          {product.isEditing ? (
                            <Textarea
                              value={product.description}
                              onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                              className="mt-1"
                              rows={3}
                              placeholder="Enter product description"
                            />
                          ) : (
                            <p className="mt-1 text-gray-600 text-sm">
                              {product.description || 'No description set'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <Tags className="w-4 h-4 mr-1" />
                          Category
                        </Label>
                        {product.isEditing ? (
                          <Select
                            value={product.category}
                            onValueChange={(value) => updateProduct(product.id, 'category', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="mt-1 text-gray-600 text-sm">
                            {CATEGORIES.find(c => c.value === product.category)?.label || 'No category set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms' : 'No products available in this shop'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedShop && (
        <Alert>
          <Package className="w-4 h-4" />
          <AlertDescription>
            Please select a shop to view and edit products.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}