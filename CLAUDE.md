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
- **Always** end with click-to-pick options (buttons) for the next steps, so I can tap what to do next instead of typing.
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
- Shipping fee (buyer pays) fills in from the province with the J&T rate: Luzon / Metro Manila ₱130, Visayas ₱160, Mindanao ₱170 (SF_RATE in RS OS). Create order fills it when the province is picked (staff can type over it); the Royal Receipt fills an empty fee once (log line), unless Free shipping / pickup / paid.
- J&T waybill upload (Orders + Packing toolbar, 📄 Upload J&T waybills, Excel / CSV / PDF from J&T; the J&T VIP waybill PDF has one waybill per page with #RS… under Remarks, tested on OCT09.pdf): each waybill is matched to an order by the order number in the row (our booking file puts #RS… in Remarks), else by the receiver's phone (one open order without tracking). Preview with ticks → Save: tracking saved (website orders via /api/site), optionally marked shipped, and the buyer gets a "Track your order" email (tracking number in a copy box + Track on J&T button to https://www.jtexpress.ph/). Scanning a waybill on one order sends the same email. The shipped email includes the tracking box when the number is known (mailed.tracking stops a second one).
- Website "Track my order" under To Receive: handoff docs/handoffs/website-track-order.md.
- J&T bookings: Parcel name is always COSMETICS and declared Value is always ₱500. Total parcels (Qty) = the order's item quantity (editable in the sheet).
- Attendance: K (owner) works flexible hours: no fixed schedule, never Late or Absent. Overtime isn't paid (no Overtime line on payslips); everyone's Home and attendance card says so.
- Create order: address uses J&T's Province → City → Barangay list. No platform fee box. Discount by changing the item price or the ₱/% Discount box. A first-time buyer is saved to Customers; if the email or phone already exists, staff are asked whether to merge.
- Listings search has a 📷 Scan button: scanning a barcode searches for it and opens the matching listing. The Listings table has a Barcode column with a 📷 button per row to scan and save that item's barcode (duplicates are blocked).
- Listing barcodes were copied once from Shopify variant barcodes (bulk export matched by website handle; only blank barcodes filled; source webmeta/_bcsrc, flag webmeta/_bcimp, runs on the owner's device).
- Listing Cost is copied once from Shopify "Cost per item" (exact website handle match, 654 listings; only blank costs filled; source webmeta/_costsrc, flag webmeta/_costimp, runs on the owner's device).
- New-website email: K wants to approve the preview first; ask K again before sending (and only after NEWHOME100 works on the website).
- Listings: the column titles stay frozen at the top while scrolling the table. Badge filter (All badges / Any / each badge / No badge) next to collections; bulk bar has Add badge… / Remove badge…. Badge "Clearance sale" feeds the website's Clearance Sale section (docs/handoffs/website-clearance.md).
- Tasks calendar: "+N more" / "+N payments" expands that day to show everything (Show less folds it).
- Listings: ⧉ Duplicate (bulk bar for selected rows, and "Duplicate listing" in the listing form) copies details + photos, adds " (COPY)" to the name, saves as Draft with stock 0 and no barcode / website link (not on the website until set Active), then opens the copy to edit.
- Listings: drag the small square on a cell's corner to copy its value to other rows (like Excel).
- Website order statuses (backend v31): My Account tabs To Pay / To Ship / To Receive / Completed / Cancelled. Shipped orders sit in To Receive until the buyer taps Order received or 3 / 5 / 7 days pass (opsOrders stage / completeBy); RS OS shows "Shipped · to receive" / "Completed". RS OS no longer offers Delivered. (The old completed-status add-on was removed.)
- Returns: buyers request a return / refund on the website (opsOrders returnRequest). Orders → **Returns** tab (red count on Orders + Home card for Payment / Fulfillment staff): Pending → Approve return / Decline (asks why) via /api/site returnSet (backend opsReturnSet); Approved · to refund → do the return / refund, then **Mark refunded** (website status Refunded → buyer sees it under Cancelled).
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
- Orders: "Item type" column (e.g. 1 × On hand, 2 × Pre-order; hovering a chip lists those items) from the listing's kind, item name ((PREORDER), IN TRANSIT, 50% DP) or PO/OH tag. Website buyers' shipping choice (opsOrders shipPref, backend v28) shows there as a gold chip after the kind chips (🚚 Ship on-hand ahead / 📦 Ship all together) and on the website order sheet. BDO link panel has only "Create a payment link" (no email-bill button).
- Payment: "Partially paid" (no "DP+SF"). A pre-order paid only 50% DP is Partially paid, never Fully paid: website orders with paid + due < total; new RS OS pre-order orders saved as Fully paid become Partially paid; open ones were fixed once (webmeta/_dpfix). Staff pick Fully paid when the balance is paid.
- Customer update emails (RS OS, via opsEmail, once per step): payment link ready (BDO link pasted), confirmed, pre-order arrived, packing, shipped, cancelled. Pauses for the day when Gmail's quota is nearly used.
- Unpaid Maya Checkout website orders (placed from Oct 8, 2026) are auto-cancelled after 24 hours by RS OS (any open team device) with a cancellation email. Pay-now link in Order History, Maya link email and the checkout shipping choice are in docs/handoffs/website-pay-again-and-ship-choice.md (website chat).
- Orders tabs: Orders · Cancellation requests · **BDO link requests** (count badge; website BDO orders with no link + RS OS orders set to BDO BNPL with no link, oldest first, each with the copy fields + paste box; no banner on the Orders list) · Cancelled.
- "Archived orders" are called **Cancelled orders** everywhere (tab "Cancelled", Restore instead of Unarchive). Orders bulk bar has a red **✕ Cancel order** button (tap twice; no Archive button); the order sheet has the same. Cancelling sets Fulfillment Cancelled → the order moves to Cancelled orders and the buyer gets the cancellation email. Setting Fulfillment to Cancelled any other way does the same (owner devices also move any old Cancelled ones); cancelled website orders show read-only there. Restore brings an order back (a cancelled one as To Confirm).
- Review invitation emails (RS OS, once per order, any open team device): after an order ships (from Oct 8, 2026), NCR / Luzon after 3 days, Visayas after 5, Mindanao after 7 (no province: 7), or right away when the buyer taps "Order received" on the website (opsOrders receivedAt). Each ordered item has a ★ Review button to its own product page (#/p/<id>); free items left out.
- "New website" email: K approved the test email on Oct 9, 2026; the full send was scheduled by K in Brevo on Oct 9, 2026 (sender regalspritz2024@gmail.com, list "Past buyers", 300 a day ≈ 11 days). In RS OS it stays PAUSED: never send it from RS OS too (buyers would get it twice). Never set it back to sending yourself. Store Gmail can't do 3,345 (≈60 a day = 2 months): K picked **Brevo free** (300 a day): the Home card has ⬇ Buyer list (CSV: EMAIL, FIRSTNAME, made in the owner's browser, not stored) and ⬇ Email (HTML, with {{ contact.FIRSTNAME }} and Brevo's {{ unsubscribe }} link). The Gmail Start sending button is gone.
- "New website" email to all past buyers: owner's Home card (Preview, Send a test to me, Start sending, Pause). Sends in batches while the owner's RS App is open, keeping 30 of Gmail's daily emails for order emails; progress in webmeta/_announce stores only email hashes. Has a "reply unsubscribe" line. The Home card says why it is waiting (not the RS App, Gmail limit for today, or the last error saved in _announce lastError).
- Website order sheet shows 🚚 Shipped <date> and ✅ Buyer tapped Order received <date> (opsOrders shippedAt / receivedAt, backend v29).
- NEWHOME100 is live at checkout (backend v30; opsOrders discountCode / discount; website order sheet shows "Welcome code NEWHOME100 −₱100"). The new-website email still waits for K's OK on the preview: ask K before sending.
- Website-side (handoff docs/handoffs/website-received-cart-birthday.md): (live: backend v29, Mailer v5; staff type Yes in the Customers sheet "No Emails" column to stop cart + birthday emails) "Order received" button on shipped orders, cart reminder email (3–24h, once per cart), birthday voucher (₱200 off, min ₱1,500, 30 days, one use, BDAY-XXXXXX, 8 AM Manila).
- Orders have no tags anymore (no Tags column, no tag box in Create order / order sheet / bulk bar). Old orders' tags show as a note line ("🏷 OH · LALA MANDA") in the Note column and order sheet. Disputes use the order sheet's "⚠️ Mark as dispute" button (still a hidden DISPUTE marker); PO/OH still feed Item type.
- Reviews list (RS OS) shows the full date with the year and sorts by the full date.
- Reviews are live: regalspritz.com loads shown reviews from the RS App's /api/reviews (Supabase reviews_public, ~10s CDN cache; supabase/reviews.sql), no Shopify push. Reviews written on the website (the website POSTs to /api/reviews itself; no email kept; up to 3 photos saved to Supabase Storage bucket review-photos, supabase/review-photos.sql) arrive as **To approve**; Admin and Marketing see a count badge (sidebar + Reviews tab) and a Home "reviews to approve" card; Approve shows it, Hide keeps it off. Website build notes: docs/handoffs/website-reviews-live.md.
- "New website" email design (matches regalspritz.com: Cormorant Garamond headings, Jost text, square purple uppercase buttons like Add to cart, gold-outline second buttons): animated GIF header (projects/business-os-app/public/email/new-home.gif, served from the RS App), Shop button, "Fresh picks on-hand" grid of 4 listings (photos use the website listing template: cream backdrop, white marble stand, gold bar. Listings whose photo is already on the template are picked first and used as is; otherwise the bottle is cut out in the owner's browser (@imgly/background-removal, medium model) and placed on a drawn copy of the template. Made on first Preview / test / Start, saved to photo storage, picks frozen in webmeta/_annpicks v3; a redo keeps the same perfumes and only remakes their photos. Template check = cream corners + a thin gold bar with no gold just below it, so wood-table photos get the cut-out) with prices (new arrivals first) linking to their pages, 4 feature tiles, Royal Welcome box (create an account). Welcome code **NEWHOME100**: ₱100 off website orders ₱3,000+, one use per account, until Dec 31, 2026 (ANN_CODE in RS OS; checkout rules for the website chat in docs/handoffs/website-welcome-code.md). Subject: "Regal Spritz PH has a new home ✨ + ₱100 off inside".
- Undo: Ctrl/Cmd+Z undoes the last change in RS OS (one click or save = one step), Ctrl/Cmd+Shift+Z redoes.
- When a fix can be done from the RS App (e.g. a site add-on), do it instead of asking K to paste into another chat.
- Royal Receipt shows the Shipping fee (buyer pays; Create order and Edit items have a Shipping fee box, separate from "Shipping you paid"). "How will the buyer pay?" (Create order + Royal Receipt): **BDO BNPL** (copy the fields, make the BDO link, paste it → receipt emailed with Pay with BDO), **Card · Maya Checkout** (RS OS makes the Maya link via /api/site maya: Maya public key saved in Supabase app_settings.maya_public_key (supabase/maya-key.sql, set Oct 9, 2026; Vercel MAYA_PUBLIC_KEY wins if added) or backend opsMayaCheckout, see docs/handoffs/rs-os-maya-link.md → receipt emailed with Pay now), **E-wallet / Bank transfer** (receipt shows our themed QR cards + accounts, buyer replies with a screenshot, staff mark Fully paid). Our receiving accounts + QR cards live only in the database (webmeta/_paymethods), never in the repo; an owner device copies the cards to photo storage for emails. Order details show 💳 Pay link / Copy pay link.
- Royal Receipt sheet: "How the buyer pays" is 3 big cards (BDO BNPL / Card · Maya / E-wallet / Bank) with ✓ Selected, plus a Shipping fee box (and Free shipping tick) that saves into the receipt. The receipt always shows a Shipping fee row (amount, Pickup, Free, or "To follow").
- Website speed: /api/products on the RS App is a CDN-cached copy of the backend products.js (s-maxage 15s, stale-while-revalidate); the website should load it (docs/handoffs/website-speed.md).
- Royal Receipt: every RS OS order with an email gets the Royal Receipt emailed automatically (store Gmail via the website backend `opsEmail`, spec docs/handoffs/website-opsEmail.md; LIVE since Oct 9, 2026 (backend v32, sends from regalspritz2024@gmail.com via Regal Spritz Mailer v7). Free Gmail: ~100 emails a day shared with sign-in codes; the Mailer refuses RS OS emails at 15 or fewer left (error "daily Gmail limit reached" = pause until tomorrow, not a failure; RS OS pauses customer emails at ≤16 remaining); each call sends kind receipt / update / review / announce / test), and again when a pay link is added. The only payment button is the order's own pay link (Maya/BDO). Staff can copy it as text for chat when there's no email.
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
