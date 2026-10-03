# Regal Spritz Business OS

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

## Look and feel
- Each department has its own colour, used in the menu, page title, tabs, cards and task rows.
- The Home banner is smaller.
- Home has an Orders panel with big To pack, On hold, Unpaid and New today tiles, plus the oldest open orders, each clickable.
