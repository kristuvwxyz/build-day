import type { PaymentProvider } from "../types";
import { bdo } from "./bdo";
import { maya } from "./maya";
import { mock } from "./mock";
import { paypal } from "./paypal";
import type { PaymentGateway } from "./types";

export const GATEWAYS: Record<PaymentProvider, PaymentGateway> = {
  MAYA: maya,
  PAYPAL: paypal,
  BDO: bdo,
  MOCK: mock,
};

export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  MAYA: "Maya (card, Maya wallet, QR Ph)",
  PAYPAL: "PayPal",
  BDO: "BDO Checkout",
  MOCK: "Test payment (dev only)",
};

export function enabledPaymentProviders(): { id: PaymentProvider; label: string }[] {
  return (Object.keys(GATEWAYS) as PaymentProvider[])
    .filter((id) => GATEWAYS[id].isEnabled())
    .map((id) => ({ id, label: PROVIDER_LABELS[id] }));
}

export function getGateway(id: string): PaymentGateway | null {
  const g = GATEWAYS[id as PaymentProvider];
  return g && g.isEnabled() ? g : null;
}

export function appUrl(path: string) {
  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return base + path;
}

export function newReference(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}
