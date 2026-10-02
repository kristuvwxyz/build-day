# Regal Spritz: what to change on the Webcake site

Your Webcake site (`regal.famcoventures.com`) stays the front door. The shop features run on the
shop app, which already looks like Regal Spritz. Below, **SHOP** means your shop app's address once it's
online (GO-LIVE.md Steps 2–9), for example `https://shop.famcoventures.com`.
Until then, use the Vercel address (e.g. `https://build-day-xxxx.vercel.app`).

Do these in Webcake's editor, then **Publish**.

---

## 1. Add the shop script once (site-wide)

Webcake → your site → **Settings / Custom code** (the box for code before `</body>`) → paste, replacing SHOP:

```html
<script src="SHOP/embed.js" defer></script>
```

## 2. Top menu: change where each item links

Click each menu item → **Link** → paste:

| Menu item | Link |
|---|---|
| SHOP | `SHOP/` |
| FOR HER | `SHOP/?gender=Women` |
| FOR HIM | `SHOP/?gender=Men` |
| UNISEX | `SHOP/?gender=Unisex` |
| ARABIAN | `SHOP/?tag=arabian` |
| PRE-ORDER | `SHOP/?type=PREORDER` |
| AUTHENTICITY | keep as is (your Webcake section) |
| 🛍 bag icon | `SHOP/cart` |

**Add one icon** next to the bag (a person icon or the text "ACCOUNT") linked to `SHOP/profile`.
Buyers use it for log in, My Orders, My Wishlist and My Account.

## 3. Hero buttons

| Button | Link |
|---|---|
| SHOP ON-HAND | `SHOP/?type=ONHAND` |
| BROWSE PRE-ORDERS | `SHOP/?type=PREORDER` |

## 4. Live numbers ("155 ON HAND · 511 OPEN PRE-ORDERS")

Delete the two typed numbers and put an **HTML element** in their place with this (it keeps your fonts and purple):

```html
<div style="display:flex;gap:44px;font-family:'Cormorant Garamond',serif;color:#3d1a6e">
  <div><div data-shop-count="onHand" style="font-size:40px;line-height:1">–</div>
    <div style="font-family:Jost,sans-serif;font-size:12px;letter-spacing:.2em;color:#2b2233">ON HAND</div></div>
  <div><div data-shop-count="preOrders" style="font-size:40px;line-height:1">–</div>
    <div style="font-family:Jost,sans-serif;font-size:12px;letter-spacing:.2em;color:#2b2233">OPEN PRE-ORDERS</div></div>
  <div><div style="font-size:40px;line-height:1">100%</div>
    <div style="font-family:Jost,sans-serif;font-size:12px;letter-spacing:.2em;color:#2b2233">AUTHENTIC</div></div>
</div>
```

The numbers update by themselves from your real stock.

## 5. "Now in the court" featured bottle

Set the card's **Link** to that product's page: `SHOP/product/<web-address>`
(the web address is shown in Shop Admin → Products when you open the product).

## 6. Product sections (live products with ♥ wishlist, badges and prices)

Wherever you want products, add an **HTML element** and paste one of these:

```html
<!-- New arrivals -->
<div data-shop-products data-limit="8"></div>

<!-- On-hand only -->
<div data-shop-products data-type="ONHAND" data-limit="8"></div>

<!-- Pre-orders only -->
<div data-shop-products data-type="PREORDER" data-limit="8"></div>

<!-- For Her / For Him / Unisex -->
<div data-shop-products data-gender="Women" data-limit="4"></div>
<div data-shop-products data-gender="Men" data-limit="4"></div>
<div data-shop-products data-gender="Unisex" data-limit="4"></div>

<!-- Arabian collection -->
<div data-shop-products data-tag="arabian" data-limit="8"></div>
```

They already use Regal colors (purple ON-HAND, gold PRE-ORDER, square cards). Products you add or
edit in Shop Admin appear here automatically. **Remove any products you typed by hand** in Webcake so prices never disagree.

## 7. Footer links

| Text | Link |
|---|---|
| My Orders | `SHOP/profile?tab=orders` |
| My Wishlist | `SHOP/profile?tab=wishlist` |
| My Account | `SHOP/profile?tab=account` |
| Contact Us | `SHOP/contact` |

## 8. Remove the extra space at the bottom of the homepage

The shop already has this fixed. On the Webcake homepage:
1. Scroll to the bottom of the page in the Webcake editor.
2. Click the empty area under your last section. If a **blank section** gets selected, press **Delete**.
3. Click your **last section** (usually the footer) → in the right panel, set **Height** to **Auto** (or drag its bottom edge up to just under the text).
4. In the same panel, set **Padding bottom** to about **24**.
5. Switch to the **📱 mobile view** (top bar) and repeat steps 2–4. Mobile has its own spacing in Webcake.
6. Click **Publish**.

---

## Where each feature lives

| Feature | Where buyers see it |
|---|---|
| Browse, filters, ♥ wishlist | Webcake pages (product sections) and the shop |
| Perfume card, "You may also like…" | Product page (shop) |
| Pre-order full payment (₱200 off) / 50% downpayment | Product page and cart (shop) |
| Note, special packaging +₱20, voucher | Cart (shop) |
| J&T / Lalamove-Grab shipping, Maya / PayPal / BDO | Checkout (shop) |
| Facebook / Google / Apple login + email 2FA | Log in (shop) |
| My Orders (status, pay balance, cancel), My Wishlist, My Account | Profile (shop) |
| Contact Us | Shop contact page (link it from Webcake) |

## Tagging products for the menu

In Shop Admin → Products → edit a perfume:
- **For**: For Her / For Him / Unisex → powers FOR HER, FOR HIM and UNISEX.
- **Collections**: type `arabian` → powers ARABIAN. Add other words too (e.g. `designer, tester, partial`) and link to `SHOP/?tag=tester`.

Importing from Shopify fills these in from your Shopify tags (`arabian`, `women`/`for her`, `men`/`for him`, `unisex`).

## Look settings (if you change the Webcake design)

Shop colors, fonts, announcement bar text and menu are in `src/lib/theme.ts`.
The AUTHENTICITY link points to `https://regal.famcoventures.com/#authenticity`; if your section has a different
name, ask Claude to update it. To show the crest logo, copy its image address from Webcake
(right-click the logo → Copy image address) and send it to Claude.
