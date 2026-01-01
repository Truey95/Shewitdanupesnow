export interface PrintfulProduct {
  id: number;
  name: string;
  variants: PrintfulVariant[];
  thumbnail_url?: string;
  external_id?: string;
  sync_product?: {
    id: number;
    name: string;
    variants: number[];
  };
}

export interface PrintfulVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  price: string;
  sku: string;
  files?: PrintfulFile[];
  sync_variant_id?: number;
}

export interface PrintfulFile {
  id: number;
  type: string;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
  width: number;
  height: number;
  dpi: number;
  status: string;
  created: string;
  thumbnail_url: string;
  preview_url: string;
  visible: boolean;
}
