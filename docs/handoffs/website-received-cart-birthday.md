# Website: "Order received" button, cart reminder email, birthday voucher

Paste everything below the line into the website (Apps Script backend + WebCake site) chat.

---

Please add these three to regalspritz.com and the website backend. Emails go from the store Gmail (same sender as opsEmail) and use the Regal Spritz look (purple header, gold accents, like the RS OS emails).

## 1. "Order received" button (My Account → Order History and order details)
- Show an **Order received** button on every order whose status is **Shipped** (shown to buyers as "Completed") and that isn't marked received yet.
- Tapping it saves `receivedAt` (ISO time with zone, e.g. `2026-10-14T15:20:00+08:00`) on the order and shows "Received ✓ {date}" instead of the button. Only the signed-in owner of the order can do it.
- **Include `receivedAt` in `opsOrders`.** RS OS uses it to send the review invitation right away (otherwise it waits 3 / 5 / 7 days after shipping, by Luzon / Visayas / Mindanao).
- Optional: also include `shippedAt` (when the status became Shipped) in `opsOrders`.

## 2. "You left something in your cart" reminder
- For signed-in customers (we have their email), save their cart in the backend whenever it changes (items, qty, updated time).
- Hourly time-driven trigger: if a cart has items, was last changed **3 to 24 hours ago**, the customer hasn't placed an order since, and no reminder was sent for this cart yet → email once:
  - Subject: "You left something in your cart 🛍️"
  - The items with photo, name, size and price, and a **Complete my order** button to https://www.regalspritz.com/ (opens the cart).
  - Line: "Pre-order slots and on-hand stock are limited, so we can't hold items for long."
  - Footer: "Don't want reminders? Reply 'unsubscribe'."
- Don't send if the cart's items are all sold out. Max one reminder per cart (a new reminder only after the cart changes again).

## 3. Birthday voucher (₱200 off, min. spend ₱1,500)
- Add an optional **Birthday (month and day)** field to sign-up and My Account → Profile ("Get a birthday treat from us 🎂").
- Daily time-driven trigger at 8:00 AM Manila: for each customer whose birthday is today, make a unique one-time code `BDAY-XXXXXX` worth **₱200 off with a minimum spend of ₱1,500**, valid **30 days**, usable once and only by that customer's account. Email it:
  - Subject: "Happy birthday, {first name}! 🎂 A ₱200 treat from Regal Spritz"
  - Big code box, "₱200 off orders of ₱1,500 or more · valid until {date}", **Shop now** button to https://www.regalspritz.com/.
- Checkout: a "Voucher code" box that checks the code (exists, not used, not expired, right customer, subtotal ≥ ₱1,500), takes ₱200 off, and marks it used when the order is placed. Show the discount on the order and include it in `opsOrders` (`discount`, `voucher`).
- One birthday voucher per customer per year.

## Already handled by RS OS (don't duplicate)
- Review invitation emails after shipping (each ordered item links to its product page).
- The one-time "new website" email to past buyers.
- Order status emails (confirmed, arrived, packing, shipped, cancelled).

After saving: **Deploy → Manage deployments → Edit → New version → Deploy** (same web app URL).
