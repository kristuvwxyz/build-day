# CLAUDE.md: How to work with me

This file is my profile. Read it at the start of every session and follow it.

## About me
- **Role:** Founder / builder. I do a bit of everything: product, code, writing, ops.
- **Coding level:** Beginner. When I need to run something, give me the exact command and say what it does in one line. Don't assume I know setup steps.
- **Timezone:** Asia/Manila (PHT, UTC+8). Use it for anything time-based: schedules, cron jobs, deadlines.
- **Main uses:** building apps and websites, writing and docs, automation and workflows.
- **No developer:** I build and edit my sites myself (the online shop in `projects/shop`, Webcake pages). Write guides for me, not for a developer: click-by-click, in order.
- **Store:** my Shopify plan is cancelled (Oct 2026), so the Shopify store is closed. Don't plan new work that depends on Shopify unless I reopen it.

## Communication
- Short and direct. Lead with the answer, and use bullets where they help.
- Leave out filler, long preambles and repeated context.
- Use plain language. Explain jargon briefly the first time it comes up.
- When I need to choose, always give me easy click-to-pick options (buttons), not "reply A or B".
- When I need to do something myself, give super easy numbered steps with a direct link to the exact page. Keep it to the fewest steps possible.
- Any step in WebCake starts with a direct link that opens WebCake (the site editor if known), never "go to WebCake".

## How to work
- **Just do it.** Make sensible decisions yourself and tell me what you did afterward.
- Ask me only when a choice is truly mine to make (money, accounts, a public post, or anything irreversible), and give me options to pick from.
- **Ship fast, MVP first.** Get a working version first and polish later. Don't over-engineer.
- **Pick the tech stack yourself.** Choose the simplest tool that fits, and say why in one line. For web apps, default to something easy to deploy and widely used.

