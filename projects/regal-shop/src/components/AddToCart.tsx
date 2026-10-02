"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DOWNPAYMENT_PERCENT, PREORDER_FULL_PAYMENT_DISCOUNT } from "@/lib/config";
import { peso } from "@/lib/money";
import type { PaymentOption, ProductType } from "@/lib/types";
import { useCart } from "./CartProvider";

type Props = {
  product: { id: string; slug: string; name: string; imageUrl: string; price: number; type: ProductType; stock: number };
};

export function AddToCart({ product }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [option, setOption] = useState<PaymentOption>("FULL");
  const [added, setAdded] = useState(false);
  const isPre = product.type === "PREORDER";
  const maxQty = isPre ? 99 : product.stock;
  const soldOut = !isPre && product.stock <= 0;

  function handleAdd(goToCart: boolean) {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      type: product.type,
      quantity: qty,
      paymentOption: isPre ? option : "FULL",
    });
    if (goToCart) router.push("/cart");
    else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  }

  return (
    <div className="space-y-5">
      {/* Step 2 (PRE-ORDER only): choose payment option */}
      {isPre && (
        <fieldset className="space-y-2">
          <legend className="label">Payment option</legend>
          {(
            [
              [
                "FULL",
                `Full payment · save ${peso(Math.min(PREORDER_FULL_PAYMENT_DISCOUNT, product.price))}`,
                `Pay ${peso(product.price - Math.min(PREORDER_FULL_PAYMENT_DISCOUNT, product.price))} now`,
              ],
              [
                "DOWNPAYMENT_50",
                `${DOWNPAYMENT_PERCENT}% downpayment`,
                `Pay ${peso(Math.ceil(product.price / 2))} now, the rest when the item arrives`,
              ],
            ] as const
          ).map(([value, title, sub]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                option === value ? "border-brand bg-gray-50 ring-1 ring-brand" : "border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="paymentOption"
                className="mt-1"
                checked={option === value}
                onChange={() => setOption(value)}
              />
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-gray-500">{sub}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div>
        <span className="label">Quantity</span>
        <div className="flex w-32 items-center rounded-lg border border-gray-300 bg-white">
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
            −
          </button>
          <span className="flex-1 text-center text-sm font-semibold">{qty}</span>
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase">
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="btn-outline flex-1" disabled={soldOut} onClick={() => handleAdd(false)}>
          {added ? "Added ✓" : "Add to cart"}
        </button>
        <button className="btn-primary flex-1" disabled={soldOut} onClick={() => handleAdd(true)}>
          {soldOut ? "Sold out" : isPre ? "Pre-order now" : "Buy now"}
        </button>
      </div>
    </div>
  );
}
