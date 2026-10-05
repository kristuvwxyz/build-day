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