## Dashboard (Regal Spritz OS) preferences
- Shared features (Orders, Listings) live once in the main Workspace menu, not repeated as department tabs.
- Listing edits go to regalspritz.com automatically a few seconds after saving (no Send to website button, no "To sync" banner, no WebCake paste). The site loads listings from the Apps Script backend (`?action=products.js`).
- New orders (pre-order or on-hand, any channel) start at Fulfillment status **To Confirm**.
- Access: Admin sees every department except CEO, Finance and Marketing.
- Forms and pop-up sheets: Save / Cancel buttons go at the top, under the title. On phones, don't auto-focus a box or zoom the page.
- J&T bookings: Parcel name is always COSMETICS and declared Value is always ₱500. Total parcels (Qty) = the order's item quantity (editable in the sheet).
- Attendance: K (owner) works flexible hours: no fixed schedule, never Late or Absent. Overtime isn't paid (no Overtime line on payslips); everyone's Home and attendance card says so.
- Create order: address uses J&T's Province → City → Barangay list. No platform fee box. Discount by changing the item price or the ₱/% Discount box. A first-time buyer is saved to Customers; if the email or phone already exists, staff are asked whether to merge.
- Listings search has a 📷 Scan button: scanning a barcode searches for it and opens the matching listing. The Listings table has a Barcode column with a 📷 button per row to scan and save that item's barcode (duplicates are blocked).
- Listing barcodes were copied once from Shopify variant barcodes (bulk export matched by website handle; only blank barcodes filled; source webmeta/_bcsrc, flag webmeta/_bcimp, runs on the owner's device).
- Listing Cost was copied once from Shopify "Cost per item" (matched by handle; only blank costs filled; flag webmeta/_costimp).
- Listings: drag the small square on a cell's corner to copy its value to other rows (like Excel).
- Website order statuses: a shipped order shows as **Completed** to buyers (site add-on `completed-status.html` relabels Shipped / Delivered; the backend still stores Shipped). RS OS no longer offers Delivered.
- Tasks: Department "All (everyone)" makes a task show on every person's and department's Tasks list and calendar (and in everyone's badge). An All task has no Assigned to; it shows "Created by" (whoever made it) instead.
- Tasks: each person sees a badge on Tasks with their own due-today + overdue count (red if any overdue, amber if only due today).
- Refresh button (RS App) = hard refresh: clears saved app files and loads the newest version, same page and scroll. Never tell K to press Cmd/Ctrl+Shift+R; say "tap Refresh".
- Home shows "Live on website" (people on regalspritz.com now): site add-on live-visitors.html pings /api/live every 30s with a random tab id (no personal data); Supabase table live_visits, functions live_ping / live_count.
- Break alarm: Attendance settings "Break starts at" (default 12:00). Everyone timed in (not K) gets an alarm sound + pop-up 10 min before, and a chime at break time. Only while RS OS is open.
- Add to Home Screen: Home banner + My Account → Preferences open steps for the phone; staff link https://regal-spritz-os.vercel.app/?install=1 opens the steps.
- Name the page "My Account" (capital A).
- My Account: tap the photo to change it, tap the perfume bottle for the signature scent (no separate Change photo chip).
- Home: one "Orders to ship" tile = To ship orders only (RS OS + website). No Unpaid website / Website to ship tiles.
- Orders table: compact rows. "Mode of payment" column: website orders show the buyer's pick; RS OS orders have a dropdown (Maya, BDO, GCash, Bank transfer, Cash, COD, Card, Other), guessed from the pay link until set. Colors: Maya green, BDO blue, GCash teal, Bank transfer violet, Cash amber, COD orange, Card pink; Courier J&T red, SDD violet. Source column uses small same-size pills.
- Top bar shows the live date and time (Manila), every page; phones show the time only.
- All dashboard dates and times are Manila time (GMT+8) on every device. Website orders use the real order creation time: a time-zoned date (Z / +08:00) or exact-time field (createdAtMs, createdAt ISO…) is used as is; a date without a zone is converted using the gap RS OS learns from the "stock taken off" log of the 7 nearest orders it saw arrive (so it follows the website when its clock changes), else read as UK time.
- Assigned to dropdown: each person has their own color (Unassigned grey).
- Speed / live sync (RS App): data is kept on the device (IndexedDB, cleared on sign out) and only changes are downloaded. Live channel + an 8s "anything changed?" check; screen updates are batched. Changing a website order makes other devices reload website orders at once (webmeta siteAt). Server-side change times + delete list: supabase/fast-sync.sql.
- Admin → Logins: A–Z by Account (ignores quotes/symbols), always split into Active accounts then Inactive accounts; clicking a column header sorts inside each group. Any table with group rows sorts the same way.
- Expenses: Admin has an Expenses tab (same list as Finance): Paid with, OR/receipt photo, By, plus Cash on hand (Cash in entries minus expenses paid with Cash on hand, from Oct 8, 2026). Cash in rows don't count as expenses.
- Orders: "Item type" column (e.g. 1 × On hand, 2 × Pre-order; hovering a chip lists those items) from the listing's kind, item name ((PREORDER), IN TRANSIT, 50% DP) or PO/OH tag. Website buyers' shipping choice (shipPref ahead/together) shows there.
- Payment: "Partially paid" (no "DP+SF"). A pre-order paid only 50% DP is Partially paid, never Fully paid: website orders with paid + due < total; new RS OS pre-order orders saved as Fully paid become Partially paid; open ones were fixed once (webmeta/_dpfix). Staff pick Fully paid when the balance is paid.
- Customer update emails (RS OS, via opsEmail, once per step): payment link ready (BDO link pasted), confirmed, pre-order arrived, packing, shipped, cancelled. Pauses for the day when Gmail's quota is nearly used.
- Unpaid Maya Checkout website orders (placed from Oct 8, 2026) are auto-cancelled after 24 hours by RS OS (any open team device) with a cancellation email. Pay-now link in Order History, Maya link email and the checkout shipping choice are in docs/handoffs/website-pay-again-and-ship-choice.md (website chat).
- "Archived orders" are called **Cancelled orders** everywhere (tab "Cancelled", Restore instead of Unarchive). Orders bulk bar has a red **✕ Cancel order** button (tap twice; no Archive button); the order sheet has the same. Cancelling sets Fulfillment Cancelled → the order moves to Cancelled orders and the buyer gets the cancellation email. Setting Fulfillment to Cancelled any other way does the same (owner devices also move any old Cancelled ones); cancelled website orders show read-only there. Restore brings an order back (a cancelled one as To Confirm).
- Undo: Ctrl/Cmd+Z undoes the last change in RS OS (one click or save = one step), Ctrl/Cmd+Shift+Z redoes.
- When a fix can be done from the RS App (e.g. a site add-on), do it instead of asking K to paste into another chat.
- Royal Receipt shows the Shipping fee (buyer pays; Create order and Edit items have a Shipping fee box, separate from "Shipping you paid"). "How will the buyer pay?" (Create order + Royal Receipt): **BDO BNPL** (copy the fields, make the BDO link, paste it → receipt emailed with Pay with BDO), **Card · Maya Checkout** (RS OS makes the Maya link via /api/site maya: MAYA_PUBLIC_KEY in Vercel or backend opsMayaCheckout, see docs/handoffs/rs-os-maya-link.md → receipt emailed with Pay now), **E-wallet / Bank transfer** (receipt shows our themed QR cards + accounts, buyer replies with a screenshot, staff mark Fully paid). Our receiving accounts + QR cards live only in the database (webmeta/_paymethods), never in the repo; an owner device copies the cards to photo storage for emails. Order details show 💳 Pay link / Copy pay link.
- Royal Receipt: every RS OS order with an email gets the Royal Receipt emailed automatically (store Gmail via the website backend `opsEmail`), and again when a pay link is added. The only payment button is the order's own pay link (Maya/BDO). Staff can copy it as text for chat when there's no email.
- Don't add buttons or screens for one-off cleanups (like re-sorting categories or fixing photos). Just do the fix when I ask.
- Website orders (regalspritz.com) are read live from the website's Apps Script backend through the RS App's `/api/site` route (key `RS_BACKEND_KEY` in Vercel only). Don't copy customer details into the dashboard database; only team fields (assignee, courier, tags, team note) are saved per order number in `webmeta`. RS OS is the single RS number counter (`/api/site` nextOrderNumber).
- Shopify is one-way: new orders and Shopify-side changes (status, tags, notes) come into the dashboard. Never send dashboard edits back to Shopify. (On hold: the Shopify plan is cancelled.)

## Writing for me (emails, docs, content)
- Match the voice to the context and audience: casual for social posts, professional and warm for clients, crisp for internal notes.
- If the audience isn't clear, assume professional but warm.

## Git
- When code work is done, commit with a clear message and push to the current branch.
- Don't open pull requests unless I ask.

## End of every task
Finish with:
1. **Done:** what you did (short)
2. **Left:** anything unfinished or blocked
3. **Next:** what I should do next, if anything

## Repo layout (home base)
- `projects/`: one folder per app or website
- `automations/`: scripts, scheduled tasks, workflows
- `docs/`: writing, notes, templates
- Keep this file updated as my preferences change. If I correct you, add the rule here.
