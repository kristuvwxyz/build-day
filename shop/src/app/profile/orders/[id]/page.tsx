import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PayBalance } from "@/components/PayBalance";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { getSession } from "@/lib/auth";
import { REGIONS, SHIPPING_METHODS, type ShippingMethod } from "@/lib/config";
import { peso } from "@/lib/money";
import { statusLabel, statusSteps } from "@/lib/orderStatus";
import { enabledPaymentProviders } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/login?callbackUrl=/profile/orders/${id}`);

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  const hadBalance = order.items.some((i) => i.paymentOption === "DOWNPAYMENT_50");
  const steps = statusSteps(order.type, hadBalance);
  const currentIdx = steps.indexOf(order.status as (typeof steps)[number]);
  const region = REGIONS.find((r) => r.value === order.shipRegion)?.label ?? order.shipRegion;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/profile" className="text-sm text-gray-500 hover:underline">
        ← My orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold">{order.orderNumber}</h1>
            <TypeBadge type={order.type} />
          </div>
          <p className="text-sm text-gray-500">
            Placed {order.createdAt.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {payment === "cancelled" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Payment was not completed. You can try again below.</p>
      )}

      {order.status === "BALANCE_DUE" && order.balanceDue > 0 && (
        <PayBalance orderId={order.id} amount={order.balanceDue} providers={enabledPaymentProviders()} />
      )}

      {/* Progress tracker */}
      {order.status !== "CANCELLED" && (
        <ol className="card flex flex-col gap-3 p-5 sm:flex-row sm:gap-0">
          {steps.map((s, i) => {
            const done = currentIdx >= 0 && i <= currentIdx;
            return (
              <li key={s} className="flex flex-1 items-center gap-2 sm:flex-col sm:text-center">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done ? "bg-brand text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={`text-xs ${done ? "font-semibold" : "text-gray-500"}`}>{statusLabel(s)}</span>
              </li>
            );
          })}
        </ol>
      )}

      {order.trackingNumber && (
        <div className="card p-5">
          <span className="label">Tracking number</span>
          <p className="font-mono text-lg font-bold">{order.trackingNumber}</p>
          {order.shippingMethod === "JNT" && (
            <a
              href="https://www.jtexpress.ph/trajectoryQuery"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Track on J&T Express →
            </a>
          )}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card space-y-2 p-5 text-sm">
          <h2 className="font-bold">Items</h2>
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between gap-2">
              <span>
                {i.quantity}× {i.name}
                {i.paymentOption === "DOWNPAYMENT_50" && <span className="text-xs text-gray-500"> (50% DP)</span>}
                {i.discountPerUnit > 0 && (
                  <span className="text-xs text-green-700"> (full payment −{peso(i.discountPerUnit * i.quantity)})</span>
                )}
              </span>
              <span>{peso((i.unitPrice - i.discountPerUnit) * i.quantity)}</span>
            </div>
          ))}
          <hr />
          <Row label="Subtotal" value={peso(order.subtotal)} />
          <Row label="Shipping" value={peso(order.shippingFee)} />
          <Row label={<b>Total</b>} value={<b>{peso(order.total)}</b>} />
          <Row label="Paid" value={peso(order.amountPaid)} />
          {order.balanceDue > 0 && order.status !== "CANCELLED" && (
            <Row
              label={<span className="font-semibold text-orange-600">Balance</span>}
              value={<span className="font-semibold text-orange-600">{peso(order.balanceDue)}</span>}
            />
          )}
        </div>

        <div className="card space-y-1 p-5 text-sm">
          <h2 className="mb-2 font-bold">Shipping</h2>
          <p className="font-semibold">{SHIPPING_METHODS[order.shippingMethod as ShippingMethod]?.label}</p>
          <p>{order.shipName}</p>
          <p>{order.shipContact}</p>
          <p>{order.shipAddress}</p>
          <p>
            Brgy. {order.shipBarangay}, {order.shipCity}
          </p>
          <p>{region}</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-bold">Order history</h2>
        <ul className="space-y-2 text-sm">
          {order.history.map((h) => (
            <li key={h.id} className="flex justify-between gap-3">
              <span>
                {statusLabel(h.status)}
                {h.note && <span className="text-gray-500"> · {h.note}</span>}
              </span>
              <span className="shrink-0 text-xs text-gray-500">
                {h.createdAt.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
