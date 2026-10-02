export type StartCheckoutInput = {
  reference: string; // our Payment.reference
  amount: number; // centavos
  description: string;
  buyer: { name: string; email?: string | null; phone: string };
  returnUrl: string; // gateway sends the buyer here after paying
  cancelUrl: string; // ...or here if they cancel
};

export type StartCheckoutResult = { redirectUrl: string; providerRef: string };

export interface PaymentGateway {
  /** Is this gateway configured in .env? */
  isEnabled(): boolean;
  /** Create a hosted checkout and return the page to send the buyer to. */
  startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult>;
  /** Ask the gateway (server-to-server) whether this payment is really paid. */
  confirmPaid(p: { reference: string; providerRef: string | null; amount: number }): Promise<boolean>;
}

export const toPesoString = (centavos: number) => (centavos / 100).toFixed(2);
