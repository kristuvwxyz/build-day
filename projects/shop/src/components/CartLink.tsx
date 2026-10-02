"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
      Cart
      {count > 0 && (
        <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">{count}</span>
      )}
    </Link>
  );
}
