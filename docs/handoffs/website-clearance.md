# Website: Clearance Sale section (for the website chat)

RS OS has a new listing badge **"Clearance sale"** (Listings → tick it on a listing, or select many → Add badge… → Clearance sale).
It already arrives in products.js / /api/products as `badges: [..., "Clearance sale"]`.

Please add:
1. A **Clearance Sale** section on the home page (below New Arrivals) showing on-hand items with that badge, hidden when there are none. Show the compare-at price struck through next to the price when there is one.
2. A **Clearance** link in the menu that opens the full list (`#/clearance`, same grid and filters as the shop page).
3. A red "Clearance" ribbon on product cards with the badge.
