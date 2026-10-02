// Test-only gateway: pretends every payment succeeds.
// Enabled with PAYMENT_MOCK=true and NEVER available in production.
import type { PaymentGateway } from "./types";

export const mock: PaymentGateway = {
  isEnabled: () => process.env.PAYMENT_MOCK === "true" && process.env.NODE_ENV !== "production",
  async startCheckout(input) {
    return { redirectUrl: input.returnUrl, providerRef: `mock_${input.reference}` };
  },
  async confirmPaid() {
    return true;
  },
};
