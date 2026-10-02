"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { OrderSummary } from "@/components/OrderSummary";
import { TypeBadge } from "@/components/TypeBadge";
import { peso } from "@/lib/money";
import { lineDueNow, priceCart } from "@/lib/pricing";

export default function CartPage() {
  const { items, setQuantity, setPaymentOption, remove } = useCart();
  const priced = priceCart(items, null);

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Link href="/" className="btn-primary mt-4">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold">Your Cart</h1>
        {items.map((item) => (
          <div key={item.productId + item.paymentOption} className="card flex gap-4 p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <TypeBadge type={item.type} />
                  <Link href={`/product/${item.slug}`} className="mt-1 block text-sm font-semibold hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-500">{peso(item.price)} each</p>
                </div>
                <button
                  onClick={() => remove(item.productId, item.paymentOption)}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => setQuantity(item.productId, item.paymentOption, Number(e.target.value) || 1)}
                  className="input w-20 py-1.5"
                  aria-label="Quantity"
                />
                {item.type === "PREORDER" && (
                  <select
                    value={item.paymentOption}
                    onChange={(e) =>
                      setPaymentOption(item.productId, item.paymentOption, e.target.value as typeof item.paymentOption)
                    }
                    className="input w-auto py-1.5"
                    aria-label="Payment option"
                  >
                    <option value="FULL">Full payment</option>
                    <option value="DOWNPAYMENT_50">50% downpayment</option>
                  </select>
                )}
                <span className="ml-auto text-sm font-semibold">
                  {item.paymentOption === "DOWNPAYMENT_50"
                    ? `${peso(lineDueNow(item))} now`
                    : peso(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="card h-fit space-y-4 p-5">
        <h2 className="font-bold">Order summary</h2>
        <OrderSummary {...priced} showShipping={false} />
        {priced.shipments.length > 1 && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Your cart has on-hand and pre-order items. They will be shipped separately: on-hand now, pre-order when it
            arrives.
          </p>
        )}
        <Link href="/checkout" className="btn-primary w-full">
          Checkout
        </Link>
      </aside>
    </div>
  );
}
