// Buyers land here after paying on Maya / PayPal / BDO.
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/payments";
import { confirmAndFulfil } from "@/lib/payments/fulfil";

export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref") ?? "";
  let result: Awaited<ReturnType<typeof confirmAndFulfil>> = "PENDING";
  try {
    result = await confirmAndFulfil(ref);
  } catch (err) {
    console.error("Payment confirmation failed", err);
  }
  const target =
    result === "PAID"
      ? `/checkout/success?ref=${encodeURIComponent(ref)}`
      : `/checkout/failed?ref=${encodeURIComponent(ref)}&pending=1`;
  return NextResponse.redirect(appUrl(target), { status: 303 });
}
