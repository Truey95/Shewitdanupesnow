import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import { Search, Package, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIES = [
  { 
    value: 'swdnn', 
    label: 'SWDNN', 
    title: 'She Wit Da Nupes Now',
    description: 'Main collection featuring luxury apparel for modern women',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    value: 'hwdkn', 
    label: 'HWDKN', 
    title: 'He Wit Da K\'s Now',
    description: 'Greek organization themed collection',
    color: 'bg-red-100 text-red-800'
  },
  { 
    value: 'hwdrn', 
    label: 'HWDRN', 
    title: 'He Wit Da Redz Now',
    description: 'Red-themed luxury collection',
    color: 'bg-red-100 text-red-800'
  },
  { 
    value: 'hwdzn', 
    label: 'HWDZN', 
    title: 'He Wit Da Zetas Now',
    description: 'Blue-themed collection',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    value: 'hwdpn', 
    label: 'HWDPN', 
    title: 'He Wit Da Poodles Now',
    description: 'Yellow-themed collection',
    color: 'bg-yellow-100 text-yellow-800'
  }
];

function CategoryProducts({ category }: { category: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products/category', category],
    queryFn: async () => {
      const response = await fetch(`/api/products/category/${category}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  const filteredProducts = products?.data?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const categoryInfo = CATEGORIES.find(c => c.value === category);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Badge className={categoryInfo?.color || 'bg-gray-100 text-gray-800'}>
            {categoryInfo?.label}
          </Badge>
          <h1 className="text-3xl font-bold">{categoryInfo?.title}</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {categoryInfo?.description}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredProducts.length} products
        </Badge>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product: any) => (
            <ProductCard 
              key={product.id} 
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl || '/placeholder-product.jpg'
              }} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : `No products available in ${categoryInfo?.title}`}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Collections() {
  const [activeCategory, setActiveCategory] = useState('swdnn');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Our Collections</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our curated collections of luxury apparel, each designed for different styles and occasions.
          </p>
        </div>

        {/* Collection Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            {CATEGORIES.map((category) => (
              <TabsTrigger 
                key={category.value} 
                value={category.value}
                className="text-sm font-medium"
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((category) => (
            <TabsContent key={category.value} value={category.value}>
              <CategoryProducts category={category.value} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}