export type ProductType = "PREORDER" | "ONHAND";
export type PaymentOption = "FULL" | "DOWNPAYMENT_50";
export type PaymentProvider = "MAYA" | "PAYPAL" | "BDO" | "MOCK";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  price: number; // centavos
  type: ProductType;
  quantity: number;
  paymentOption: PaymentOption; // ONHAND is always FULL
};
