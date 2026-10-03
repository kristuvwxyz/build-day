# Regal Spritz PH Business OS

Live app: https://claude.ai/artifact/RbUQpD5J8M2dKELDEEKoyp (private to you until shared)

Back office for the whole team, plus orders and stock across Shopify, Shopee, TikTok Shop and FB/IG.

## Open to everyone
- **Home:** rotating carousel with a greeting (Manila time), RS Mission, Vision and Goals, plus my tasks, team task summary and department shortcuts
- **Tasks:** calendar (month) and list views; status (To do / In progress / Done / Cancelled), progress %, priority, start and due dates, assigned person and department. Views: whole team, per person, per department. Summary at the top, e.g. `4/10 In progress | 5/10 Done | 1/10 Cancelled`
- **Attendance:** time in / time out (Manila time), automatic Late after the shift start + grace period, leave / sick / day off / holiday, auto Absent for missed work days. Daily board with summary (e.g. `7/10 Present | 2/10 Late | 1/10 On leave`), monthly sheet per person with totals and hours, CSV export for payroll. Admin sets shift times, grace and work days.
- **My account:** link your login to your team-member name, see your tasks, time in/out, choose Light / Dark / System appearance, lock departments

## Departments (each has its own password; the owner gets in without one)
| Department | Pages |
|---|---|
| CEO | Overview (sales, profit, to fulfill) + tasks by department |
| Admin | Directory (ID, nickname, full name, phone, email, address, department, date started, Active/Inactive), department passwords, Home page content |
| Finance | Profit dashboard, **Payroll** (semi-monthly or monthly; days worked, lates and leave pulled from Attendance; daily rates by position; additions/deductions; payslip copy or download), **Investors** (ongoing with payout schedule and mark-paid, finished by year, loans), expenses |
| Sales | Orders (Shopify-style table, import from Shopify), customers |
| Marketing | Sales by channel, top customers, repeat rate, customers |
| Packing | Packing queue (mark fulfilled / on hold), inventory |

Every department also has a **Tasks** tab filtered to that department.

## Security note
Department passwords hide pages from staff who don't need them. They are not strong security: anyone the app is shared with can technically reach its data. Only the owner and Editors can change the team, the passwords or the Home page (enforced by the database rules).

## Branding
The brand colors and fonts are at the top of `index.html` under `BRAND TOKENS`.

## Department access
- **Who sees what:**
  - CEO staff see every department.
  - Admin staff see everything except Finance.
  - Everyone else sees only their own department.
  - The department comes from the person's Directory entry, linked in My account.
- **Passwords:** the CEO password unlocks every department, and the Admin password unlocks everything except Finance.

## Photos and favorite scents
- Admin can upload a photo in the Directory, and each person can upload their own in My account. Photos are cropped to a square and shrunk before saving.
- The scent picker searches every perfume that appears in your BIR sales records and orders.
- "Find picture online" opens an image search in a new tab. Upload the bottle picture or paste it with Ctrl+V. If someone already has a picture for the same scent, it's reused.

## Finance
- **Fixed expenses:** the monthly fixed costs list, editable, with a total, a per-day figure and the sales needed per day.
- **Due dates:**
  - Monthly investor payouts and credit card payments, each with a Mark paid button per month.
  - Due dates also appear on the Tasks calendar, but only for people with Finance unlocked.
  - Only the last 4 digits of account and card numbers are stored.
- **Checks:** check number, date, payee, amount, bank and status (pending, cleared, bounced or cancelled). Pending checks show on the calendar.
- **Payroll records:** past payroll from the PAYROLL 2026 sheet, plus every payslip marked Paid in Payroll.
- **BIR records:**
  - Daily sales per month, with totals by payment method and by quarter, and BIR tax payments.
  - "Add this month's paid orders from Sales" copies orders from the Sales tab into the month.

## Listings (Sales, Admin, Marketing)
- One shared product list, edited from the Listings tab in Sales, Admin or Marketing.
- **Fields:** photo, brand, size, type (sealed, tester, partial and so on), price, compare-at price, cost, stock, SKU, barcode, category, description and website link.
- **Website (regal.famcoventures.com, built on WebCake):** the site reads its products from a `window.PRODUCTS` code block in WebCake's custom HTML.
  - All 666 live products (155 on hand, 511 pre-order) were imported from that block on 2026-10-03.
  - Every add or edit is marked "To sync".
  - **Website code** rebuilds the exact block (unchanged listings come out byte-for-byte identical) to paste in WebCake: Edit → General → </> HTML/Javascript → replace the `window.PRODUCTS` block → Save → Publish. Then mark the changes as on the website.
- **Import CSV:** columns are matched by name, and a matching SKU or barcode updates the existing listing.

## Packing: barcode scan
- **Inventory → Scan barcode** works with a USB or Bluetooth scanner (it types the code and presses Enter) or with the phone camera.
- **Modes:** Receive +1, Remove −1 and Look up. Undo reverses the last scan.
- An unknown code opens "Add listing" with the barcode filled in.
- **To pack:** scanning or typing an order number opens that order.

