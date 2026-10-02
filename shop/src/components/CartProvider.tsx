"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, PaymentOption } from "@/lib/types";

export type CartExtras = { note: string; specialPackaging: boolean; voucherCode: string };
const NO_EXTRAS: CartExtras = { note: "", specialPackaging: false, voucherCode: "" };

type CartCtx = {
  items: CartItem[];
  extras: CartExtras; // NOTE, special packaging, voucher code
  setExtras: (patch: Partial<CartExtras>) => void;
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
  const [extras, setExtrasState] = useState<CartExtras>(NO_EXTRAS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setItems(JSON.parse(saved));
      const savedExtras = localStorage.getItem(KEY + "-extras");
      if (savedExtras) setExtrasState({ ...NO_EXTRAS, ...JSON.parse(savedExtras) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      localStorage.setItem(KEY + "-extras", JSON.stringify(extras));
    } catch {}
  }, [items, extras, loaded]);

  const merge = (list: CartItem[], item: CartItem) => {
    const existing = list.find((i) => same(i, item.productId, item.paymentOption));
    if (!existing) return [...list, item];
    return list.map((i) =>
      i === existing ? { ...i, quantity: i.quantity + item.quantity } : i,
    );
  };

  const value: CartCtx = {
    items,
    extras,
    setExtras: (patch) => setExtrasState((e) => ({ ...e, ...patch })),
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
    clear: () => {
      setItems([]);
      setExtrasState(NO_EXTRAS);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
