import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  size: string;
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
}

const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
    }),
    {
      name: "cart-storage",
    }
  )
);

export const useCart = () => useCartStore((state) => state.items);

export const addToCart = (item: Omit<CartItem, "quantity"> & { quantity: number }) => {
  const currentItems = useCartStore.getState().items;
  const existingItem = currentItems.find(
    (i) => i.id === item.id && i.size === item.size
  );

  if (existingItem) {
    const updatedItems = currentItems.map((i) =>
      i.id === item.id && i.size === item.size
        ? { ...i, quantity: i.quantity + item.quantity }
        : i
    );
    useCartStore.getState().setItems(updatedItems);
  } else {
    useCartStore.getState().setItems([...currentItems, item]);
  }
};

export const updateQuantity = (id: number, size: string, quantity: number) => {
  const currentItems = useCartStore.getState().items;
  if (quantity < 1) return;

  const updatedItems = currentItems.map((item) =>
    item.id === id && item.size === size ? { ...item, quantity } : item
  );
  useCartStore.getState().setItems(updatedItems);
};

export const removeFromCart = (id: number, size: string) => {
  const currentItems = useCartStore.getState().items;
  const updatedItems = currentItems.filter(
    (item) => !(item.id === id && item.size === size)
  );
  useCartStore.getState().setItems(updatedItems);
};
