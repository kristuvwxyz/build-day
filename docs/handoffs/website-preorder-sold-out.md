# Website: sold-out pre-orders

Paste the part below the line into the website (Apps Script backend) chat.

---

RS OS can now mark a pre-order listing **Sold out**. It stays in the product list (`?action=products.js` / `window.RS_PRODUCTS`) with its ETA, and carries one new field:

```
{ id, kind: "preorder", eta: "November", soldOut: true, ... }
```

(`soldOut` is left out when the item can be ordered. On-hand items at 0 stock are still left out of the list, as before.)

Please build it in:
1. **Cards and product page** (`#/p/<id>`): show a "Sold out" tag (same style as the other badges) and keep the ETA line ("ETA: November"). The Add to cart / Pre-order button becomes a disabled "Sold out" button.
2. **Cart and checkout**: if a cart already holds a `soldOut` item, show it as "Sold out, remove to continue" and don't let checkout go through. The backend should refuse an order with a `soldOut` item too (`{ ok:false, error:"sold out" }`), so an old open tab can't order it.
3. Sold-out items go after the orderable pre-orders in "Pre-order" lists (RS OS already sends them in that order).
4. Cart reminder emails: skip sold-out items (already the rule for sold-out items).

Until then, a small RS App add-on (`site-addons/preorder-sold-out.html`) shows the tag and disables the buttons. Tell me when yours is live and I'll remove it.

On Oct 9, 2026 all active pre-orders except the brand **To Summer** were set to Sold out with ETA November (340 listings). The 31 To Summer pre-orders stay orderable; their ETA is November too.
