import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { notify, ownerInbox } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  phone: z.string().trim().max(20).optional(),
  orderNumber: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(5, "Please write a short message.").max(3000),
  website: z.string().optional(), // honeypot: real people leave this empty
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form." }, { status: 400 });
  }
  const { website, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // bot

  const recent = await prisma.contactMessage.count({
    where: { email: data.email, createdAt: { gt: new Date(Date.now() - 60 * 60_000) } },
  });
  if (recent >= 5) return NextResponse.json({ error: "You've sent several messages already. We'll reply soon." }, { status: 429 });

  const session = await getSession();
  await prisma.contactMessage.create({ data: { ...data, userId: session?.user.id ?? null } });
  await notify(
    ownerInbox(),
    `Contact form: ${data.subject}`,
    `From: ${data.name} <${data.email}>${data.phone ? `\nPhone: ${data.phone}` : ""}${data.orderNumber ? `\nOrder: ${data.orderNumber}` : ""}\n\n${data.message}`,
    data.email,
  );
  return NextResponse.json({ ok: true });
}
