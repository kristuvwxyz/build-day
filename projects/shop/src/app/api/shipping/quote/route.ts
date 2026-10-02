import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { liveSameDayEnabled, quoteSameDay, signQuote } from "@/lib/sameday";

const Body = z.object({
  address: z.string().trim().min(5).max(300),
  barangay: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
});

// Live Lalamove price for same-day delivery to the buyer's address.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (!liveSameDayEnabled()) return NextResponse.json({ error: "Live quotes are not enabled." }, { status: 400 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete your address first." }, { status: 400 });

  try {
    const quote = await quoteSameDay(parsed.data);
    if ("error" in quote) return NextResponse.json({ error: quote.error }, { status: 422 });
    return NextResponse.json({
      fee: quote.fee,
      mapAddress: quote.mapAddress,
      token: signQuote(quote, parsed.data, session.user.id),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't get the same-day price. Please try again." }, { status: 502 });
  }
}
