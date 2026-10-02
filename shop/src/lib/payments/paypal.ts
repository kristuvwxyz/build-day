// PayPal Orders v2 — https://developer.paypal.com/docs/api/orders/v2/
// Sandbox base URL: https://api-m.sandbox.paypal.com  Live: https://api-m.paypal.com
import { toPesoString, type PaymentGateway } from "./types";

const BASE = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";

async function accessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

type PayPalOrder = {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
  purchase_units?: {
    payments?: { captures?: { status: string; amount: { value: string; currency_code: string } }[] };
  }[];
};

function isCapturedFor(order: PayPalOrder, amount: number) {
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  return (
    order.status === "COMPLETED" &&
    capture?.status === "COMPLETED" &&
    capture.amount.currency_code === "PHP" &&
    Math.round(Number(capture.amount.value) * 100) === amount
  );
}

export const paypal: PaymentGateway = {
  isEnabled: () => Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),

  async startCheckout(input) {
    const token = await accessToken();
    const res = await fetch(`${BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": input.reference,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: input.reference,
            custom_id: input.reference,
            description: input.description.slice(0, 127),
            amount: { currency_code: "PHP", value: toPesoString(input.amount) },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: input.returnUrl,
              cancel_url: input.cancelUrl,
              user_action: "PAY_NOW",
              shipping_preference: "NO_SHIPPING",
            },
          },
        },
      }),
    });
    if (!res.ok) throw new Error(`PayPal order failed: ${res.status} ${await res.text()}`);
    const order = (await res.json()) as PayPalOrder;
    const link = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve");
    if (!link) throw new Error("PayPal did not return an approval link");
    return { redirectUrl: link.href, providerRef: order.id };
  },

  async confirmPaid({ reference, providerRef, amount }) {
    if (!providerRef) return false;
    const token = await accessToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const getRes = await fetch(`${BASE}/v2/checkout/orders/${providerRef}`, { headers, cache: "no-store" });
    if (!getRes.ok) return false;
    let order = (await getRes.json()) as PayPalOrder;

    // Buyer approved on PayPal → capture the money now.
    if (order.status === "APPROVED") {
      const capRes = await fetch(`${BASE}/v2/checkout/orders/${providerRef}/capture`, {
        method: "POST",
        headers: { ...headers, "PayPal-Request-Id": `${reference}-capture` },
      });
      if (!capRes.ok) return false;
      order = (await capRes.json()) as PayPalOrder;
    }
    return isCapturedFor(order, amount);
  },
};
