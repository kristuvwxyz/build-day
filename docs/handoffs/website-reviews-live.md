# Website: reviews live from RS OS (for the website chat)

RS OS now runs reviews end to end. The website now does this itself (done Oct 8, 2026; the old reviews-live add-on was removed). For reference:

1. **Load reviews from** `https://regal-spritz-os.vercel.app/api/reviews` (JSON, CDN-cached ~10 s) instead of the embedded `window.RS_REVIEWS`.
   Same shape: `{ total, avg, list, by }`. List item: `[id, handle, product, rating, date, author, title, body, pics, reply]`. `by` maps product id → list indexes.
   (`?js=1` returns `window.RS_REVIEWS = {...};` if a script tag is easier.)
2. **Send new reviews** with `POST https://regal-spritz-os.vercel.app/api/reviews`, `Content-Type: text/plain`, body JSON:
   `{ handle: <product id>, product: <product name>, customer, rating (1–5), title, text, anon (true/false) }` → `{ ok: true }`.
   They arrive in RS OS → Reviews as **To approve**; after approval they show within seconds. Don't send the email.
3. Remove the Judge.me calls (`api.judge.me`, `judge.me/reviews/reviews_for_widget`): Judge.me closed with Shopify.
