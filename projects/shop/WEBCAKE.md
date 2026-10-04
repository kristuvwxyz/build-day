# Using Webcake with the shop

**Webcake** = your main website and design (homepage, brand story, promos, landing pages).
**Shop app** (this code) = everything that needs a server: products, cart, checkout and payments,
login + 2FA, My Orders, My Wishlist, My Account, cancellations, vouchers, Contact Us inbox, admin.

```
yourshop.com          → Webcake (your friend's design)
shop.yourshop.com     → this shop app (hosted on Vercel or similar)
```

Webcake pages show live products and link buyers to the shop app. Buyers log in, pay and manage
orders on `shop.yourshop.com`. The shop logo there links back to the Webcake site.

> Why not put everything inside Webcake? Webcake builds pages; it can't run this app's database, payments,
> 2FA or admin. Don't put the shop inside an iframe either: Facebook and Google logins and the payment pages
> don't work inside iframes. Normal links (below) open the shop in the same tab.

---

## 1. Put the shop app online (once)

1. Deploy the shop app (see README → Deploy), e.g. on Vercel.
2. In Vercel → Project → Settings → Domains, add `shop.yourshop.com`.
3. At your domain provider, add the DNS record Vercel shows (usually `CNAME shop → cname.vercel-dns.com`).
   Leave the main domain pointed at Webcake as it is.
4. In the shop's environment variables set:
   - `NEXTAUTH_URL=https://shop.yourshop.com`
   - `NEXT_PUBLIC_MAIN_SITE_URL=https://yourshop.com` (logo links back to Webcake)
5. Use `https://shop.yourshop.com/api/auth/callback/...` as the redirect URLs for Facebook / Google / Apple login.

## 2. Add the script to Webcake (once per page, or site-wide)

Add this where Webcake lets you add custom code (an **HTML / custom code element**, or the page's / site's
custom code section before `</body>`):

```html
<script src="https://shop.yourshop.com/embed.js" defer></script>
```

## 3. Copy-paste blocks

Put these in Webcake **HTML / custom code elements**. Replace nothing else; the script fills them in.

### Product grid (live from the shop)

```html
<!-- Newest products -->
<div data-shop-products data-limit="8"></div>

<!-- Pre-orders only -->
<div data-shop-products data-type="PREORDER" data-limit="8"></div>

<!-- On-hand only -->
<div data-shop-products data-type="ONHAND" data-limit="8"></div>

<!-- One brand (must match the Brand field in Admin → Products) -->
<div data-shop-products data-brand="Maison Margiela" data-limit="4"></div>
```

Each card shows the photo, PRE-ORDER / ON-HAND badge, wishlist heart, brand, name, price, and the
pre-order ETA plus "₱200 off if paid in full". Clicking opens the product page in the shop, where the buyer
sees the perfume card and "You may also like…", saves to wishlist, chooses full payment or 50% downpayment,
and adds to cart. Products, prices and stock update automatically; nothing to edit in Webcake.

### Menu / buttons

Any Webcake button or link can point to the shop. Easiest is to paste these as links (style them
in Webcake), or set the button's link to the address on the right:

| Button | Link |
|---|---|
| Shop | `https://shop.yourshop.com/` |
| Pre-orders | `https://shop.yourshop.com/?type=PREORDER` |
| On-hand | `https://shop.yourshop.com/?type=ONHAND` |
| Cart | `https://shop.yourshop.com/cart` |
| My Orders | `https://shop.yourshop.com/profile?tab=orders` |
| My Wishlist | `https://shop.yourshop.com/profile?tab=wishlist` |
| My Account | `https://shop.yourshop.com/profile?tab=account` |
| Log in | `https://shop.yourshop.com/login` |
| Contact Us | `https://shop.yourshop.com/contact` |
| One product | `https://shop.yourshop.com/product/<web-address>` (shown in Admin → Products) |

Or, inside an HTML element, use `data-shop-link` and the script fills in the address:

```html
<a data-shop-link="shop">Shop</a>
<a data-shop-link="preorder">Pre-orders</a>
<a data-shop-link="cart">Cart</a>
<a data-shop-link="orders">My Orders</a>
<a data-shop-link="wishlist">Wishlist</a>
<a data-shop-link="account">My Account</a>
<a data-shop-link="contact">Contact Us</a>
```

## 4. Match the grid to the Webcake design

The grid uses the page's own font. Colours and layout can be changed with CSS variables, added in
Webcake's custom CSS (or a `<style>` in the HTML element):

```html
<style>
  [data-shop-products] {
    --shopx-cols: 4;            /* columns on desktop */
    --shopx-cols-tablet: 3;
    --shopx-cols-mobile: 2;
    --shopx-gap: 16px;
    --shopx-radius: 12px;       /* card corners */
    --shopx-card-bg: #ffffff;
    --shopx-border: #e5e7eb;
    --shopx-accent: #e11d48;    /* heart colour */
    --shopx-pre-bg: #fbbf24;  --shopx-pre-fg: #451a03;   /* PRE-ORDER badge */
    --shopx-on-bg: #10b981;   --shopx-on-fg: #ffffff;    /* ON-HAND badge */
  }
  /* Anything else: target .shopx-card, .shopx-name, .shopx-price, .shopx-meta, .shopx-badge */
</style>
```

## 5. Make the shop app look like the Webcake site

The shop app's pages should match the Webcake design. Your friend can restyle them freely
(colours in `tailwind.config.ts`, shop name in `src/lib/config.ts`, any page or component). See
`INTEGRATION.md`. The logic and APIs stay the same.

## For developers: the public endpoints

- `GET https://shop.yourshop.com/api/public/products?type=PREORDER|ONHAND&brand=…&limit=1-48`
  returns `[{ name, brand, slug, url, imageUrl, price (centavos), type, eta, inStock, fullPaymentDiscount, topAccords }]`.
  CORS is open, so it can be used from Webcake custom code to build a fully custom layout.
- `GET https://shop.yourshop.com/embed.js` is the script above.
