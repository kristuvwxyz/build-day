// Buyer cancellations. Unpaid orders cancel right away; paid orders need the shop's approval.
import { CANCELLABLE_STATUSES } from "./config";
import { peso } from "./money";
import { notify, ownerInbox } from "./notify";
import { prisma } from "./prisma";

export async function requestCancellation(orderId: string, userId: string, reason: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { cancelRequests: { where: { status: "PENDING" } } },
  });
  if (!order) return { error: "Order not found." } as const;
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return { error: "This order can no longer be cancelled. Please contact us." } as const;
  }
  if (order.cancelRequests.length > 0) return { error: "You already asked to cancel this order." } as const;

  // Nothing paid yet: cancel immediately.
  if (order.status === "PENDING_PAYMENT") {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
      prisma.orderStatusLog.create({ data: { orderId: order.id, status: "CANCELLED", note: `Cancelled by buyer: ${reason}` } }),
    ]);
    return { cancelled: true } as const;
  }

  await prisma.$transaction([
    prisma.cancelRequest.create({ data: { orderId: order.id, userId, reason } }),
    prisma.orderStatusLog.create({
      data: { orderId: order.id, status: order.status, note: "Cancellation requested, waiting for the shop's approval" },
    }),
  ]);
  await notify(
    ownerInbox(),
    `Cancellation request for ${order.orderNumber}`,
    `${order.shipName} asked to cancel order ${order.orderNumber} (paid ${peso(order.amountPaid)}).\n\nReason: ${reason}\n\nApprove or reject it on the Admin page.`,
  );
  return { requested: true } as const;
}

export async function decideCancellation(requestId: string, approve: boolean, reply: string | null) {
  const req = await prisma.cancelRequest.findUnique({
    where: { id: requestId },
    include: { order: { include: { items: true, user: true } } },
  });
  if (!req || req.status !== "PENDING") return { error: "This request was already handled." } as const;
  const order = req.order;

  await prisma.$transaction(async (tx) => {
    await tx.cancelRequest.update({
      where: { id: req.id },
      data: { status: approve ? "APPROVED" : "REJECTED", shopReply: reply, decidedAt: new Date() },
    });
    if (!approve) {
      await tx.orderStatusLog.create({
        data: { orderId: order.id, status: order.status, note: `Cancellation declined${reply ? `: ${reply}` : ""}` },
      });
      return;
    }
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        note: `Cancellation approved${order.amountPaid > 0 ? `. Refund of ${peso(order.amountPaid)} will be processed` : ""}${reply ? `. ${reply}` : ""}`,
      },
    });
    // On-hand stock was taken when the order was paid, so put it back.
    if (order.type === "ONHAND" && order.amountPaid > 0) {
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    }
  });

  await notify(
    order.user.email,
    approve ? `Order ${order.orderNumber} cancelled` : `About your cancellation request for ${order.orderNumber}`,
    approve
      ? `Your cancellation for order ${order.orderNumber} was approved.${order.amountPaid > 0 ? ` We'll refund ${peso(order.amountPaid)} to your original payment method.` : ""}${reply ? `\n\n${reply}` : ""}`
      : `We couldn't cancel order ${order.orderNumber}.${reply ? `\n\n${reply}` : ""}`,
  );
  return { ok: true, refund: approve ? order.amountPaid : 0 } as const;
}
