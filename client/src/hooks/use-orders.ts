import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface OrderItem {
  id: number;
  productId: number;
  printifyProductId: string;
  printifyVariantId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  id: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: any;
  billingAddress?: any;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  printifyOrderId?: string;
  printifyStatus?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    }
  });
}

export function useOrder(orderId: number) {
  return useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      return response.json();
    },
    enabled: !!orderId
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, paymentData }: { orderId: number; paymentData: any }) => {
      const response = await fetch(`/api/orders/${orderId}/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', variables.orderId] });
    }
  });
}

export function useSyncProductPrice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, price, shopId, printifyProductId }: {
      productId: number;
      price: number;
      shopId: string;
      printifyProductId: string;
    }) => {
      const response = await fetch(`/api/products/${productId}/sync-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price, shopId, printifyProductId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync product price');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/printify/shops'] });
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${variables.shopId}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/printify/shops/${variables.shopId}/products/${variables.printifyProductId}`] });
    }
  });
}

export function useCalculateShipping() {
  return useMutation({
    mutationFn: async ({ shopId, orderData }: { shopId: string; orderData: any }) => {
      const response = await fetch(`/api/orders/calculate-shipping/${shopId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate shipping');
      }

      return response.json();
    }
  });
}