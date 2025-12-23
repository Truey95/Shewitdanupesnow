import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { 
  PrintifyProduct, 
  PrintifyShop, 
  PrintifyCreateProductPayload,
  PrintifyPublishProductPayload
} from "@/types/printify";

export function usePrintifyShops() {
  return useQuery<PrintifyShop[]>({
    queryKey: ["/api/printify/shops"],
    // Default to empty array if the API returns 204 (No Content) or empty response
    select: (data) => data || [],
    // Prevent infinite retry loops
    retry: false
  });
}

export function usePrintifyProducts(shopId: string) {
  return useQuery<{ data: PrintifyProduct[] }>({
    queryKey: [`/api/printify/shops/${shopId}/products`],
    enabled: !!shopId,
    // Default to empty data if the API returns 204 (No Content) or empty response
    select: (data) => data || { data: [] },
    // Prevent infinite retry loops
    retry: false,
    // Force fresh data - no cache
    refetchInterval: 15000, // Check every 15 seconds for faster updates
    staleTime: 0, // Data is immediately stale
    gcTime: 0 // Don't cache data
  });
}

export function usePrintifyProduct(shopId: string, productId: string) {
  return useQuery<PrintifyProduct>({
    queryKey: [`/api/printify/shops/${shopId}/products/${productId}`],
    enabled: !!shopId && !!productId,
    queryFn: async () => {
      const response = await fetch(`/api/printify/shops/${shopId}/products/${productId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Handle both wrapped and direct responses
      return result.data || result;
    },
    // Prevent infinite retry loops
    retry: false
  });
}

export function useCreatePrintifyProduct(shopId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData: PrintifyCreateProductPayload) => {
      const response = await fetch(`/api/printify/shops/${shopId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the products list so it refreshes
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${shopId}/products`] });
    }
  });
}

export function usePublishPrintifyProduct(shopId: string, productId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (publishData: PrintifyPublishProductPayload = {}) => {
      const response = await fetch(`/api/printify/shops/${shopId}/products/${productId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publishData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to publish product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate product data to refresh publishing status
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${shopId}/products/${productId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${shopId}/products`] });
    }
  });
}

export function useHaltPrintifyPublishing(shopId: string, productId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/printify/shops/${shopId}/products/${productId}/halt-publishing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to halt publishing');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${shopId}/products/${productId}`] });
    }
  });
}

export function useResetPrintifyPublishing(shopId: string, productId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/printify/shops/${shopId}/products/${productId}/reset-publishing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to reset publishing status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${shopId}/products/${productId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${shopId}/products`] });
    }
  });
}

export function usePrintifyPublishingStatus(shopId: string, productId: string) {
  return useQuery({
    queryKey: [`/api/printify/shops/${shopId}/products/${productId}/publishing-status`],
    enabled: !!shopId && !!productId,
    retry: false,
    refetchInterval: 5000 // Poll every 5 seconds for status updates
  });
}

export function useUnpublishPrintifyProduct(shopId: string, productId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/printify/shops/${shopId}/products/${productId}/unpublish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to unpublish product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${shopId}/products/${productId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${shopId}/products`] });
    }
  });
}

// Manual refresh function for when prices are updated in Printify
export function useRefreshPrintifyData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Force a fresh fetch of all Printify data
      await queryClient.invalidateQueries({ queryKey: ['/api/printify/shops'] });
      await queryClient.refetchQueries({ queryKey: ['/api/printify/shops'] });
      return { success: true };
    }
  });
}