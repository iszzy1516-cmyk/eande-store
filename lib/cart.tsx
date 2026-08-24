"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number; // kobo, unit price
  image: string;
  size: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string) => void;
  updateQty: (productId: string, size: string, qty: number) => void;
  clearCart: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ee_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore corrupted cart
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(() => {
    const key = (productId: string, size: string) => `${productId}::${size}`;

    return {
      items,
      addItem: (item) =>
        setItems((prev) => {
          const existing = prev.find(
            (i) => key(i.productId, i.size) === key(item.productId, item.size)
          );
          if (existing) {
            return prev.map((i) =>
              i === existing ? { ...i, qty: i.qty + item.qty } : i
            );
          }
          return [...prev, item];
        }),
      removeItem: (productId, size) =>
        setItems((prev) =>
          prev.filter((i) => key(i.productId, i.size) !== key(productId, size))
        ),
      updateQty: (productId, size, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter(
                (i) => key(i.productId, i.size) !== key(productId, size)
              )
            : prev.map((i) =>
                key(i.productId, i.size) === key(productId, size)
                  ? { ...i, qty }
                  : i
              )
        ),
      clearCart: () => setItems([]),
      count: items.reduce((sum, i) => sum + i.qty, 0),
      total: items.reduce((sum, i) => sum + i.qty * i.price, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
