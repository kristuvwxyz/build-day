import Link from "next/link";
import { getSession } from "@/lib/auth";
import { cancelIfUnpaid } from "@/lib/payments/fulfil";

export default async function FailedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; pending?: string }>;
}) {
  const { ref, pending } = await searchParams;
  const session = await getSession();
  if (ref && session && !pending) {
    await cancelIfUnpaid(ref, session.user.id).catch((err) => console.error(err));
  }

  return (
    <div className="card mx-auto max-w-lg space-y-4 p-8 text-center">
      {pending ? (
        <>
          <h1 className="text-2xl font-medium text-brand">We're confirming your payment</h1>
          <p className="text-sm text-gray-600">
            If you completed the payment, your order status will update shortly in <b>My Orders</b>. If not, your cart
            is still saved and you can try again.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-medium text-brand">Payment not completed</h1>
          <p className="text-sm text-gray-600">No money was taken. Your cart is still saved. Please try again.</p>
        </>
      )}
      <div className="flex justify-center gap-2">
        <Link href="/checkout" className="btn-primary">
          Back to checkout
        </Link>
        <Link href="/profile" className="btn-outline">
          My orders
        </Link>
      </div>
    </div>
  );
}
