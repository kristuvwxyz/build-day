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

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user.isAdmin) throw new Error("Not allowed");
  return session;
}

export async function decideCancel(formData: FormData) {
  await requireAdmin();
  const { decideCancellation } = await import("@/lib/cancellation");
  const reply = String(formData.get("reply") ?? "").trim() || null;
  await decideCancellation(String(formData.get("requestId")), formData.get("decision") === "approve", reply);
  revalidatePath("/admin");
}

export async function createVoucher(formData: FormData) {
  await requireAdmin();
  const num = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : Number(v);
  };
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = formData.get("type") === "PERCENT" ? "PERCENT" : "FIXED";
  const value = num("value");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code) || value == null || value <= 0) throw new Error("Check the code and value");
  if (type === "PERCENT" && value > 100) throw new Error("Percent must be 1-100");
  const expires = String(formData.get("expiresAt") ?? "");
  await prisma.voucher.create({
    data: {
      code,
      type,
      description: String(formData.get("description") ?? ""),
      value: type === "PERCENT" ? Math.round(value) : Math.round(value * 100), // pesos → centavos
      minSpend: Math.round((num("minSpend") ?? 0) * 100),
      maxDiscount: num("maxDiscount") != null ? Math.round(num("maxDiscount")! * 100) : null,
      usageLimit: num("usageLimit"),
      perUserLimit: num("perUserLimit") ?? 1,
      expiresAt: expires ? new Date(expires + "T23:59:59+08:00") : null,
    },
  });
  revalidatePath("/admin/vouchers");
}

export async function toggleVoucher(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const v = await prisma.voucher.findUniqueOrThrow({ where: { id } });
  await prisma.voucher.update({ where: { id }, data: { isActive: !v.isActive } });
  revalidatePath("/admin/vouchers");
}

export async function markMessageRead(formData: FormData) {
  await requireAdmin();
  await prisma.contactMessage.update({ where: { id: String(formData.get("id")) }, data: { isRead: true } });
  revalidatePath("/admin/messages");
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const { redirect } = await import("next/navigation");
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const int = (k: string) => (str(k) === "" ? null : Math.round(Number(str(k))));
  const id = str("id");
  const name = str("name");
  const price = Math.round(Number(str("price")) * 100);
  if (!name || !Number.isFinite(price) || price <= 0) throw new Error("Name and price are required");
  const type = str("type") === "PREORDER" ? "PREORDER" : "ONHAND";
  const slug =
    str("slug") ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const data = {
    name,
    slug,
    price,
    type,
    stock: int("stock") ?? 0,
    eta: str("eta") || null,
    imageUrl: str("imageUrl"),
    description: str("description"),
    isActive: formData.get("isActive") === "on",
    brand: str("brand"),
    perfumer: str("perfumer"),
    releaseYear: int("releaseYear"),
    gender: str("gender"),
    concentration: str("concentration"),
    sizeMl: int("sizeMl"),
    topNotes: str("topNotes"),
    heartNotes: str("heartNotes"),
    baseNotes: str("baseNotes"),
    accords: str("accords"),
    longevity: str("longevity"),
    sillage: str("sillage"),
    fragranticaUrl: str("fragranticaUrl") || null,
  };
  if (id) await prisma.product.update({ where: { id }, data });
  else await prisma.product.create({ data });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
