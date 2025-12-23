import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  usePrintifyShops, 
  useCreatePrintifyProduct,
  usePublishPrintifyProduct
} from "@/hooks/use-printify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  PrintifyCreateProductPayload,
  PrintifyPublishProductPayload 
} from "@/types/printify";

const productSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  blueprintId: z.string(),
  printProviderId: z.string(),
  price: z.string(),
  shopId: z.string()
});

export default function ProductUpload() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  
  const { data: shops, isLoading: isLoadingShops } = usePrintifyShops();
  const [selectedShopId, setSelectedShopId] = useState("21023003"); // Default to She Wit Da Nupes Now shop
  
  const createProduct = useCreatePrintifyProduct(selectedShopId);
  const publishProduct = usePublishPrintifyProduct(selectedShopId, selectedProduct);

  // Blueprint options for T-shirts
  const blueprints = [
    { id: 384, name: "Unisex Premium T-Shirt" },
    { id: 386, name: "Women's Premium T-Shirt" },
    { id: 387, name: "Men's Premium T-Shirt" },
    { id: 388, name: "Unisex Hoodie" },
    { id: 400, name: "Unisex Crewneck Sweatshirt" }
  ];
  
  // Print providers
  const printProviders = [
    { id: 1, name: "SPOKE Custom Products" },
    { id: 2, name: "ArtsAdd" },
    { id: 3, name: "T-Pop" },
    { id: 29, name: "SwiftPOD" }
  ];

  // Form for creating a new product
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      blueprintId: "",
      printProviderId: "",
      price: "29.99",
      shopId: ""
    },
  });

  useEffect(() => {
    if (shops && shops.length > 0 && !selectedShopId) {
      // Set the first shop as default
      setSelectedShopId(shops[0].id.toString());
      form.setValue("shopId", shops[0].id.toString());
    }
  }, [shops, form, selectedShopId]);

  // When user selects a shop, update the form value
  useEffect(() => {
    if (selectedShopId) {
      form.setValue("shopId", selectedShopId);
      
      // Fetch products for this shop
      fetch(`/api/printify/shops/${selectedShopId}/products`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setProducts(data.data);
          } else {
            setProducts([]);
          }
        })
        .catch(err => {
          console.error("Error fetching products", err);
          toast({
            title: "Error",
            description: "Failed to load products for selected shop",
            variant: "destructive"
          });
        });
    }
  }, [selectedShopId, form, toast]);

  async function onCreateProduct(values: z.infer<typeof productSchema>) {
    // Create product payload
    const productData: PrintifyCreateProductPayload = {
      title: values.title,
      description: values.description,
      blueprint_id: parseInt(values.blueprintId),
      print_provider_id: parseInt(values.printProviderId),
      variants: [
        {
          id: 1, // Default first variant
          price: parseFloat(form.watch("price")),
          is_enabled: true
        }
      ]
    };

    try {
      await createProduct.mutateAsync(productData);
      
      toast({
        title: "Success",
        description: "Product created successfully"
      });
      
      // Reset form
      form.reset();
      
      // Refresh products
      fetch(`/api/printify/shops/${selectedShopId}/products`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setProducts(data.data);
          }
        });
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
        variant: "destructive"
      });
    }
  }

  async function onPublishProduct() {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product to publish",
        variant: "destructive"
      });
      return;
    }

    const publishData: PrintifyPublishProductPayload = {
      publish_to_storefront: true
    };

    try {
      await publishProduct.mutateAsync(publishData);
      
      toast({
        title: "Success",
        description: "Product published successfully"
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish product",
        variant: "destructive"
      });
    }
  }

  if (isLoadingShops) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Product Management</h1>

      <div className="mb-6">
        <FormItem>
          <FormLabel>Select Shop</FormLabel>
          <Select 
            value={selectedShopId} 
            onValueChange={(value) => setSelectedShopId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a shop" />
            </SelectTrigger>
            <SelectContent>
              {shops?.map((shop) => (
                <SelectItem key={shop.id} value={shop.id.toString()}>
                  {shop.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="create">Create Product</TabsTrigger>
          <TabsTrigger value="publish">Publish Product</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Product</CardTitle>
              <CardDescription>
                Create a new product in your Printify shop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateProduct)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter product description" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="blueprintId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {blueprints.map((blueprint) => (
                                <SelectItem 
                                  key={blueprint.id} 
                                  value={blueprint.id.toString()}
                                >
                                  {blueprint.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of product you want to create
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="printProviderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Print Provider</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {printProviders.map((provider) => (
                                <SelectItem 
                                  key={provider.id} 
                                  value={provider.id.toString()}
                                >
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The company that will print and fulfill your product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="29.99" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Price in USD
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={createProduct.isPending}
                  >
                    {createProduct.isPending ? "Creating..." : "Create Product"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle>Publish Product</CardTitle>
              <CardDescription>
                Publish an existing product to your storefront
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <Alert>
                  <AlertTitle>No products found</AlertTitle>
                  <AlertDescription>
                    You need to create a product first before you can publish it
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <FormItem className="mb-4">
                    <FormLabel>Select Product</FormLabel>
                    <Select 
                      value={selectedProduct} 
                      onValueChange={setSelectedProduct}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <Button 
                    onClick={onPublishProduct}
                    disabled={!selectedProduct || publishProduct.isPending}
                    className="w-full md:w-auto"
                  >
                    {publishProduct.isPending ? "Publishing..." : "Publish to Store"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}