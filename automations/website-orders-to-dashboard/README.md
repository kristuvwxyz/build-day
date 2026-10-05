# Website orders → RS Dashboard

regalspritz.com sends every new order to the RS App (dashboard) database. The dashboard gives back the order's **RS number** (continuing the old Shopify numbering: RS9995, RS9996…). The website shows that number to the customer.

## The call

`POST https://juxtihdvwlyqusdtdokq.supabase.co/rest/v1/rpc/site_order`

Headers:
- `apikey: <SUPABASE_ANON_KEY>` (public key, same one the RS App uses)
- `Authorization: Bearer <SUPABASE_ANON_KEY>`
- `Content-Type: application/json`

Body:
```json
{
  "p_key": "<RS_SITE_KEY (secret)>",
  "p_order": {
    "siteRef": "RS-638480",
    "customer": "Juan Dela Cruz",
    "email": "juan@example.com",
    "phone": "09171234567",
    "address": "123 Street, Barangay, City, Province, 1234",
    "ship": { "address1": "123 Street", "address2": "Barangay", "city": "City", "province": "Province", "zip": "1234" },
    "courier": "J&T",
    "pickup": false,
    "items": [{ "name": "YSL MYSLF EDP | 3ML - MINI", "qty": 1, "price": 390, "sku": "" }],
    "shipping": 0,
    "discount": 0,
    "payMethod": "Maya",
    "payment": "pending",
    "fulfillment": "unfulfilled",
    "note": "",
    "createdAt": 1791190000000
  }
}
```

Answer: `{ "ok": true, "orderNumber": "RS9995", "new": true }`

- `siteRef` = the website's own order ID. Sending the same `siteRef` again never makes a duplicate: it returns the same RS number.
- To update an order later (Maya payment confirmed, customer cancelled), send the same `siteRef` with only `payment` and/or `fulfillment`:
  - `payment`: `pending`, `paid`, `partially_paid`, `refunded`, `voided` (voided = cancelled)
  - `fulfillment`: `unfulfilled`, `on_hold`, `fulfilled`, `delivered`, `cancelled`
- A wrong `p_key` is refused. The website key can't read anything from the dashboard.
- Keep `RS_SITE_KEY` secret: only call this from server code (an API route or server function), never from browser JavaScript.

## Setup

`site_order.sql` is the database function (already installed). The real key is stored in `app_settings.site_key`; the copy here has a placeholder.
