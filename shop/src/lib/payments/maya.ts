// Maya Checkout — https://developers.maya.ph/reference/createv1checkout
// Keys come from Maya Business Manager. Sandbox base URL: https://pg-sandbox.paymaya.com
import { toPesoString, type PaymentGateway } from "./types";

const BASE = process.env.MAYA_BASE_URL ?? "https://pg-sandbox.paymaya.com";
const basic = (key: string) => "Basic " + Buffer.from(key + ":").toString("base64");

export const maya: PaymentGateway = {
  isEnabled: () => Boolean(process.env.MAYA_PUBLIC_KEY && process.env.MAYA_SECRET_KEY),

  async startCheckout(input) {
    const [firstName, ...rest] = input.buyer.name.trim().split(/\s+/);
    const value = Number(toPesoString(input.amount));
    const res = await fetch(`${BASE}/checkout/v1/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: basic(process.env.MAYA_PUBLIC_KEY!),
      },
      body: JSON.stringify({
        totalAmount: { value, currency: "PHP" },
        buyer: {
          firstName,
          lastName: rest.join(" ") || firstName,
          contact: { phone: input.buyer.phone, email: input.buyer.email ?? undefined },
        },
        items: [{ name: input.description, quantity: 1, totalAmount: { value } }],
        redirectUrl: { success: input.returnUrl, failure: input.cancelUrl, cancel: input.cancelUrl },
        requestReferenceNumber: input.reference,
      }),
    });
    if (!res.ok) throw new Error(`Maya checkout failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { checkoutId: string; redirectUrl: string };
    return { redirectUrl: data.redirectUrl, providerRef: data.checkoutId };
  },

  async confirmPaid({ reference, amount }) {
    // Look up payments made with our reference number (uses the SECRET key).
    const res = await fetch(`${BASE}/payments/v1/payment-rrns/${encodeURIComponent(reference)}`, {
      headers: { Authorization: basic(process.env.MAYA_SECRET_KEY!) },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const payments = (await res.json()) as { status: string; amount: string | number }[];
    return payments.some(
      (p) => p.status === "PAYMENT_SUCCESS" && Math.round(Number(p.amount) * 100) === amount,
    );
  },
};
