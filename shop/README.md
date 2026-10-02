# Shop website: developer handoff

A ready-to-run **Next.js 15 + TypeScript + Tailwind + Prisma (PostgreSQL)** shop that already implements the owner's shop processes:

- **PRE-ORDER** and **ON-HAND** buying flows
- **Shipping**: J&T Express or same-day Lalamove/Grab
- **Payments**: Maya, PayPal, BDO Checkout
- **Buyer profile**: Facebook, Google or Apple login, order history and status, and a wishlist
- **Admin page**: update order statuses and tracking numbers

All you need to add are API keys, a database, and real products.

> **Using Webcake?** Read **[WEBCAKE.md](WEBCAKE.md)**: Webcake is the main site, this app runs on
> `shop.yourdomain.com`, and copy-paste blocks put live products and shop buttons on Webcake pages.
>
> **UI developer:** you own the design. Read **[INTEGRATION.md](INTEGRATION.md)**: it maps every feature to the
> logic, API and example component you can restyle or replace. The pages in `src/app/` are reference screens.

---

## 1. The shop processes (as built)

### PRE-ORDER
| # | Step | Where |
|---|------|-------|
| 1 | Browse and choose a product (yellow **PRE-ORDER** badge) | `/` → `/product/[slug]` |
| 2 | Choose payment option: **Full payment (₱200 off per item)** or **50% downpayment** | Product page (can also be changed in the cart) |
| 3 | Add to cart | Product page |
| 4 | Checkout | `/cart` → `/checkout` (login required) |
| 5 | Mode of shipping: **J&T** or **Same-day Lalamove/Grab** | Checkout, section 2 |
| 6 | Shipping details: **Name, Contact number, Address, Barangay** (+ City and Region) | Checkout, section 1 |
| 7 | Payment: **Maya / PayPal / BDO** | Checkout, section 3 → gateway's hosted page |
| 8 | *(50% DP only)* When the item arrives, the shop sets the order to **Arrived – Balance Due** and the buyer sees a **Pay balance** button in their profile | `/admin`, then `/profile/orders/[id]` |

### ON-HAND
Same flow without step 2. Items show a green **ON-HAND** badge and stock is checked and reduced automatically.

### Mixed cart (pre-order + on-hand together)
Allowed. One payment, but it creates **two orders** (two shipments): the on-hand order ships now and the pre-order ships when it arrives. Shipping is charged per shipment. To charge it only once, set `CHARGE_SHIPPING_PER_SHIPMENT = false` in `src/lib/config.ts`.

### Order statuses the buyer sees
`Pending Payment → Paid / 50% Downpayment Received → Awaiting Stock → Arrived – Balance Due → Processing / Packing → Shipped (with tracking no.) → Delivered` (or `Cancelled`).
Statuses change automatically when a payment succeeds. The rest are set by the shop owner on `/admin`.

### Buyer profile (`/profile`)
- **My Orders**: every order with its status, progress tracker, history, tracking number, Pay Balance, and **Cancel order**
- **My Wishlist**: products saved with the ♥ button on any product card or product page
- **My Account**: name, mobile, birthday, scent preferences (notes / accords / brands), Fragrantica profile link, saved addresses

### Security: 2FA (required)
After logging in with Facebook / Google / Apple, buyers must enter a **6-digit code emailed to them** (`/verify`)
before they can see their account, check out, or use the wishlist. Codes expire in 10 minutes and allow 5 tries.
Needs `RESEND_API_KEY` (resend.com) in production.

### Cancellations
Buyers tap **Cancel order** and give a reason. Unpaid orders cancel right away. Paid orders become a
**request** that you approve or reject in **Admin → Orders**. Approving cancels the order and returns on-hand
stock; you then refund the buyer from your Maya / PayPal / BDO dashboard. You and the buyer get emails.

### Cart extras
**Note** (saved on the order), **special packaging +₱20** (once per checkout), and **voucher codes**
(created in **Admin → Vouchers**: fixed ₱ or %, minimum spend, cap, expiry, usage limits). Vouchers apply to
items only, not shipping, and count as used once the payment goes through.

### Product pages
Every product shows a **perfume card** (brand, concentration, notes pyramid, main accords, longevity, sillage,
"View on Fragrantica" link) filled in at **Admin → Products**, plus **"You may also like…"** picks based on
shared accords/notes/brand and the buyer's saved scent preferences.

### Contact Us
`/contact` form; messages appear in **Admin → Messages** and are emailed to `SHOP_INBOX_EMAIL`.

---

## 2. Owner settings (decisions you can change)

All in **`src/lib/config.ts`**:

| Setting | Current value |
|---|---|
| J&T shipping fee | Metro Manila & Luzon ₱130 · Visayas ₱160 · Mindanao ₱170 |
| Same-day (Lalamove/Grab) fee | **Live Lalamove price** to the buyer's address, Metro Manila only (₱250 flat until Lalamove is connected) |
| Shop pickup point for Lalamove | `SHOP_PICKUP`: **must be filled in** |
| Extra on top of Lalamove price | `SAMEDAY_EXTRA_FEE`: ₱0 |
| Downpayment | 50% |
| Pre-order **full payment** discount | ₱200 off **per item** (automatic) |
| Special packaging | ₱20 per checkout (`SPECIAL_PACKAGING_FEE`) |
| Contact details on Contact Us | `SHOP_CONTACT` |
| Which statuses buyers can cancel from | `CANCELLABLE_STATUSES` |
| Shop name | "My Shop" |

