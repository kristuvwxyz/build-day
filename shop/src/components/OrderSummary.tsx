import { peso } from "@/lib/money";
import type { Shipment } from "@/lib/pricing";

export function OrderSummary({
  shipments,
  dueNow,
  balanceLater,
  showShipping,
}: {
  shipments: Shipment[];
  dueNow: number;
  balanceLater: number;
  showShipping: boolean;
}) {
  const mixed = shipments.length > 1;
  return (
    <div className="space-y-3 text-sm">
      {shipments.map((s) => (
        <div key={s.type} className="space-y-1">
          {mixed && (
            <p className="text-xs font-bold uppercase text-gray-500">
              {s.type === "ONHAND" ? "Shipment 1 · On-hand (ships now)" : "Shipment 2 · Pre-order (ships on arrival)"}
            </p>
          )}
          <Row label="Items subtotal" value={peso(s.subtotal)} />
          {s.voucherDiscount > 0 && (
            <Row label="Voucher" value={<span className="text-green-700">−{peso(s.voucherDiscount)}</span>} />
          )}
          {s.packagingFee > 0 && <Row label="Special packaging" value={peso(s.packagingFee)} />}
          {showShipping && <Row label="Shipping fee" value={peso(s.shippingFee)} />}
        </div>
      ))}
      <hr />
      <Row label={<b>Pay now</b>} value={<b className="text-lg">{peso(dueNow)}</b>} />
      {balanceLater > 0 && (
        <Row
          label={<span className="text-gray-500">Balance (pay when your pre-order arrives)</span>}
          value={<span className="text-gray-500">{peso(balanceLater)}</span>}
        />
      )}
      {!showShipping && <p className="text-xs text-gray-500">Shipping fee will show once your address and region are complete.</p>}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
