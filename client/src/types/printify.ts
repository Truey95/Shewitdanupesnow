export interface PrintifyProductImage {
  src: string;
  variant_ids: number[];
  position: string;
  is_default: boolean;
  is_selected_for_publishing: boolean;
  order: number | null;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: PrintifyProductImage[];
  variants: PrintifyVariant[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id?: number;
  print_provider_id?: number;
  print_areas?: Record<string, PrintifyPrintArea>;
  options?: PrintifyProductOption[];
}

export interface PrintifyPrintArea {
  variant_ids: number[];
  placeholders: PrintifyPlaceholder[];
}

export interface PrintifyPlaceholder {
  position: string;
  images: PrintifyPlaceholderImage[];
}

export interface PrintifyPlaceholderImage {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface PrintifyProductOption {
  name: string;
  type: string;
  values: PrintifyOptionValue[];
}

export interface PrintifyOptionValue {
  id: number;
  title: string;
}

export interface PrintifyVariant {
  id: number;
  sku: string;
  price: number;
  title: string;
  is_enabled: boolean;
  is_available: boolean;
  options: number[] | Record<string, string>;
  quantity: number;
}

export interface PrintifyShop {
  id: string;
  title: string;
  sales_channel: string;
}

export interface PrintifyResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PrintifyCreateProductPayload {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: {
    id: number;
    price: number;
    is_enabled: boolean;
  }[];
  print_areas?: Record<string, {
    variant_ids: number[];
    placeholders: {
      position: string;
      images: {
        id: string | number;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }[];
    }[];
  }>;
}

export interface PrintifyPublishProductPayload {
  title?: string;
  description?: string;
  shipping_template_id?: number;
  publish_to_storefront?: boolean;
  external?: {
    channels?: {
      shopify?: {
        publish?: boolean;
        product_id?: string;
      };
      etsy?: {
        publish?: boolean;
        product_id?: string;
      };
      ebay?: {
        publish?: boolean;
        product_id?: string;
      };
    };
  };
}
