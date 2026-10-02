# Regal Spritz Business OS

Live app: https://claude.ai/artifact/RbUQpD5J8M2dKELDEEKoyp (private to you until shared)

One place to run the business across Shopee, TikTok Shop, Website and FB/IG.

- **Dashboard:** sales, net profit, average order, orders to ship, sales by platform, low-stock and expiring items
- **Orders:** Shopify-style table (Order, Date, Items, Customer, Channel, Total, Payment status, Fulfillment status, Tags) with stats strip, views, search, bulk actions and 50-per-page paging. Manual orders deduct stock; refunded/voided orders put it back.
- **Import from Shopify:** upload the Orders or Customers CSV export. Order IDs are kept (#RS9978 stays #RS9978). Re-importing a newer export updates payment, fulfillment, tags and notes. Imported orders don't change inventory.
- **Inventory:** price, cost, margin, stock, reorder level, batch and best-before date, plus quick restock
- **Customers:** imported from Shopify plus anyone who orders on other channels; contact, address, tags, notes, order history
- **Expenses:** costs by category, which feed into net profit
- **Export CSV:** on every page, for your accountant or spreadsheets

Data is stored in the app's cloud database and syncs live across devices.

## Branding
The brand colors and fonts are at the top of `index.html` under `BRAND TOKENS`. They're placeholders until we can read regalspritz.com.
