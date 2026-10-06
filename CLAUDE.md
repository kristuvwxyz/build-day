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
- J&T bookings: Parcel name is always COSMETICS and declared Value is always ₱500.
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
