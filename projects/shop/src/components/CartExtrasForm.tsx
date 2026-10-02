"use client";

import { useState } from "react";
import { ORDER_NOTE_MAX, SPECIAL_PACKAGING_FEE } from "@/lib/config";
import { peso } from "@/lib/money";
import { useCart } from "./CartProvider";
import { useVoucher } from "./useVoucher";

// NOTE · Special packaging · Voucher code. Logic lives in useCart() / useVoucher();
// restyle this markup freely.
export function CartExtrasForm() {
  const { extras, setExtras } = useCart();
  const voucher = useVoucher();
  const [input, setInput] = useState("");

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="label">Note</span>
        <textarea
          id="cart-note"
          className="input min-h-[72px]"
          maxLength={ORDER_NOTE_MAX}
          placeholder="Anything we should know? (e.g. gift message, delivery instructions)"
          value={extras.note}
          onChange={(e) => setExtras({ note: e.target.value })}
        />
      </label>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          id="cart-packaging"
          type="checkbox"
          checked={extras.specialPackaging}
          onChange={(e) => setExtras({ specialPackaging: e.target.checked })}
        />
        <span>
          Add special packaging <b>+{peso(SPECIAL_PACKAGING_FEE)}</b>
        </span>
      </label>

      <div>
        <span className="label">Voucher code</span>
        {voucher.state.status === "applied" ? (
          <div className="flex items-center justify-between rounded-theme bg-green-50 p-2 text-sm text-green-800">
            <span>
              <b>{voucher.state.code}</b> · {voucher.state.description} (−{peso(voucher.state.discount)})
            </span>
            <button type="button" className="text-xs underline" onClick={voucher.remove}>
              Remove
            </button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) voucher.apply(input);
            }}
          >
            <input
              id="cart-voucher"
              className="input uppercase"
              placeholder="Enter code"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn-outline" disabled={voucher.state.status === "checking"}>
              Apply
            </button>
          </form>
        )}
        {voucher.state.status === "invalid" && (
          <p className="mt-1 text-xs text-red-600">
            {voucher.state.error}{" "}
            <button type="button" className="underline" onClick={voucher.remove}>
              Clear
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
