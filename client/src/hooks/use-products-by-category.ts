import { useQuery } from "@tanstack/react-query";

export interface ProductByCategory {
  id: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  printifyProductId?: string;
  printifyShopId?: string;
  printifyData?: any;
  isActive: boolean;
}

export function useProductsByCategory(category: string) {
  return useQuery<{ success: boolean; data: ProductByCategory[]; category: string; count: number }>({
    queryKey: ['products', 'category', category],
    queryFn: async () => {
      const response = await fetch(`/api/products/category/${category}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products by category');
      }
      return response.json();
    },
    enabled: !!category,
  });
}

export function useSyncProductFromPrintify() {
  return async (productId: string, printifyData: any, shopId: string) => {
    const response = await fetch(`/api/products/${productId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printifyData,
        shopId
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync product from Printify');
    }

    return response.json();
  };
}