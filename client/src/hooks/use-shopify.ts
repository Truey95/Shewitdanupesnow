import { useQuery } from "@tanstack/react-query";
import type { ShopifyProduct, ShopifyCollection } from "@/types/shopify";

export function useShopifyConnection() {
  return useQuery<{ status: string; message: string }>({
    queryKey: ["/api/shopify/test"],
    retry: false,
    // Consider "demo" mode as valid, not an error state
    select: (data) => {
      if (data?.status === "demo") {
        console.log("Shopify running in demo mode");
      }
      return data;
    },
    // Handle error responses (e.g., 503 status codes)
    refetchOnWindowFocus: false,
    refetchInterval: false
  });
}

export function useShopifyProducts() {
  return useQuery<{ products: ShopifyProduct[] }>({
    queryKey: ["/api/shopify/products"],
    // Default to empty array if the API returns 204 (No Content) or empty response
    select: (data) => data || { products: [] },
    // Prevent infinite retry loops
    retry: false
  });
}

export function useShopifyProduct(productId: string | number) {
  return useQuery<{ product: ShopifyProduct }>({
    queryKey: [`/api/shopify/products/${productId}`],
    enabled: !!productId,
    // Prevent infinite retry loops
    retry: false
  });
}

export function useShopifyCollections() {
  return useQuery<{ collections: ShopifyCollection[] }>({
    queryKey: ["/api/shopify/collections"],
    // Default to empty array if the API returns 204 (No Content) or empty response
    select: (data) => data || { collections: [] },
    // Prevent infinite retry loops
    retry: false
  });
}

export function useShopifyCollectionProducts(collectionId: string | number) {
  return useQuery<{ products: ShopifyProduct[] }>({
    queryKey: [`/api/shopify/collections/${collectionId}/products`],
    enabled: !!collectionId,
    // Default to empty array if the API returns 204 (No Content) or empty response
    select: (data) => data || { products: [] },
    // Prevent infinite retry loops
    retry: false
  });
}