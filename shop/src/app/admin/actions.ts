"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/orderStatus";
import { prisma } from "@/lib/prisma";

export async function updateOrder(formData: FormData) {
  const session = await getSession();
  if (!session?.user.isAdmin) throw new Error("Not allowed");

  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!(status in ORDER_STATUSES)) throw new Error("Bad status");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error("Order not found");

  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { status, trackingNumber } }),
    ...(status !== order.status || note
      ? [prisma.orderStatusLog.create({ data: { orderId: id, status, note } })]
      : []),
  ]);
  revalidatePath("/admin");
}
