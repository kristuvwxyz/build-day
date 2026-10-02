import { prisma } from "../prisma";
import { getGateway } from ".";

/**
 * Verifies a payment with its gateway and, if paid, updates the orders.
 * Safe to call many times (return page + webhook): it only applies once.
 */
export async function confirmAndFulfil(reference: string): Promise<"PAID" | "PENDING" | "NOT_FOUND"> {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return "NOT_FOUND";
  if (payment.status === "PAID") return "PAID";

  const gateway = getGateway(payment.provider);
  if (!gateway) return "PENDING";
  const paid = await gateway.confirmPaid({
    reference: payment.reference,
    providerRef: payment.providerRef,
    amount: payment.amount,
  });
  if (!paid) return "PENDING";

  await prisma.$transaction(async (tx) => {
    // Claim the payment; if another request already did, stop here.
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (claimed.count === 0) return;

    const orders = await tx.order.findMany({
      where: { payments: { some: { id: payment.id } } },
      include: { items: true },
    });

    for (const order of orders) {
      if (payment.kind === "INITIAL") {
        const status =
          order.type === "PREORDER" && order.balanceDue > 0 ? "DOWNPAYMENT_RECEIVED" : "PAID";
        await tx.order.update({
          where: { id: order.id },
          data: { status, amountPaid: order.total - order.balanceDue },
        });
        await tx.orderStatusLog.create({
          data: { orderId: order.id, status, note: `Paid via ${payment.provider}` },
        });
        if (order.type === "ONHAND") {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      } else {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PROCESSING", amountPaid: order.total, balanceDue: 0 },
        });
        await tx.orderStatusLog.create({
          data: { orderId: order.id, status: "PROCESSING", note: `Balance paid via ${payment.provider}` },
        });
      }
    }
  });
  return "PAID";
}

/**
 * Called when the buyer cancels on the payment page. If the gateway confirms
 * nothing was paid, the payment is marked FAILED and its unpaid checkout
 * orders are cancelled (a balance payment just stays "Balance Due").
 */
export async function cancelIfUnpaid(reference: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { orders: true },
  });
  if (!payment || payment.status !== "PENDING") return;
  if (!payment.orders.every((o) => o.userId === userId)) return;
  if ((await confirmAndFulfil(reference)) === "PAID") return;

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    if (claimed.count === 0 || payment.kind !== "INITIAL") return;
    for (const order of payment.orders) {
      if (order.status !== "PENDING_PAYMENT") continue;
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      await tx.orderStatusLog.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Payment was not completed" },
      });
    }
  });
}
