import { NextResponse } from "next/server";
import { z } from "zod";
import { currentSessionToken, getRawSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskEmail, sendTwoFactorCode } from "@/lib/twoFactor";

const Body = z.object({ email: z.string().trim().toLowerCase().email().optional() });

export async function POST(req: Request) {
  const session = await getRawSession();
  const token = await currentSessionToken();
  if (!session || !token) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  // Accounts without an email (some Facebook logins) give one here; it's saved once verified.
  const email = user?.email ?? parsed.data.email;
  if (!email) return NextResponse.json({ error: "Please enter your email." }, { status: 400 });

  try {
    const result = await sendTwoFactorCode(session.user.id, token, email);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 429 });
    return NextResponse.json({ sentTo: maskEmail(email) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "We couldn't send the code. Please try again." }, { status: 502 });
  }
}