## Shopify live sync
- While the app is open in claude.ai, it pulls every **unfulfilled / on-hold** Shopify order through your Shopify connector, then again every minute. It adds new orders and updates payment, fulfillment, tags and notes.
- An order that's fulfilled or cancelled in Shopify gets updated in the app on the next sync.
- The chip on Home → Orders and Sales → Orders shows the status. Click it to sync now.
- It needs the Shopify connector signed in (claude.ai → Settings → Connectors). The first sync asks you to allow Shopify for the page.

## Order statuses
- **Payment:** Unpaid, Partially paid (DP+SF), Fully paid, To refund, Refunded, Voided.
- **Fulfillment:** FWD (8.FWD), To confirm (7.CONF), Billed (6.BILLED), Partially paid (DP) (5.DP), Arrived (4.ARRIVED), Sorted (3.SORTED), Arrived-Hold (2.AB), To ship, On hold, Shipped, Delivered, Cancelled.
- Stage statuses follow the order's tags. When an order has several stage tags, the lowest number wins. Picking a stage in the app swaps the tag to match.
- Shopify sync merges: a status, tag or note changed in the app stays unless it changes in Shopify too.
- **Sorting:** click any column header to sort it. Orders sort across all pages; other tables sort what's on screen.
- **Internal edit:** Order → **Edit items, prices & discount** (₱ or %). This changes the app only, not Shopify.

## Waybills (Packing)
- Scan the waybill barcode (USB scanner, or 📷) into the order's card, or type the tracking # and press Enter.
- By default this saves the tracking #, marks the order **Shipped** and creates the fulfillment in Shopify with tracking. Shopify releases the hold first if needed, and the buyer is notified. The buyer sees the tracking in their Shopify Order History.
- The courier is picked once at the top. You can turn off the auto-ship tick box.

## Orders (all departments)
- Every department has an **Orders** tab. CEO, Sales and Admin can change everything. Finance can change payment and fulfillment status only. Packing can change fulfillment, courier and tracking. Everyone else can view.
- Payment status, fulfillment status, courier and **Assigned to** (Sales team members) change right in the table.
- **Items ▾** opens a quick preview of an order's items.
- **⚙︎ Columns:** show, hide and reorder columns. This is saved per department for everyone in that department and shows who arranged it last.
- **Supplier bar:** S-JEFF, S-GAL and so on, taken from tags. Click one to filter, then **📋 Order list** gives a combined quantity per item to send the supplier (copy or CSV).
- **Merge into 1 shipment:** select 2 or more orders → Merge. Items keep the order # they came from (`from #RS…`), and the other orders go to Archived orders. **Unmerge** undoes it.
- **Delete** moves an order to **Sales → Archived orders**, which clears its statuses. **Make active again** restores them.
- **Team activity:** each order lists who changed what, e.g. "K, the CEO changed Payment Status → Unpaid".
- **Courier:** J&T or SDD. Shopify pickup orders (e.g. "MANDALUYONG BRANCH", or no address) default to SDD; everything else defaults to J&T.

## Packing list + J&T VIP booking
- To pack is now a table like Orders, with a waybill scan box on each row.
- **Copy for J&T** copies the selected orders (or all J&T orders in the list) to paste into the J&T VIP Excel template. **J&T VIP booking file** downloads a CSV. Columns: receiver, phone, province, city, barangay, street, zip, items, qty, COD, declared value.

