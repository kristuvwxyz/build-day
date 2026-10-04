# Regal Spritz PH: standalone app (phones + computers)

The same app as the claude.ai version, running on its own website, so the team can install it like an app on iPhone, Android, Windows PC and Mac.

**How it fits together**

| Part | What it does | Cost |
|---|---|---|
| **Vercel** | Hosts the website. Also holds the Shopify keys in a small server part (`api/`). | Free |
| **Supabase** | The database and the login (one-time codes by email, or by text if you add an SMS service). | Free to start |
| **Shopify Dev Dashboard app** | Lets the server read orders, send tracking and update reviews. | Free |

The app code lives in `../business-os/index.html`. Every Vercel deploy rebuilds this folder from it (`node build.mjs`), so both versions always match.

Who can use it:
- Only people listed in Admin → Directory (by email or mobile number) can see any data. This is enforced by the database itself (`supabase/schema.sql`).
- The owner email set in the SQL is the owner (CEO).
- Anyone else who signs in sees "not in the team directory".

---

## Setup (about 30–40 minutes, one time)

### 1. Supabase: database and login
1. Go to **supabase.com** → sign up → **New project**.
   - Name it `regal-spritz`, choose region **Singapore**, and save the database password somewhere safe.
2. When it's ready, open **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` from this folder and copy all of it into the editor.
4. Near the bottom, replace `YOUR-EMAIL@example.com` with **your** sign-in email. Press **Run**. It should say "Success".
5. **Authentication → Sign In / Providers → Email**: make sure Email is **on**.
6. **Authentication → Email Templates → Magic Link**: replace the message with:
   `Your Regal Spritz sign-in code is {{ .Token }}`
   Then **Save**. This makes the email show a 6-digit code instead of a link.
7. **Project Settings → API**: keep this tab open. You need the **Project URL** and the **anon public** key in step 2.

> **Important:** Supabase's built-in email only sends a few emails per hour, which is meant for testing. Before the whole team signs in:
> 1. Make a free **Resend** account (resend.com) and add your email domain there.
> 2. Copy its SMTP details into Supabase → **Authentication → Emails → SMTP Settings**.
>
> Each person stays signed in on their device, so codes are only needed now and then.

### 2. Vercel: the website
1. Go to **vercel.com** → sign up with **GitHub** → **Add New → Project** → import the `build-day` repository.
2. **Root Directory**: click Edit and pick `projects/business-os-app`. Framework: **Other**.
3. **Environment Variables**: add these:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | Project URL from Supabase |
   | `SUPABASE_ANON_KEY` | anon public key from Supabase |
   | `SHOPIFY_SHOP` | `tjs1uz-4a.myshopify.com` |

   Add the Shopify keys after step 3.
4. Press **Deploy**.
5. Go to **Settings → Git → Production Branch** and set it to `claude/vibrant-shannon-n2cw0j`, so the live site follows this branch.
6. Copy your site address (e.g. `regal-spritz.vercel.app`).
7. In Supabase, open **Authentication → URL Configuration** and paste that address as the **Site URL**.

### 3. Shopify: connect orders
Shopify no longer lets stores create keys from the admin, so you make a small private app once:
1. Go to **dev.shopify.com** (Dev Dashboard) and sign in with your store login. Open **Apps → Create app**, name it `Regal Spritz OS`.
2. Under **Versions → Create version → Access scopes**, tick these and **Release**:
   - `read_orders`, `write_orders`, `read_customers`, `write_customers`, `read_products`
   - `read_merchant_managed_fulfillment_orders`, `write_merchant_managed_fulfillment_orders`
   - `read_fulfillments`, `write_fulfillments`
   - `read_metaobjects`, `write_metaobjects`
3. Install the app on your store (**Install app** → pick your store).
4. Open **Settings** and copy the **Client ID** and **Client secret**.
5. In Vercel → **Settings → Environment Variables**, add `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`. Then go to **Deployments → ⋯ → Redeploy**.

