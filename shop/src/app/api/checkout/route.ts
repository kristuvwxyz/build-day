import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { shippingFee } from "@/lib/config";
import { appUrl, getGateway, newReference } from "@/lib/payments";
import { priceCart, unitDiscount } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { liveSameDayEnabled, verifyQuote, type SameDayQuote } from "@/lib/sameday";
import type { ProductType } from "@/lib/types";

const Body = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(99),
        paymentOption: z.enum(["FULL", "DOWNPAYMENT_50"]),
      }),
    )
    .min(1),
  shipping: z.object({
    name: z.string().trim().min(2).max(100),
    contact: z
      .string()
      .trim()
      .regex(/^(09\d{9}|\+639\d{9})$/, "Use a PH mobile number like 09171234567"),
    address: z.string().trim().min(5).max(300),
    barangay: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    region: z.enum(["METRO_MANILA", "LUZON", "VISAYAS", "MINDANAO"]),
  }),
  shippingMethod: z.enum(["JNT", "SAMEDAY"]),
  provider: z.enum(["MAYA", "PAYPAL", "BDO", "MOCK"]),
  sameDayQuoteToken: z.string().max(2000).optional(),
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
  const { items, shipping, shippingMethod, provider, sameDayQuoteToken } = parsed.data;

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
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  });
  const lines = [];
  for (const item of items) {
    const p = products.find((x) => x.id === item.productId);
    if (!p) return NextResponse.json({ error: "An item in your cart is no longer available." }, { status: 400 });
    const type = p.type as ProductType;
    if (type === "ONHAND") {
      const wanted = items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.quantity, 0);
      if (wanted > p.stock) {
        return NextResponse.json({ error: `Only ${p.stock} left of "${p.name}".` }, { status: 400 });
      }
    }
    lines.push({
      product: p,
      type,
      price: p.price,
      quantity: item.quantity,
      paymentOption: type === "ONHAND" ? ("FULL" as const) : item.paymentOption,
    });
  }

  const priced = priceCart(lines, feePerShipment);
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
