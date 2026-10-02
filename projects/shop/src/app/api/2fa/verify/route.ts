import { NextResponse } from "next/server";
import { z } from "zod";
import { currentSessionToken, getRawSession } from "@/lib/auth";
import { verifyTwoFactorCode } from "@/lib/twoFactor";

const Body = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") });

export async function POST(req: Request) {
  const session = await getRawSession();
  const token = await currentSessionToken();
  if (!session || !token) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  const result = await verifyTwoFactorCode(session.user.id, token, parsed.data.code);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
