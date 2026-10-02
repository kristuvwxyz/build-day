import { NextResponse } from "next/server";
import { z } from "zod";
import { saveAddress } from "@/lib/addresses";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressFields } from "@/lib/validation";

const Create = AddressFields.extend({
  label: z.string().trim().max(30).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(addresses);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const parsed = Create.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the address." }, { status: 400 });
  }
  if ((await prisma.address.count({ where: { userId: session.user.id } })) >= 10) {
    return NextResponse.json({ error: "You can save up to 10 addresses." }, { status: 400 });
  }
  return NextResponse.json(await saveAddress(session.user.id, parsed.data), { status: 201 });
}
