import type { PrintifyProduct } from "../types/printify";

// Sample products to display when Printify API is not configured
export const sampleProducts: PrintifyProduct[] = [
  {
    id: "sample-1",
    title: "Classic Black T-Shirt",
    description: "A comfortable black t-shirt made from premium cotton.",
    images: [
      {
        src: "/images/products/product-1.jpg",
        variant_ids: [1],
        position: "front",
        is_default: true,
        is_selected_for_publishing: true,
        order: 0
      }
    ],
    variants: [
      {
        id: 1,
        sku: "BLK-TSH-S",
        price: 24.99,
        is_enabled: true,
        is_available: true,
        title: "Black / S",
        options: { color: "Black", size: "S" },
        quantity: 10
      },
      {
        id: 2,
        sku: "BLK-TSH-M",
        price: 24.99,
        is_enabled: true,
        is_available: true,
        title: "Black / M",
        options: { color: "Black", size: "M" },
        quantity: 15
      },
      {
        id: 3,
        sku: "BLK-TSH-L",
        price: 24.99,
        is_enabled: true,
        is_available: true,
        title: "Black / L",
        options: { color: "Black", size: "L" },
        quantity: 12
      }
    ],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    visible: true,
    is_locked: false
  },
  {
    id: "sample-2",
    title: "Premium Hoodie",
    description: "A warm and stylish hoodie perfect for cooler weather.",
    images: [
      {
        src: "/images/products/product-2.jpg",
        variant_ids: [1],
        position: "front",
        is_default: true,
        is_selected_for_publishing: true,
        order: 0
      }
    ],
    variants: [
      {
        id: 1,
        sku: "GRY-HOD-S",
        price: 49.99,
        is_enabled: true,
        is_available: true,
        title: "Gray / S",
        options: { color: "Gray", size: "S" },
        quantity: 8
      },
      {
        id: 2,
        sku: "GRY-HOD-M",
        price: 49.99,
        is_enabled: true,
        is_available: true,
        title: "Gray / M",
        options: { color: "Gray", size: "M" },
        quantity: 10
      },
      {
        id: 3,
        sku: "GRY-HOD-L",
        price: 49.99,
        is_enabled: true,
        is_available: true,
        title: "Gray / L",
        options: { color: "Gray", size: "L" },
        quantity: 5
      }
    ],
    created_at: "2023-01-02T00:00:00Z",
    updated_at: "2023-01-02T00:00:00Z",
    visible: true,
    is_locked: false
  },
  {
    id: "sample-3",
    title: "Athletic Cap",
    description: "A stylish and comfortable cap for outdoor activities.",
    images: [
      {
        src: "/images/products/product-3.jpg",
        variant_ids: [1],
        position: "front",
        is_default: true,
        is_selected_for_publishing: true,
        order: 0
      }
    ],
    variants: [
      {
        id: 1,
        sku: "BLU-CAP-OS",
        price: 19.99,
        is_enabled: true,
        is_available: true,
        title: "Blue / One Size",
        options: { color: "Blue", size: "One Size" },
        quantity: 20
      }
    ],
    created_at: "2023-01-03T00:00:00Z",
    updated_at: "2023-01-03T00:00:00Z",
    visible: true,
    is_locked: false
  }
];