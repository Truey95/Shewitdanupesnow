import { useMutation } from "@tanstack/react-query";

export interface PrintifyCheckoutData {
  shopId: string;
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
  shippingAddress: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
  billingAddress?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
}

export interface PrintifyOrderResponse {
  id: string;
  status: string;
  total_price: number;
  total_shipping: number;
  total_tax: number;
  line_items: Array<{
    id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
    price: number;
  }>;
}

export function useCreatePrintifyOrder() {
  return useMutation<PrintifyOrderResponse, Error, PrintifyCheckoutData>({
    mutationFn: async (checkoutData) => {
      const response = await fetch(`/api/printify/shops/${checkoutData.shopId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          line_items: checkoutData.items.map(item => ({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity
          })),
          shipping_method: 1, // Default shipping method
          send_shipping_notification: true,
          address_to: checkoutData.shippingAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to create Printify order');
      }

      return response.json();
    },
  });
}

export function useCalculatePrintifyShipping() {
  return useMutation<{ shipping_cost: number }, Error, PrintifyCheckoutData>({
    mutationFn: async (checkoutData) => {
      const response = await fetch(`/api/printify/shops/${checkoutData.shopId}/calculate-shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          line_items: checkoutData.items.map(item => ({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity
          })),
          address_to: checkoutData.shippingAddress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to calculate shipping');
      }

      return response.json();
    },
  });
}

export function useSubmitPrintifyOrderForProduction() {
  return useMutation<{ success: boolean }, Error, { shopId: string; orderId: string }>({
    mutationFn: async ({ shopId, orderId }) => {
      const response = await fetch(`/api/printify/shops/${shopId}/orders/${orderId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to submit order for production');
      }

      return response.json();
    },
  });
}