If Shopify says *shop_not_permitted*, your store isn't in the same Dev Dashboard organization as the app. In that case, add the store to the organization, or use an existing admin-made app's token as `SHOPIFY_ADMIN_TOKEN` instead.

### 4. Move your data
1. In the **claude.ai version**: My account → **Access & security** → Developer options → **Download full backup**. Keep this file private: it has your team's details.
2. Open your new site, sign in with **your** email and the code you receive.
3. My account → **Access & security** → **Import backup** → pick the file. Wait for "Imported … records".
4. Check Orders, Tasks and the Directory. Each person's own settings (work style) start fresh.

### 5. Install it on every device
Send the team your site address (e.g. `regal-spritz.vercel.app`). Each person opens it once, signs in, then installs it:

| Device | How to install | Opens from |
|---|---|---|
| **iPhone / iPad** | Open in **Safari** → **Share** (square with arrow) → **Add to Home Screen** → **Add** | Home Screen icon |
| **Android** | Open in **Chrome** → tap **⬇ Install app** at the bottom (or ⋮ → **Install app**) | Home screen / app drawer |
| **Windows PC** | Open in **Edge** or **Chrome** → click **⬇ Install app** (or the install icon ⊕ at the right of the address bar) → **Install** | Start menu, taskbar, desktop shortcut |
| **MacBook (Chrome / Edge)** | Open in Chrome or Edge → **⬇ Install app** (or the install icon in the address bar) → **Install** | Launchpad, Dock, Applications folder |
| **MacBook (Safari, macOS 14+)** | Open in Safari → **File** → **Add to Dock** → **Add** | Dock, Launchpad |

It opens in its own window with the Regal Spritz icon, like a normal app, with no browser bars. It updates by itself: when you change the app, everyone gets the new version the next time they open it.

Tips:
- To pin on Windows: right-click the app in the taskbar → **Pin to taskbar**.
- To pin on a Mac: right-click the Dock icon → **Options** → **Keep in Dock**.
- The **⬇ Install app** button only shows in Chrome and Edge, and disappears once installed.

### Setup checklist
- [ ] Supabase project made, `schema.sql` run with your email (step 1)
- [ ] Email code template saved (step 1.6)
- [ ] Vercel deployed, 3 variables added, production branch set (step 2)
- [ ] Supabase Site URL set to your Vercel address (step 2.7)
- [ ] Shopify app made, 2 keys added to Vercel, redeployed (step 3)
- [ ] Backup downloaded from claude.ai and imported (step 4)
- [ ] Resend email connected before inviting the team (step 1 note)
- [ ] Team installed it on their phones / computers (step 5)

---

## Optional later
- **Sign in by mobile number:** Supabase → Authentication → Providers → **Phone** → connect an SMS service (e.g. Twilio, paid per text). The app's "Mobile number" tab then works. Numbers must match the Directory.
- **App Store / Google Play / Microsoft Store listing:** paste your site address into **pwabuilder.com**. It makes the store packages for you.
  - Apple developer account: $99 a year. Google Play: $25 one time. Microsoft Store: free for individuals.
  - Store listing is not needed for the team: installing from the website (step 5) works on every device.
  - Apple reviews new apps, usually within 1–2 weeks.

## Files
- `build.mjs`: builds `public/index.html` from the shared app code and adds the login and data connection.
- `public/shim.js`: connects the app to Supabase (database, live updates, login screen), downloads, and the Shopify server route.
- `api/config.js`: gives the browser the public Supabase address.
- `api/shopify.js`: passes the app's Shopify requests to Shopify. It allows signed-in team members only, and only the app's own request types.
- `supabase/schema.sql`: database table, access rules, live updates.
- `public/manifest.webmanifest`, `public/sw.js`, `public/icons/`: make it installable, with the app shell cached for slow connections.
