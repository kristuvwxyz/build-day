# RS OS: Maya Checkout links for RS OS orders

RS OS ("Create Maya link" on the Royal Receipt, or "Card · Maya Checkout" in Create order) makes a Maya Checkout link
for the order's amount due, saves it as the order's pay link and emails the Royal Receipt with a Pay now button.

## Done (Oct 9, 2026): the public key is saved in Supabase app_settings.maya_public_key (supabase/maya-key.sql). Or: add it in Vercel (no website change)
1. Open Maya Business Manager → **Developers / API keys** and copy the **Public key** (starts with `pk-`).
2. Open https://vercel.com/kristuvwxyz/regal-spritz-os/settings/environment-variables
3. Add **MAYA_PUBLIC_KEY** = the key → Save. Then **Deployments → ⋯ → Redeploy**.

## Or: let the website backend make it (paste below the line into the website chat)

---

Please add an `opsMayaCheckout` action to the website backend (same key check as opsOrders).
Input: `{ ref, amount, name, email, phone, items: [{ name, qty, total }] }`.
Make a Maya Checkout with the store's Maya key for `amount` PHP, `requestReferenceNumber = ref`,
redirect URLs to https://www.regalspritz.com/account, and answer `{ ok: true, url: <checkout redirectUrl>, id: <checkoutId> }`.
After saving: **Deploy → Manage deployments → Edit → New version → Deploy** (same web app URL).
