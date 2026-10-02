import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { requestCancellation } from "@/lib/cancellation";

const Body = z.object({ reason: z.string().trim().min(3, "Please tell us why.").max(500) });

// Buyer asks to cancel. Unpaid orders cancel right away; paid ones wait for approval.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please tell us why." }, { status: 400 });
  }
  const result = await requestCancellation((await params).id, session.user.id, parsed.data.reason);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
