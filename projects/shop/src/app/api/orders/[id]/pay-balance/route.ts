import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { appUrl, getGateway, newReference } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

const Body = z.object({ provider: z.enum(["MAYA", "PAYPAL", "BDO", "MOCK"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });

  const gateway = getGateway(parsed.data.provider);
  if (!gateway) return NextResponse.json({ error: "That payment method is not available." }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id, userId: session.user.id } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "BALANCE_DUE" || order.balanceDue <= 0) {
    return NextResponse.json({ error: "This order has no balance to pay right now." }, { status: 400 });
  }

  const reference = newReference("BAL");
  const payment = await prisma.payment.create({
    data: {
      reference,
      kind: "BALANCE",
      provider: parsed.data.provider,
      amount: order.balanceDue,
      orders: { connect: { id: order.id } },
    },
  });

  try {
    const { redirectUrl, providerRef } = await gateway.startCheckout({
      reference,
      amount: order.balanceDue,
      description: `Balance for order ${order.orderNumber}`,
      buyer: { name: order.shipName, email: session.user.email, phone: order.shipContact },
      returnUrl: appUrl(`/api/payments/return?ref=${reference}`),
      cancelUrl: appUrl(`/profile/orders/${order.id}?payment=cancelled`),
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef } });
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error(err);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "We couldn't connect to the payment provider." }, { status: 502 });
  }
}
