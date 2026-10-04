# Website orders → Shopify → dashboard

**Goal:** every order placed on **regal.famcoventures.com** shows up in the dashboard automatically, with no duplicate order numbers.

**How it works**
1. A customer orders on the website. The website's Google Apps Script saves it, as it does today.
2. The new `ShopifySync.gs` also creates the order in **Shopify**.
   - Shopify gives it the next order number (e.g. `#RS9992`), so numbers never clash.
   - It's tagged `WEBSITE` and `WEB-RS-123456`, which is the reference the customer sees.
3. The dashboard pulls new Shopify orders every 30 minutes, or right away when you click the green **Shopify live** button at the top of Orders.

To find a website order by the customer's reference, search `RS-123456` in Orders. The search covers tags.

---

## Step 1: Put the Shopify store in maintenance mode (5 min)
This stops people from ordering on the old Shopify store. Orders sent in by the website still go through, because they come in through the Shopify admin connection, not the store page.

1. Open the Shopify admin → **Online Store** → **Preferences**.
2. Under **Password protection**, tick **Restrict access to visitors with the password**.
3. Set a password (for staff only). In **Message for your visitors**, write something like:
   *"We've moved! Shop at regal.famcoventures.com."*
4. Press **Save**.

To turn it off later, untick it and press **Save**.

> While the store is locked, the website's review form can't look up which Shopify product a review is for. Reviews still get sent, but may not link to a product. Everything else on the website works.

## Step 2: Shopify keys (5 min, skip if you did the app setup already)
Use the same Dev Dashboard app as the standalone app guide (`projects/business-os-app/README.md`, step 3).
1. Make sure its access scopes include `write_orders`, `read_orders`, `read_products` and `write_customers`, then **Release** a new version.
2. In the app, open **API access → Protected customer data**. Turn it on for **name, email, phone and address**, so the app can save the customer's details on the order.
3. Copy the **Client ID** and **Client secret**.

## Step 3: Add the script to the website's Apps Script (10 min)
1. Open the Apps Script project behind the website: open the website's Google Sheet → **Extensions → Apps Script**, or go to **script.google.com** and open it there.
2. Click **+** next to Files → **Script** → name it `ShopifySync`. Paste in the full contents of `ShopifySync.gs` from this folder.
3. Click **Project Settings** (gear) → **Script properties** → **Add script property**. Add:

   | Property | Value |
   |---|---|
   | `SHOPIFY_SHOP` | `tjs1uz-4a.myshopify.com` |
   | `SHOPIFY_CLIENT_ID` | Client ID from step 2 |
   | `SHOPIFY_CLIENT_SECRET` | Client secret from step 2 |

   The keys stay inside Google and are never put on the website.
4. Find the part of your script that handles a new order. Search for `'order'` in `doPost`. Right after the order is saved, add this line:
   ```js
   try { pushOrderToShopify(order); } catch (e) { queueShopifyOrder_(order, e); }
   ```
   Use whatever name your script has for the order sent by the website. The website sends it as `order` (e.g. `data.order`).
5. At the top, pick **testShopifyConnection** → **Run**. Allow access when Google asks. The log should say *Connected to Regal Spritz…*
6. Pick **setupShopifyRetry** → **Run** once. Any order that fails to send (for example, Shopify is briefly down) is retried every 10 minutes, so none are lost.
7. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** The website keeps the same address.

## Step 4: Test it
1. Place a test order on regal.famcoventures.com.
2. In Shopify admin → **Orders**, it appears within a few seconds, tagged `WEBSITE`.
3. In the dashboard → **Orders** → click the **Shopify live** button at the top (or wait up to 30 minutes). The order shows up as **To ship / Unpaid**.
4. Cancel the test order in Shopify when you're done, or archive it in the dashboard.

## What gets sent
- **Items:** linked to the Shopify product when the website item's handle matches, with the website price.
- **Shipping:** J&T or Same-Day, with the fee.
- **Customer:** name, email, mobile and address.
- **Discounts:** any website discounts (points, promo codes, full-payment discount) as one "WEBSITE" discount, so the total matches.
- **Note:** payment method (Maya / BDO), amount due now, and any pre-order balance.
- **Payment status:** **Unpaid**. Mark it paid in the dashboard once the payment is confirmed.
- **Order confirmation email:** none from Shopify. The website already confirms the order.
