"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

export type VoucherState =
  | { status: "none" }
  | { status: "checking" }
  | { status: "applied"; code: string; discount: number; description: string }
  | { status: "invalid"; error: string };

/**
 * The voucher in the cart, re-checked with the server whenever the cart changes.
 * Use `apply(code)` / `remove()` from any voucher input you design.
 */
export function useVoucher() {
  const { items, extras, setExtras, loaded } = useCart();
  const [state, setState] = useState<VoucherState>({ status: "none" });
  const code = extras.voucherCode;
  const itemsKey = JSON.stringify(items.map((i) => [i.productId, i.quantity, i.paymentOption]));

  useEffect(() => {
    if (!loaded) return;
    if (!code || items.length === 0) {
      setState({ status: "none" });
      return;
    }
    setState({ status: "checking" });
    const ctrl = new AbortController();
    fetch("/api/vouchers/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, paymentOption: i.paymentOption })),
      }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        setState(res.ok ? { status: "applied", ...data } : { status: "invalid", error: data.error });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ status: "invalid", error: "Couldn't check the voucher." });
      });
    return () => ctrl.abort();
  }, [code, itemsKey, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    discount: state.status === "applied" ? state.discount : 0,
    apply: (newCode: string) => setExtras({ voucherCode: newCode.trim().toUpperCase() }),
    remove: () => setExtras({ voucherCode: "" }),
  };
}
