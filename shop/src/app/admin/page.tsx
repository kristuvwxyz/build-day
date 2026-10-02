import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { getSession } from "@/lib/auth";
import { SHIPPING_METHODS, type ShippingMethod } from "@/lib/config";
import { peso } from "@/lib/money";
import { ORDER_STATUSES } from "@/lib/orderStatus";
import { prisma } from "@/lib/prisma";
import { updateOrder } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getSession();
  if (!session?.user.isAdmin) notFound();
  const { status } = await searchParams;

  const orders = await prisma.order.findMany({
    where: status ? { status } : { status: { not: "PENDING_PAYMENT" } },
    include: { items: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Orders (Admin)</h1>
        <p className="text-sm text-gray-500">
          When a pre-order arrives: set a downpayment order to <b>Arrived – Balance Due</b> (the buyer gets a Pay
          Balance button), or set a fully paid one to <b>Processing</b>. Add the tracking number when you ship.
          Products are managed with <code>npm run db:studio</code>.
        </p>
      </div>

      <form className="flex flex-wrap gap-2">
        <select name="status" defaultValue={status ?? ""} className="input w-auto">
          <option value="">All (except unpaid)</option>
          {Object.entries(ORDER_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <button className="btn-outline">Filter</button>
      </form>

      {orders.length === 0 && <p className="text-gray-500">No orders.</p>}

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="card space-y-3 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <b>{o.orderNumber}</b>
                <TypeBadge type={o.type} />
                <span className="text-xs text-gray-500">{o.createdAt.toLocaleString("en-PH")}</span>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <span className="label">Items</span>
                {o.items.map((i) => (
                  <p key={i.id}>
                    {i.quantity}× {i.name}
                    {i.paymentOption === "DOWNPAYMENT_50" && " (50% DP)"}
                  </p>
                ))}
              </div>
              <div>
                <span className="label">Ship to</span>
                <p>
                  {o.shipName} · {o.shipContact}
                </p>
                <p>
                  {o.shipAddress}, Brgy. {o.shipBarangay}, {o.shipCity}
                </p>
                <p className="text-gray-500">{SHIPPING_METHODS[o.shippingMethod as ShippingMethod]?.label}</p>
                {o.shipLat != null && o.shipLng != null && (
                  <a
                    href={`https://www.google.com/maps?q=${o.shipLat},${o.shipLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    📍 Drop-off pin (for booking Lalamove / Grab)
                  </a>
                )}
              </div>
              <div>
                <span className="label">Money</span>
                <p>Total {peso(o.total)}</p>
                <p>Paid {peso(o.amountPaid)}</p>
                {o.balanceDue > 0 && <p className="font-semibold text-orange-600">Balance {peso(o.balanceDue)}</p>}
              </div>
            </div>
            <form action={updateOrder} className="flex flex-wrap items-end gap-2 border-t pt-3">
              <input type="hidden" name="id" value={o.id} />
              <label>
                <span className="label">Status</span>
                <select name="status" defaultValue={o.status} className="input w-auto py-1.5">
                  {Object.entries(ORDER_STATUSES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">Tracking no.</span>
                <input name="trackingNumber" defaultValue={o.trackingNumber ?? ""} className="input py-1.5" />
              </label>
              <label className="flex-1">
                <span className="label">Note to buyer (optional)</span>
                <input name="note" className="input py-1.5" placeholder="e.g. Rider booked, ETA 3pm" />
              </label>
              <button className="btn-primary py-2">Save</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
