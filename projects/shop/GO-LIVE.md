# Put the shop online: step by step

Your **Shopify store keeps running the whole time.** The new shop first goes live on a free Vercel
address, then on `shop.yourdomain.com`. Nothing here changes your Shopify store or its main address.

Time needed: about 1–2 hours. Cost: ₱0 to start (Vercel, Neon and Resend have free plans).

Replace `yourdomain.com` below with your real domain.

---

## Step 1: Get the code onto the main branch (5 min)

The code is on GitHub at `kristuvwxyz/build-day`, branch `claude/zealous-turing-un21qa`.
Vercel publishes the **main** branch, so merge it first:

1. On GitHub, open the repository → **Pull requests** → **New pull request**.
2. Base: `main` ← compare: `claude/zealous-turing-un21qa` → **Create pull request** → **Merge**.

(Or ask Claude to open the pull request for you; you only click **Merge**.)

## Step 2: Create the project on Vercel (10 min)

1. Go to **vercel.com** → log in with GitHub → **Add New… → Project**.
2. Pick **build-day** → **Import**.
3. **Root Directory**: click **Edit** → choose **`projects/shop`** → Continue. *(Important: the shop code is in this folder.)*
4. Framework: **Next.js** (detected automatically). Leave the build settings as they are.
5. **Don't deploy yet**: open **Environment Variables** and do Step 3 first.
   (If it already deployed and failed, that's fine. It will work after Step 3.)

## Step 3: Add the database (5 min)

1. In the Vercel project → **Storage** tab → **Create Database** → **Neon (Postgres)** → free plan →
   region **Singapore** (closest to the Philippines) → **Create** → **Connect** to the project.
2. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically. Check they appear in
   **Settings → Environment Variables**.

The tables are created automatically on every deploy, so you don't need to run anything.

## Step 4: Add the settings (10 min)

Vercel project → **Settings → Environment Variables**. Add each one (Environment: **Production** and **Preview**):

| Name | Value |
|---|---|
| `NEXTAUTH_SECRET` | A long random password. Get one at **generate-secret.vercel.app/32** and paste it. Never share it. |
| `NEXTAUTH_URL` | For now: your Vercel address, e.g. `https://build-day-xxxx.vercel.app` (see Step 5). Later: `https://shop.yourdomain.com` |
| `ADMIN_EMAILS` | The email you'll log in with (this opens `/admin`). |
| `NEXT_PUBLIC_MAIN_SITE_URL` | Your main website, e.g. `https://yourdomain.com` |
| `PAYMENT_MOCK` | `false` |

Then **Deployments** → latest deployment → **⋯ → Redeploy**. When it shows **Ready**, click **Visit**.
The shop opens, empty (no products yet).

## Step 5: Turn on email (needed for the 2FA login code) (15 min)

1. Sign up at **resend.com** (free).
2. **Domains → Add Domain** → enter `yourdomain.com`. Resend shows a few DNS records (TXT/MX).
3. Add those records in **Shopify admin → Settings → Domains → your domain → Domain settings → Edit DNS settings → Add custom record**.
   These only add email permission and don't affect your Shopify store.
   ⚠ If Shopify already has an MX record for the same name, tell Claude before changing anything.
4. Back in Resend, click **Verify**. It can take a few minutes to a few hours.
5. Resend → **API Keys → Create** → copy it.
6. In Vercel, add:
   - `RESEND_API_KEY` = the key
   - `EMAIL_FROM` = `Your Shop Name <orders@yourdomain.com>`
   - `SHOP_INBOX_EMAIL` = where you want cancellation requests and Contact Us messages sent
7. Redeploy.

## Step 6: Turn on Google login (15 min)

Start with Google; it's the quickest. Facebook and Apple can come later.

1. **console.cloud.google.com** → create a project (e.g. "My Shop").
2. **APIs & Services → OAuth consent screen** → External → fill in the app name and your email → Save.
3. **Credentials → Create Credentials → OAuth client ID** → type **Web application**.
4. **Authorized redirect URIs** → add:
   - `https://YOUR-VERCEL-ADDRESS.vercel.app/api/auth/callback/google`
   - `https://shop.yourdomain.com/api/auth/callback/google` (for later)
5. Copy the **Client ID** and **Client secret** into Vercel as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Redeploy.
6. Test: open your Vercel address → **Log in** → Google → enter the 6-digit code from your email.
   You should land on **My Profile**, and **Admin** appears in the menu.

## Step 7: Add your products (as long as you need)

Open **Admin → Products → + Add product**. For each perfume, fill in the price, pre-order or on-hand,
the stock or ETA, a photo link, and the perfume card details (brand, notes, accords, Fragrantica link).

**Faster: import from Shopify.**
1. Shopify admin → **Products → Export** → All products → **CSV for Excel…** → Export. Shopify emails you the file.
2. New shop → **Admin → Products → Import from Shopify** → upload the file.
3. Check the list: tag pre-order items as **Pre-order** (or tag them `pre-order` in Shopify before exporting), add ETAs,
   and fill in the perfume cards. Each size (50ml / 100ml) becomes its own product.

## Step 8: Payments, in test mode first

1. **PayPal**: developer.paypal.com → Apps & Credentials → **Sandbox** → create app → copy the Client ID and Secret →
   Vercel: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com`.
2. **Maya**: Maya Business Manager → developer / API keys (sandbox) → Vercel: `MAYA_PUBLIC_KEY`,
   `MAYA_SECRET_KEY`, `MAYA_BASE_URL=https://pg-sandbox.paymaya.com`. Set the webhook to
   `https://YOUR-ADDRESS/api/payments/maya/webhook`.
3. Redeploy → place a test order with each → check **My Orders** and **Admin**.
4. When everything works, swap in the **live** keys and base URLs (`https://api-m.paypal.com`, `https://pg.maya.ph`).

BDO needs extra code once BDO sends you their merchant documents. Ask Claude then.

## Step 9: Give the shop its own address `shop.yourdomain.com` (10 min)

1. Vercel project → **Settings → Domains** → add `shop.yourdomain.com`. Vercel shows a **CNAME** value (e.g. `cname.vercel-dns.com`).
2. **Shopify admin → Settings → Domains → your domain → Domain settings → Edit DNS settings → Add custom record**:
   - Type **CNAME**, Name **`shop`**, Points to: the value Vercel showed.
   - If a record named `shop` already exists, **stop and ask Claude**, or use another name like `order`.
   - **Don't change** the existing A record or `www` record. Those keep your Shopify store running.
3. Wait until Vercel shows **Valid Configuration** (minutes to a few hours).
4. Change `NEXTAUTH_URL` in Vercel to `https://shop.yourdomain.com` → Redeploy.
5. Update any login and payment links you set up with the Vercel address (Google redirect URI, Maya webhook).

## Step 10: Facebook and Apple login (optional, later)

- **Facebook**: developers.facebook.com → Create App → Facebook Login → Valid OAuth Redirect URI
  `https://shop.yourdomain.com/api/auth/callback/facebook` → `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`.
- **Apple**: needs a paid Apple Developer account (US$99/year). Ask Claude when you're ready.

## Step 11: Same-day delivery prices (optional, later)

Needs your pickup address with map coordinates, a Lalamove API account and a Google Maps key.
Until then, same-day shows the flat ₱250. Ask Claude when ready.

---

## Later: moving off Shopify

Only when the new shop is fully tested:
1. Build your Webcake pages (see `WEBCAKE.md`) on Webcake's free address first.
2. Pick a switch-over day, then point `yourdomain.com` to Webcake (Webcake shows the DNS records).
   That moment takes the Shopify storefront offline, so plan it.
3. Keep Shopify open a little longer to finish any orders already placed there.

## If something goes wrong

- **Deploy failed**: Vercel → Deployments → click the failed one → **Build Logs**. Copy the red error to Claude.
- **"Environment variable not found"**: a setting from Step 3 or 4 is missing or misspelled.
- **Login loops back to the login page**: `NEXTAUTH_URL` doesn't match the address you're using.
- **No 2FA email**: check spam. Check Resend → Logs, and that the domain shows **Verified**.
