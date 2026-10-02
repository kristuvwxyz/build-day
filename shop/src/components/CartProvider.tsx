"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, PaymentOption } from "@/lib/types";

type CartCtx = {
  items: CartItem[];
  loaded: boolean; // true once the saved cart has been read from the browser
  count: number;
  add: (item: CartItem) => void;
  setQuantity: (productId: string, paymentOption: PaymentOption, qty: number) => void;
  setPaymentOption: (productId: string, from: PaymentOption, to: PaymentOption) => void;
  remove: (productId: string, paymentOption: PaymentOption) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "shop-cart-v1";
const same = (a: CartItem, id: string, opt: PaymentOption) =>
  a.productId === id && a.paymentOption === opt;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  const merge = (list: CartItem[], item: CartItem) => {
    const existing = list.find((i) => same(i, item.productId, item.paymentOption));
    if (!existing) return [...list, item];
    return list.map((i) =>
      i === existing ? { ...i, quantity: i.quantity + item.quantity } : i,
    );
  };

  const value: CartCtx = {
    items,
    loaded,
    count: items.reduce((s, i) => s + i.quantity, 0),
    add: (item) => setItems((list) => merge(list, item)),
    setQuantity: (id, opt, qty) =>
      setItems((list) =>
        list.map((i) => (same(i, id, opt) ? { ...i, quantity: Math.max(1, qty) } : i)),
      ),
    setPaymentOption: (id, from, to) =>
      setItems((list) => {
        const item = list.find((i) => same(i, id, from));
        if (!item || from === to) return list;
        return merge(
          list.filter((i) => i !== item),
          { ...item, paymentOption: to },
        );
      }),
    remove: (id, opt) => setItems((list) => list.filter((i) => !same(i, id, opt))),
    clear: () => setItems([]),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