## J&T VIP booking file (Packing)
- Packing → Orders → **J&T VIP booking file**. It uses the selected orders, or every J&T order that's To ship in the current filter.
- The file is built on J&T's template (ORDER LIST V20200721, sheet "List", 13 columns). Province, city and barangay are auto-matched to J&T's address list (`jnt-address.json`, taken from the template's "Addressing guide" tab). Anything unmatched is highlighted in red so you can pick it from dropdowns.
- COD is 0 for Fully paid and the total for Unpaid; type the balance for Partially paid. Express type, parcel name and default weight are remembered.
- Downloads as `.xls`; upload it in J&T VIP → Batch order.

## Navigation
- **Orders** is in the main menu. **Search orders…** in the menu finds any order by #, name, phone or tracking.
- **Sales → Suppliers** (CEO and Eve only): supplier chips, filters, Clear filters, a combined order list, and the matching orders.
- **Archived orders** is under Sales and Admin.
- Packing's "To pack" tab is gone; Packing → Orders has the scan bar, waybill column and J&T file.
- **My account → Log out** locks all departments on the device. **Sign out of Claude** switches accounts.
- Shopify order notes and timeline comments show as icons in the Orders list (hover or click to read) and in the order.

## Look and feel
- Each department has its own colour, used in the menu, page title, tabs, cards and task rows.
- The Home banner is smaller.
- Home has an Orders panel with big To pack, On hold, Unpaid and New today tiles, plus the oldest open orders, each clickable.

## Home, awards, reviews (Oct 2026)
- **Home:** greeting, a daily perfume quote (classics plus your own from Admin → Home page), a 4-number "Today" strip with Time in / Break, the Employee of the Month card, and My tasks. Mission/Vision are no longer shown.
- **Awards (Employee of the Month):** score out of 100 = Attendance & punctuality 30 + Tasks on time 25 + CEO rating 25 + Team votes 20. Not eligible: more than 2 absences, or won last month. Founders don't compete. CEO rates, announces, and can add the cash bonus to the current payslip. Criteria points and rewards are editable by the CEO.
- **Reviews (Admin, Marketing):** add, import from a pasted spreadsheet, edit, hide/show, delete; filter by stars, status, source; sort by rating or date.
- **My account:** My salary (rate, current period estimate, pay history, payslip download; amounts blurred until "Show amounts") and Work style (Standard / Pomodoro timer).
- **Attendance:** ☕ Break / End break. Break time is not counted in hours; the allowed break per day is set in Attendance settings (default 60 min).
- **Logins:** "Import from spreadsheet" pastes a logins table; passwords are encrypted in the browser with the vault passphrase.

## Reviews live on the website, task access, awards budget (Oct 2026)
- **Website reviews:** the 479 Judge.me reviews from the website are imported into Reviews automatically (from `website-reviews.json`). Every add, edit, hide or delete is pushed to Shopify metaobjects (type `rs_review_chunk`, 50 reviews per entry). The website reads them live through the Shopify Storefront API, using a public token from the Headless channel. One-time setup is in Reviews → Website setup.
- **Tasks:** new tasks default to you and your department. There is no start date, only a due date. CEO sees every task, Admin sees all except CEO's, and every other department sees only its own (plus tasks assigned to them).
- **Department access:** CEO sees all, Admin sees all except CEO, and everyone else sees only their own.
- **Awards:** ₱1,000 a month in total: ₱700 for the Employee of the Month, plus a ₱300 perfect attendance draw. If no one qualifies for the draw, the ₱300 goes to a year-end pot. There is no runner-up.

## Batch 4: sign-in binding
- Owner account is always linked to Kristin H Sumiran (no picker).
- Staff are linked automatically by matching their claude.ai sign-in email to the email in Admin → Team (several emails allowed, comma-separated).
- Anyone not in the directory sees a locked screen and can send an access request; the owner links them in Admin → Team → Access requests.
- Orders tab, Orders menu item and order search are hidden from Marketing.
- Task views follow department access (CEO all, Admin all but CEO, others own department).

## Batch 5: orders, disputes, speed
- DISPUTE tag: always suggested; ⚠️ Dispute badge on order rows; order sheet warns and asks for a second Save before To ship / Shipped; bulk To ship / Shipped skips disputed orders.
- Admin → Disputes tab: every DISPUTE order, with a Resolved button that removes the tag.
- Order sheet: action bar at the top (Edit items, Merge, Unmerge, Delete); Merge picks other open orders, same customer first.
- Back button when moving between sheets (order → customer → order).
- Archived orders: "Unarchive" (restores the last payment and fulfillment status), select one or all, bulk Unarchive / Delete forever.
- Dropdowns no longer snap shut: background updates wait while a dropdown is open and are batched.
- Faster on low-end devices: cached number/date formatters, memoized customer list and order stats.

## Batch 6
- Directory: Company IDs (TIN, SSS, PhilHealth, Pag-IBIG) stored encrypted with the logins vault passphrase; emergency contact (name, relationship, phone).
- Finance dues and checks show on Gigi's and Yany's calendars (editable per due: "Shows on the calendar of").
- Sideways scrolling keeps its place when the screen refreshes (tables, tabs, filter bars).
- Sales stats strip only on CEO → Orders.
- Stage tags (8.FWD, 7.CONF, 6.BILLED, 5.DP, 4.ARRIVED, 3.SORTED, 2.AB) become the Fulfillment Status and are removed from Tags (existing orders cleaned up once; Shopify imports too).
- Shopify syncs every 30 minutes, or with Sync now.
- Orders: "All months" filter (SEPT 2026 · n orders · n still open).
- Order screen: Assigned to beside Merge, tracking at the bottom, items open their inventory listing.
- Awards visible to the CEO only.
- My account → Developer options → View as (owner only; preview, nothing saves).
- Customer names open their order history (orders, archived, disputes, popups).
- Suppliers: no payment filter, status chips like the supplier bar, search on top.

## Batch 7: orders on the calendar
- Add task: optional Linked order (type # or customer) and Linked item (from inventory), with Open links.
- Order screen: "Add to calendar" after Merge creates a follow-up task linked to the order; the order lists its calendar entries.
- Calendar entries for linked orders show 📦 #order and open the order.
