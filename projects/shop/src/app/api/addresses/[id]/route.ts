import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressFields } from "@/lib/validation";

const Update = AddressFields.partial().extend({
  label: z.string().trim().max(30).optional(),
  isDefault: z.literal(true).optional(),
});

async function own(id: string) {
  const session = await getSession();
  if (!session) return { res: NextResponse.json({ error: "Please log in first." }, { status: 401 }) };
  const address = await prisma.address.findFirst({ where: { id, userId: session.user.id } });
  if (!address) return { res: NextResponse.json({ error: "Address not found." }, { status: 404 }) };
  return { address, userId: session.user.id };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const found = await own((await params).id);
  if ("res" in found) return found.res;
  const parsed = Update.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the address." }, { status: 400 });
  }
  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.address.updateMany({ where: { userId: found.userId }, data: { isDefault: false } });
    return tx.address.update({ where: { id: found.address.id }, data: parsed.data });
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const found = await own((await params).id);
  if ("res" in found) return found.res;
  await prisma.address.delete({ where: { id: found.address.id } });
  // Keep one default address if any are left.
  if (found.address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: found.userId }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return NextResponse.json({ ok: true });
}
