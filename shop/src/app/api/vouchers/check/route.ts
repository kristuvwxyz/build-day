import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { CartItemsSchema, loadCartLines } from "@/lib/cartLines";
import { itemsSubtotal } from "@/lib/pricing";
import { checkVoucher, describeVoucher } from "@/lib/vouchers";

const Body = z.object({ code: z.string().trim().min(1).max(40), items: CartItemsSchema });

// Preview a voucher for the current cart. Checkout checks it again before charging.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in to use a voucher." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a voucher code." }, { status: 400 });

  const loaded = await loadCartLines(parsed.data.items);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: 400 });

  const result = await checkVoucher(parsed.data.code, session.user.id, itemsSubtotal(loaded.lines));
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({
    code: result.voucher.code,
    discount: result.discount,
    description: describeVoucher(result.voucher),
  });
}
