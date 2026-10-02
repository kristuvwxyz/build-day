import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { StatusBadge } from "@/components/StatusBadge";
import { getSession } from "@/lib/auth";
import { peso } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const session = await getSession();
  const payment =
    ref && session
      ? await prisma.payment.findUnique({
          where: { reference: ref },
          include: { orders: { where: { userId: session.user.id } } },
        })
      : null;

  return (
    <div className="card mx-auto max-w-lg space-y-5 p-8 text-center">
      {payment?.kind !== "BALANCE" && <ClearCart />}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
      <h1 className="text-2xl font-extrabold">Thank you! Payment received.</h1>
      {payment && <p className="text-sm text-gray-600">We received {peso(payment.amount)}.</p>}
      {payment?.orders.map((o) => (
        <Link
          key={o.id}
          href={`/profile/orders/${o.id}`}
          className="flex items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-gray-50"
        >
          <span>
            <b>{o.orderNumber}</b>
            <span className="block text-xs text-gray-500">{o.type === "PREORDER" ? "Pre-order" : "On-hand"}</span>
          </span>
          <StatusBadge status={o.status} />
        </Link>
      ))}
      <div className="flex justify-center gap-2">
        <Link href="/profile" className="btn-primary">
          View my orders
        </Link>
        <Link href="/" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
