# Website: load faster

Paste everything below the line into the website (Apps Script backend + WebCake site) chat.

---

Please make regalspritz.com load faster:

1. **Product list from the fast copy.** Load the listings from `https://regal-spritz-os.vercel.app/api/products` instead of the Apps Script URL `…/exec?action=products.js`. It is the exact same file, served from Vercel's CDN (answers at once; refreshes in the background, so listing edits show within about 15 seconds). Keep the Apps Script URL as a fallback only if the fast copy fails to load (`onerror` → load the old URL).
2. **Load it early and without blocking:** add `<link rel="preconnect" href="https://regal-spritz-os.vercel.app">` in the head, load the product list with `defer` (or `async` + render when ready) and show the page shell / skeleton cards while it loads.
3. **Images:** add `loading="lazy"` and `decoding="async"` to every product image below the first screen, and `width`/`height` (or `aspect-ratio`) so the page doesn't jump. Use the smallest image size that fits each card.
4. **Other backend calls (account, orders, points):** only call them on the pages that need them (My Account / checkout), not on every page.

Then tell me the before/after load time (e.g. from https://pagespeed.web.dev/ on the home page) and what changed.
