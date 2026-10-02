// BDO Checkout
// ------------------------------------------------------------------
// BDO gives its merchant API documentation and credentials only after
// your merchant account is approved, so this part must be completed by
// your developer using BDO's docs. Fill in the two functions below.
// The BDO option stays hidden at checkout until BDO_MERCHANT_ID and
// BDO_SECRET_KEY are set AND BDO_INTEGRATION_READY=true.
// ------------------------------------------------------------------
import type { PaymentGateway } from "./types";

export const bdo: PaymentGateway = {
  isEnabled: () =>
    Boolean(
      process.env.BDO_MERCHANT_ID &&
        process.env.BDO_SECRET_KEY &&
        process.env.BDO_INTEGRATION_READY === "true",
    ),

  async startCheckout(_input) {
    // TODO(developer): call BDO's "create payment / hosted checkout" endpoint with
    //   _input.reference, _input.amount (centavos → pesos), _input.returnUrl, _input.cancelUrl
    // and return { redirectUrl: <BDO payment page>, providerRef: <BDO transaction id> }.
    throw new Error("BDO Checkout is not implemented yet. See src/lib/payments/bdo.ts");
  },

  async confirmPaid(_p) {
    // TODO(developer): call BDO's "inquire transaction status" endpoint using
    //   _p.reference / _p.providerRef and return true only if it is paid
    //   AND the paid amount equals _p.amount.
    return false;
  },
};
