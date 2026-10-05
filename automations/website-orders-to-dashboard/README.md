# RS order numbers: one counter for every channel

RS OS is the single counter for RS order numbers (website, Messenger, IG, walk-in). Format: `RS` + number, no dash (e.g. `RS9996`).

## Website backend asks for a number

`POST https://regal-spritz-os.vercel.app/api/site`

Body (JSON):
```json
{ "action": "nextOrderNumber", "key": "<RS_BACKEND_KEY>", "source": "website" }
```

Answer: `{ "ok": true, "ref": "RS9996" }`. A wrong key gets `{ "ok": false, "error": "Not allowed." }` (HTTP 403).

- Call it from the server (Apps Script `UrlFetchApp`), never from the browser.
- Numbers are handed out atomically by a Postgres sequence (`rs_order_seq`), so two orders never share a number.
- Staff creating an order in RS OS take their number from the same counter.

## Keeping one count

- The counter never goes below the highest RS number in RS OS orders.
- Each time RS OS loads website orders (`opsOrders`), it raises the counter above the highest website `ref` too, so numbers the website made on its own are never reused.
- Website orders keep their `ref` as-is inside RS OS; nothing renumbers them.

## Database

`rs_counter.sql` creates the sequence and the `next_rs_number` / `rs_counter_floor` functions. The key is stored in `app_settings.site_key` (same value as `RS_BACKEND_KEY` in Vercel); the copy here has a placeholder. The old `site_order()` inbox was removed: website orders are read live and customer details stay on the website.

## Listings → website (`opsSetProducts`)

RS OS Listings → **Send to website** sends the whole live catalog to the website backend (the same list the old WebCake code had as `window.PRODUCTS`). The website replaces its product list with it.

Request (server to Apps Script, JSON as text/plain):
```json
{ "action": "opsSetProducts", "key": "<RS_BACKEND_KEY>", "by": "<staff name>", "products": [
  { "id": "mj-daisy-eau-so-fresh-pop", "kind": "onhand", "rank": 1, "brand": "Marc Jacobs", "name": "Daisy Eau So Fresh Pop",
    "size": "50ml", "cond": "Sealed", "cat": "women", "price": 3605, "was": null, "imgs": ["https://…"], "notes": {},
    "isNew": true, "badges": ["New arrival"], "eta": "", "vac": false, "created": "2026-10-01T00:00:00+00:00" } ] }
```
Answer: `{ "ok": true, "count": 526 }` (or `{ "ok": false, "error": "…" }`).

- `kind`: `onhand` or `preorder`. Sold-out on-hand items and inactive listings are left out of the list (hide anything missing).
- `id` stays the same for a listing over time; use it as the product key.

## Automatic sync (RS OS side)

- **Listings → website:** any listing edit (or a stock change) is sent to the website on its own about 45 seconds later. The **Send to website** button still works for an instant send.
- **Website orders → stock:** each website order takes its on-hand items off RS OS stock once; a cancelled order puts them back. Pre-orders don't touch stock. Only orders placed after the first run count (stored in `webmeta/_stock.from`). What was taken is saved per order in `webmeta` (`stock`, `stockMap`, `stockMiss`), product ids and quantities only. Items RS OS can't match to a listing are named in the order's history.
- Items are matched by `id`/`h`/`handle` on the website item (same `id` as in `opsSetProducts`), otherwise by title (`Brand Name` or `Name`) and size.
- **New orders:** RS OS checks the website every minute on Orders and Home (every 3 minutes elsewhere) and shows a "New website order" alert.
