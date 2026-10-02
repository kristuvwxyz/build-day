# Integration guide (for the UI developer)

**Your UI design is yours.** This project supplies the shop's *operations*: database, rules, APIs, and small
example components. The pages under `src/app/` are working **reference screens** only.
Build your own layouts and call the same APIs / hooks; restyle or replace any component in `src/components/`.

Rules worth keeping wherever you put the UI:
- **Never compute prices only in the browser.** The server recalculates everything from the database at checkout.
- Every buyer API returns **401** until the buyer has passed 2FA. Send them to `/login?callbackUrl=…` on 401.
- All money values are **centavos** (`125000` = ₱1,250.00). Format with `peso()` from `src/lib/money.ts`.

---

## Features → where the logic lives

| Feature | Logic (keep) | API | Example UI (restyle) |
|---|---|---|---|
| Pre-order / on-hand, ₱200 full-payment discount, 50% DP | `lib/pricing.ts`, `lib/config.ts` | `POST /api/checkout` | `AddToCart`, `CheckoutForm`, `OrderSummary` |
| Cart NOTE, special packaging +₱20, voucher | `lib/pricing.ts` (`priceCart` extras), `lib/vouchers.ts` | `POST /api/vouchers/check` | `CartExtrasForm`, hooks `useCart().extras` + `useVoucher()` |
| Shipping fees (J&T by region, Lalamove live) | `lib/config.ts`, `lib/sameday.ts` | `POST /api/shipping/quote` | inside `CheckoutForm` |
| Payments (Maya / PayPal / BDO) | `lib/payments/*` | checkout + `/api/payments/*` | — |
| Login (Facebook / Google / Apple) | `lib/auth.ts` | `/api/auth/*` (NextAuth) | `LoginButtons` |
| **2FA email code** (required) | `lib/twoFactor.ts`, `getSession()` in `lib/auth.ts` | `POST /api/2fa/send`, `POST /api/2fa/verify` | `/verify` page, `TwoFactorForm` |
| **My Orders** + status tracker + pay balance | `lib/orderStatus.ts` | `POST /api/orders/:id/pay-balance` | `/profile` (orders tab), `/profile/orders/[id]`, `PayBalance` |
| **Cancel order** (needs shop approval if paid) | `lib/cancellation.ts` | `POST /api/orders/:id/cancel` | `CancelOrderButton` |
| **Wishlist heart** | — | `POST /api/wishlist` (toggle) | `WishlistButton` (props: `productId`, `initial`) |
| **My Account** (profile, birthday, scent prefs, Fragrantica link) | `lib/validation.ts` | `GET/PATCH /api/account` | `AccountForm` |
| **Saved addresses** | `lib/addresses.ts` | `GET/POST /api/addresses`, `PATCH/DELETE /api/addresses/:id` | `AddressBook` |
| **Perfume card** on every product | `lib/perfume.ts` | (server data on `Product`) | `PerfumeCard` (prop: `product`) |
| **You may also like…** | `lib/recommendations.ts` → `getRecommendations(productId, userId)` | — | `YouMayAlsoLike` (prop: `productId`) |
| **Contact Us** | — | `POST /api/contact` | `/contact`, `ContactForm` |
| Admin: orders, cancellations, products, vouchers, messages | `app/admin/actions.ts` | server actions | `/admin/*` |

---

## API reference (buyer)

All take/return JSON. Errors are `{ "error": "message to show the buyer" }`.

| Method & path | Body | Returns |
|---|---|---|
| `POST /api/2fa/send` | `{ email? }` (only if the account has no email) | `{ sentTo: "bu•••@gmail.com" }` |
| `POST /api/2fa/verify` | `{ code: "123456" }` | `{ ok: true }` → then reload / go to callbackUrl |
| `GET /api/account` | — | profile fields |
| `PATCH /api/account` | any of `name, phone, birthday ("YYYY-MM-DD"), favoriteNotes, favoriteAccords, favoriteBrands, fragranticaUrl` | updated profile |
| `GET /api/addresses` | — | `Address[]` (default first) |
| `POST /api/addresses` | `{ label?, name, contact, address, barangay, city, region, isDefault? }` | `Address` |
| `PATCH /api/addresses/:id` | any field, or `{ isDefault: true }` | `Address` |
| `DELETE /api/addresses/:id` | — | `{ ok: true }` |
| `POST /api/wishlist` | `{ productId }` | `{ wishlisted: boolean }` |
| `POST /api/vouchers/check` | `{ code, items: [{ productId, quantity, paymentOption }] }` | `{ code, discount, description }` |
| `POST /api/shipping/quote` | `{ address, barangay, city }` | `{ fee, mapAddress, token }` (pass `token` to checkout) |
| `POST /api/checkout` | `{ items, shipping: {name, contact, address, barangay, city, region}, shippingMethod: "JNT"\|"SAMEDAY", provider: "MAYA"\|"PAYPAL"\|"BDO", note?, specialPackaging?, voucherCode?, saveAddress?, sameDayQuoteToken? }` | `{ redirectUrl }` → send the browser there |
| `POST /api/orders/:id/pay-balance` | `{ provider }` | `{ redirectUrl }` |
| `POST /api/orders/:id/cancel` | `{ reason }` | `{ cancelled: true }` (unpaid) or `{ requested: true }` (waits for approval) |
| `POST /api/contact` | `{ name, email, phone?, orderNumber?, subject, message }` | `{ ok: true }` |

`paymentOption` is `"FULL"` or `"DOWNPAYMENT_50"` (on-hand items are always `"FULL"`).

## Client hooks

- `useCart()` → `{ items, add, remove, setQuantity, setPaymentOption, extras: { note, specialPackaging, voucherCode }, setExtras, clear }`
  (wrap the app in `<Providers>`; cart lives in the browser's localStorage)
- `useVoucher()` → `{ state, discount, apply(code), remove() }`, re-checked automatically when the cart changes
- `priceCart(items, feePerShipment | null, { specialPackaging, voucherDiscount })` → the same totals the server will charge

## Data your pages can read (server components)

- Products: `prisma.product` (perfume-card fields: `brand, perfumer, releaseYear, gender, concentration, sizeMl, topNotes, heartNotes, baseNotes, accords, longevity, sillage, fragranticaUrl`)
- Logged-in buyer (2FA passed): `await getSession()` from `lib/auth.ts` (returns `null` otherwise)
- Wishlist ids: `await getWishlistIds()` from `lib/wishlist.ts`
- Recommendations: `await getRecommendations(productId, userId)`

## About Fragrantica

Fragrantica has no public API and doesn't allow copying its content, so nothing is pulled from their site.
The **perfume card** is the shop's own data (entered in Admin → Products) displayed in a similar format, with a
"View this perfume on Fragrantica" link. Buyers can save their **Fragrantica profile link** in My Account.
If Fragrantica ever grants API access or a partnership, only `PerfumeCard`'s data source changes.
