// Set this URL as the webhook in Maya Business Manager:
//   https://YOUR-DOMAIN/api/payments/maya/webhook   (events: PAYMENT_SUCCESS, PAYMENT_FAILED)
// We never trust the webhook body: confirmAndFulfil() re-checks with Maya's API.
import { NextResponse } from "next/server";
import { confirmAndFulfil } from "@/lib/payments/fulfil";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { requestReferenceNumber?: string } | null;
  const ref = body?.requestReferenceNumber;
  if (ref) {
    try {
      await confirmAndFulfil(ref);
    } catch (err) {
      console.error("Maya webhook error", err);
      return NextResponse.json({ ok: false }, { status: 500 }); // Maya will retry
    }
  }
  return NextResponse.json({ ok: true });
}