Brand colours: `tailwind.config.ts` (`brand`, `accent`).

---

## 3. Run it locally

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, NEXTAUTH_SECRET at minimum
npm run db:push               # create tables
npm run db:seed               # 4 sample products
npm run dev                   # http://localhost:3000
```

To try the whole flow without real payment keys, set `PAYMENT_MOCK=true` in `.env`. A "Test payment" option appears that always succeeds. It is automatically disabled in production.

Add and edit products, including perfume cards, at **`/admin/products`** (prices in pesos there).
Vouchers: `/admin/vouchers`. Messages: `/admin/messages`.

When testing locally without `RESEND_API_KEY`, the 2FA code is printed in the terminal running `npm run dev`.

---

## 4. Connect the services

Every key goes in `.env`. See `.env.example` for where to get each one. A login button or payment option **only appears once its keys are set**.

### Logins
| Provider | Redirect / callback URL to register |
|---|---|
| Facebook | `https://YOUR-DOMAIN/api/auth/callback/facebook` |
| Google | `https://YOUR-DOMAIN/api/auth/callback/google` |
| Apple | `https://YOUR-DOMAIN/api/auth/callback/apple` |

Apple notes: it requires a paid Apple Developer account, does **not** work on `localhost` (test on your HTTPS domain), and `APPLE_CLIENT_SECRET` is a JWT you generate from the `.p8` key that expires after at most 6 months.

### Payments
| Gateway | Status | Notes |
|---|---|---|
| **Maya** | Implemented (`src/lib/payments/maya.ts`) | Set the webhook in Maya Business Manager to `https://YOUR-DOMAIN/api/payments/maya/webhook` |
| **PayPal** | Implemented (`src/lib/payments/paypal.ts`) | PHP currency. Payment is captured when the buyer returns to the site. |
| **BDO Checkout** | **Needs completing** (`src/lib/payments/bdo.ts`) | BDO only releases its API docs to approved merchants. Fill in the 2 marked functions, then set `BDO_INTEGRATION_READY=true`. |

How payment confirmation works: the buyer is sent to the gateway's page. On return (and via the Maya webhook), the server **asks the gateway directly** whether the payment succeeded and the amount matches, then updates the orders. Browser-sent prices and webhook bodies are never trusted.

### Same-day delivery price (Lalamove)
1. Fill in `SHOP_PICKUP` in `src/lib/config.ts` (pickup address + lat/lng from Google Maps).
2. Set `LALAMOVE_API_KEY`, `LALAMOVE_API_SECRET` (Lalamove Partner Portal) and `GOOGLE_MAPS_API_KEY` (Geocoding API) in `.env`.

At checkout, when the buyer picks same-day, the server finds the address on Google Maps, asks Lalamove for a motorcycle quote (`src/lib/sameday.ts`), and shows the price plus "Delivering to: …" so the buyer can confirm the address. The price is signed by the server and valid for 30 minutes, so the buyer pays exactly what they saw. The drop-off pin is saved on the order and shown on `/admin` for booking the rider.
Grab has no public price API (GrabExpress API access is for approved partners only), so Grab bookings use the Lalamove price.

**Before go-live:** test each gateway in **sandbox** mode end to end, then switch the base URLs and keys to live.

---

## 5. Deploy

Any Node host works (Vercel, Railway, Render, a VPS). You'll need:
1. A PostgreSQL database (Supabase, Neon, Railway…) in `DATABASE_URL`
2. All `.env` values set on the host, with `NEXTAUTH_URL` = your live domain
3. `npm run build` → `npm start` (Vercel does this automatically), then run `npx prisma db push` once against the live DB
4. Your email in `ADMIN_EMAILS` to open `/admin`

---

## 6. File map

```
src/lib/config.ts              ← fees, regions, shop name (owner settings)
src/lib/pricing.ts             ← downpayment + shipping maths (shared by cart & server)
src/lib/orderStatus.ts         ← status names / colours
src/lib/auth.ts                ← Facebook / Google / Apple login
src/lib/payments/*             ← Maya, PayPal, BDO, test gateway + payment confirmation
src/lib/sameday.ts             ← live Lalamove same-day price (Google geocoding + Lalamove quote)
src/lib/twoFactor.ts           ← 2FA email codes
src/lib/cancellation.ts        ← cancel requests + approval
src/lib/vouchers.ts            ← voucher rules
src/lib/perfume.ts             ← perfume card helpers (accords, notes)
src/lib/recommendations.ts     ← "You may also like…"
src/app/page.tsx               ← shop (product grid with badges)
src/app/product/[slug]         ← product page (payment option + add to cart)
src/app/cart                   ← cart
src/app/checkout               ← shipping details, shipping mode, payment
src/app/profile                ← My Orders / My Wishlist / Account
src/app/profile/orders/[id]    ← order details, tracker, Pay Balance
src/app/admin                  ← owner: update statuses & tracking numbers
src/app/api/*                  ← checkout, shipping quote, pay-balance, payment return, Maya webhook, wishlist
prisma/schema.prisma           ← database tables
```

Screenshots of the tested flow are in `docs/screenshots/` (product photos show grey because the sample images are placeholders).
