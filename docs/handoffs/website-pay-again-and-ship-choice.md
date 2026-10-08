# Website: "Pay now" in Order History + shipping choice for mixed carts

Paste everything below the line into the website (Apps Script backend + WebCake site) chat.

---

Please add these to regalspritz.com and the website backend. RS OS already does the rest (see "Already handled by RS OS").

## 1. "Pay now" for unpaid Maya Checkout orders (customer pressed Back during payment)
- In **My Account → Order History** and the order details, every order that is **Maya Checkout + not paid + status Placed + less than 24 hours old** shows a **Pay now** button and the text "Please pay by {time placed + 24h, Manila time} or the order is cancelled."
- Pay now opens a working Maya Checkout for the amount still due (`due`): reuse the order's current checkout if it hasn't expired, otherwise create a new one for the same order number. Save the newest checkout URL on the order.
- Set Maya's **cancel / back / failure redirect URL** to the customer's order page (with the Pay now button), not the cart.
- After 24 hours unpaid: the button is gone and the order shows Cancelled.

## 2. Email when the Maya payment link is ready
- When an unpaid Maya order is placed, email the buyer (store Gmail, same sender as opsEmail): subject "Your payment link is ready · order RSxxxx", a **Pay now** button (the link from #1), and "Please pay by {deadline}".

## 3. 24-hour auto-cancel (backup)
- RS OS already cancels unpaid Maya orders placed from Oct 8, 2026 after 24 hours **while any team member has RS OS open**, and emails the buyer.
- Please add the same as a backup in the backend: an hourly time-driven trigger that sets status **Cancelled** on those orders and emails the buyer "Order RSxxxx cancelled: we didn't receive the payment within 24 hours. Reply if you'd still like the items." Only email for orders the trigger itself cancels (so the buyer gets one email).

## 4. Shipping choice when the cart has On hand + Pre-order items
- On checkout, if the cart has both on-hand and pre-order items, show (required, no default):
  - **Ship my on-hand items now** (pre-order items ship when they arrive; the second delivery has its own shipping fee)
  - **Ship everything together** when the pre-order arrives
- Save the choice on the order as `shipPref`: `"ahead"` or `"together"`, show it in the order confirmation and Order History, and **include `shipPref` in `opsOrders`** (RS OS shows it in the Orders table next to Item type).
- Optional but helpful: include `kind: "onhand" | "preorder"` on each item in `opsOrders`.

## Already handled by RS OS (don't duplicate)
- Status update emails to buyers (confirmed, pre-order arrived, packing, shipped, cancelled) are sent by RS OS when the team changes the status. If the backend also emails on status changes, please turn that off.
- BDO payment link email: RS OS emails the buyer when staff paste the BDO link.
- A 50% DP pre-order shows as **Partially paid** in RS OS when `paid` is true and `due` < `total`. Keep sending `due` and `total` in `opsOrders`.

After saving: **Deploy → Manage deployments → Edit → New version → Deploy** (same web app URL).
