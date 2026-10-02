import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ORDER_NOTE_MAX, shippingFee } from "@/lib/config";
import { appUrl, getGateway, newReference } from "@/lib/payments";
import { itemsSubtotal, priceCart, unitDiscount } from "@/lib/pricing";
import { CartItemsSchema, loadCartLines } from "@/lib/cartLines";
import { checkVoucher } from "@/lib/vouchers";
import { saveAddress } from "@/lib/addresses";
import { AddressFields } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { liveSameDayEnabled, verifyQuote, type SameDayQuote } from "@/lib/sameday";
import type { ProductType } from "@/lib/types";

const Body = z.object({
  items: CartItemsSchema,
  shipping: AddressFields,
  shippingMethod: z.enum(["JNT", "SAMEDAY"]),
  provider: z.enum(["MAYA", "PAYPAL", "BDO", "MOCK"]),
  sameDayQuoteToken: z.string().max(2000).optional(),
  note: z.string().trim().max(ORDER_NOTE_MAX).optional(),
  specialPackaging: z.boolean().optional(),
  voucherCode: z.string().trim().max(40).optional(),
  saveAddress: z.boolean().optional(),
});

const orderNumber = (type: ProductType) =>
  `${type === "PREORDER" ? "PO" : "OH"}-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const { items, shipping, shippingMethod, provider, sameDayQuoteToken, note, specialPackaging, voucherCode, saveAddress: save } =
    parsed.data;

  const gateway = getGateway(provider);
  if (!gateway) return NextResponse.json({ error: "That payment method is not available." }, { status: 400 });

  let feePerShipment = shippingFee(shippingMethod, shipping.region);
  if (feePerShipment === null) {
    return NextResponse.json({ error: "Same-day delivery is only available in Metro Manila." }, { status: 400 });
  }
  // Same-day: use the live Lalamove price the buyer was shown (signed by our server).
  let sameDay: SameDayQuote | null = null;
  if (shippingMethod === "SAMEDAY" && liveSameDayEnabled()) {
    sameDay = sameDayQuoteToken ? verifyQuote(sameDayQuoteToken, shipping, session.user.id) : null;
    if (!sameDay) {
      return NextResponse.json(
        { error: "The same-day delivery price expired or your address changed. Please review the price and try again." },
        { status: 400 },
      );
    }
    feePerShipment = sameDay.fee;
  }

  // Re-load products from the database: prices from the browser are never trusted.
  const loaded = await loadCartLines(items);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: 400 });
  const lines = loaded.lines;

  let voucher: { code: string; discount: number } | null = null;
  if (voucherCode) {
    const checked = await checkVoucher(voucherCode, session.user.id, itemsSubtotal(lines));
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });
    voucher = { code: checked.voucher.code, discount: checked.discount };
  }

  const priced = priceCart(lines, feePerShipment, {
    specialPackaging,
    voucherDiscount: voucher?.discount ?? 0,
  });
  if (priced.dueNow <= 0) {
    return NextResponse.json({ error: "There's nothing to pay for this order. Please contact us." }, { status: 400 });
  }

  const checkoutGroup = newReference("G");
  const reference = newReference("PAY");

  const payment = await prisma.$transaction(async (tx) => {
    const orderIds: string[] = [];
    for (const s of priced.shipments) {
      const order = await tx.order.create({
        data: {
          orderNumber: orderNumber(s.type),
          checkoutGroup,
          userId: session.user.id,
          type: s.type,
          status: "PENDING_PAYMENT",
          shippingMethod,
          shipName: shipping.name,
          shipContact: shipping.contact,
          shipAddress: shipping.address,
          shipBarangay: shipping.barangay,
          shipCity: shipping.city,
          shipRegion: shipping.region,
          shipLat: sameDay?.lat,
          shipLng: sameDay?.lng,
          shipMapAddress: sameDay?.mapAddress,
          subtotal: s.subtotal,
          shippingFee: s.shippingFee,
          packagingFee: s.packagingFee,
          voucherCode: s.voucherDiscount > 0 ? voucher?.code : null,
          voucherDiscount: s.voucherDiscount,
          buyerNote: note || null,
          total: s.total,
          balanceDue: s.balanceLater,
          items: {
            create: s.lines.map((l) => ({
              productId: l.product.id,
              name: l.product.name,
              unitPrice: l.price,
              discountPerUnit: unitDiscount(l),
              quantity: l.quantity,
              paymentOption: l.paymentOption,
            })),
          },
          history: { create: { status: "PENDING_PAYMENT" } },
        },
      });
      orderIds.push(order.id);
    }
    return tx.payment.create({
      data: {
        reference,
        kind: "INITIAL",
        provider,
        amount: priced.dueNow,
        orders: { connect: orderIds.map((id) => ({ id })) },
      },
    });
  });

  if (save) {
    await saveAddress(session.user.id, shipping).catch((err) => console.error("Saving address failed", err));
  }

  try {
    const { redirectUrl, providerRef } = await gateway.startCheckout({
      reference,
      amount: priced.dueNow,
      description: `Order ${checkoutGroup}`,
      buyer: { name: shipping.name, email: session.user.email, phone: shipping.contact },
      returnUrl: appUrl(`/api/payments/return?ref=${reference}`),
      cancelUrl: appUrl(`/checkout/failed?ref=${reference}`),
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef } });
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error(err);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    await prisma.order.updateMany({ where: { checkoutGroup }, data: { status: "CANCELLED" } });
    return NextResponse.json(
      { error: "We couldn't connect to the payment provider. Please try another method." },
      { status: 502 },
    );
  }
}
