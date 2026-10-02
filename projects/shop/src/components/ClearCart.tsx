"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

export function ClearCart() {
  const { clear, loaded } = useCart();
  useEffect(() => {
    if (loaded) clear();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
