# Website backend: add `opsEmail` (Royal Receipt emails from RS OS)

Paste this into the website (Apps Script backend) chat.

---

Please add a new ops action to the website backend so RS OS can email Royal Receipts from the store Gmail.

**Action:** `opsEmail`
**Request (POST JSON, same as the other ops actions):** `{ action: "opsEmail", key, to, subject, html, text, by }`

- Check `key` exactly like `opsOrders` / `opsUpdate` / `opsStatuses` (reject with `{ ok:false, error:"not allowed" }`).
- `to`: one email address. Reject anything with commas, semicolons, spaces or more than one `@`.
- `subject`: max 200 characters, no line breaks.
- `html`: the receipt (max 150 KB). `text`: plain-text version.
- Send with:
  ```js
  MailApp.sendEmail({ to, subject, htmlBody: html, body: text, name: "Regal Spritz PH" });
  ```
  (Optionally set `replyTo` to the store's support email.)
- Answer `{ ok: true, remaining: MailApp.getRemainingDailyQuota() }`. On error answer `{ ok: false, error: e.message }`.
- Optional: log `[date, to, subject, by]` to an "Emails" sheet. Don't store the HTML.

After saving: run any function once in the editor to approve the new "Send email as you" permission, then **Deploy → Manage deployments → Edit → New version → Deploy** (same web app URL).
