# Put the shop live at shop.famcoventures.com

Host: **Vercel** (made by the Next.js team, free to start, deploys from GitHub).
Database tables are created automatically on each deploy.

## 1. Vercel project (5 min)
1. Sign up at vercel.com with your GitHub account.
2. **Add New → Project** → pick `build-day` → **Root Directory:** `projects/regal-shop` → Deploy (the first deploy may fail until step 2 and 3 are done; that's fine).

## 2. Database (2 min)
Vercel project → **Storage** → **Create** → **Neon (Postgres)** → Free → Connect.
This adds `DATABASE_URL` for you.

## 3. Settings (Vercel → Settings → Environment Variables)
Minimum to open the shop:
| Name | Value |
|---|---|
| `NEXTAUTH_URL` | `https://shop.famcoventures.com` |
| `NEXTAUTH_SECRET` | any long random text (40+ characters) |
| `ADMIN_EMAILS` | `kristinsumiran@gmail.com` |
| `RESEND_API_KEY` + `EMAIL_FROM` | from resend.com (sends the 2FA login codes) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google login (see `.env.example`) |
| `MAYA_*` or `PAYPAL_*` | at least one payment option |

Everything else (Facebook/Apple login, BDO, Lalamove) can be added later. See `.env.example`.
Then **Deployments → ⋯ → Redeploy**.

## 4. Domain
Vercel → **Settings → Domains** → add `shop.famcoventures.com`.
Vercel shows a **CNAME** record. Add it where famcoventures.com's DNS is managed.

## 5. Link from Webcake
In the Webcake editor, set your Shop / Buy buttons to `https://shop.famcoventures.com` → Publish.

## 6. Add products
Log in at `shop.famcoventures.com/login` with the admin email → `/admin/products`.
