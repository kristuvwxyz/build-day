import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csv, FragranticaUrl, PhMobile } from "@/lib/validation";

const Patch = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.union([PhMobile, z.literal("")]).optional(),
  birthday: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
  favoriteNotes: csv().optional(),
  favoriteAccords: csv().optional(),
  favoriteBrands: csv().optional(),
  fragranticaUrl: z.union([FragranticaUrl, z.literal("")]).optional(),
});

const select = {
  name: true,
  email: true,
  image: true,
  phone: true,
  birthday: true,
  favoriteNotes: true,
  favoriteAccords: true,
  favoriteBrands: true,
  fragranticaUrl: true,
} as const;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  }
  const { birthday, phone, fragranticaUrl, ...rest } = parsed.data;
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...rest,
      ...(phone !== undefined && { phone: phone || null }),
      ...(fragranticaUrl !== undefined && { fragranticaUrl: fragranticaUrl || null }),
      ...(birthday !== undefined && { birthday: birthday ? new Date(birthday + "T00:00:00Z") : null }),
    },
    select,
  });
  return NextResponse.json(user);
}
