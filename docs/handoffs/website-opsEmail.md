# Website backend: add `opsEmail` (all RS OS emails to buyers)

Paste the part below the line into the website (Apps Script backend) chat.

---

Please add `opsEmail` to the website backend (doPost, same key check as opsOrders) and deploy on the SAME web app URL (both deployments). The big "new website" email is PAUSED in RS OS (webmeta/_announce status "paused"); it only starts again when K taps Start sending.

**Request** (POST, text/plain JSON, one email per call, sent by RS OS through /api/site):
```
{ action: "opsEmail", key, to, subject, html, text, kind, by }
```
- `key`: check exactly like opsOrders; wrong key → `{ ok:false, error:"not allowed" }`.
- `to`: one address. Reject commas, semicolons, spaces, or not exactly one `@` → `{ ok:false, error:"bad email" }`.
- `subject`: up to 200 characters, one line. `html`: up to 150 KB. `text`: plain-text version (up to 20 KB).
- `kind`: `receipt` | `update` | `review` | `announce` | `test` (default `update`).
  - `announce` is marketing: if this email is marked Yes in the Customers sheet "No Emails" column, don't send; answer `{ ok:true, skipped:"no-emails", remaining }`.
  - every other kind always sends (order emails).
- `by`: team member name (for the log only).

**Send:**
```js
MailApp.sendEmail({ to, subject, htmlBody: html, body: text, name: "Regal Spritz PH", replyTo: <store support email> });
```

**Response:** `{ ok:true, remaining: MailApp.getRemainingDailyQuota() }`. On any error: `{ ok:false, error: e.message }` (keep Google's message, RS OS shows it to the team). Please don't use the words "unknown action" for anything except a missing action.

**Volume:** RS OS sends one call at a time, about 1 per second.
- Order emails (receipts, status updates, tracking, review invites): roughly 20–80 a day.
- The new-website email: up to 40 per batch, every 5 minutes, only while the owner's RS App is open. RS OS stops for the day when `remaining` drops under 30, so order emails always have room.
- So `remaining` matters: Gmail allows 100/day on a free account, 1,500/day on Google Workspace. Please tell me which one the store uses.

**Log (optional):** append `[date, kind, to, subject, by]` to an "Emails" sheet. Don't store the HTML.

**After saving:** run any function once in the editor to approve "Send email as you", then Deploy → Manage deployments → Edit → New version → Deploy. Then send one `kind:"test"` email to kristinsumiran@gmail.com and tell me it arrived and what `remaining` said.
