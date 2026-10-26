# Website backend v40: Voucher generator (RS OS → Marketing → Vouchers)

Paste into the Apps Script project (same file as the other ops actions), then:
1. add `opsVouchers, opsVoucherAdd, opsVoucherSet` to the `const fn = { ... }[b.action]` map (line ~141), and
2. add `'opsVouchers', 'opsVoucherAdd', 'opsVoucherSet'` to `NO_LOCK`,
3. Deploy → Manage deployments → edit the existing web app → New version (same URL).

```js
/* ---------- v40: voucher generator (RS OS Marketing > Vouchers) ---------- */
function opsVouchers(b) {
  if (!opsKeyOk(b.key)) return { ok: false, error: 'Not allowed.' };
  const today = iso(new Date());
  return { ok: true, vouchers: rows('Vouchers').map((r, i) => ({ row: i + 2, at: iso(r[0]), email: String(r[1] || ''), code: String(r[2] || ''), type: String(r[3] || 'Voucher'),
    amount: Number(r[4]) || 0, min: Number(r[5]) || 0, from: iso(r[6]), until: iso(r[7]), status: vstatus(r, today), order: String(r[9] || ''), note: String(r[10] || '') })).reverse().slice(0, 1500) };
}
function opsVoucherAdd(b) {
  if (!opsKeyOk(b.key)) return { ok: false, error: 'Not allowed.' };
  const email = normEmail(b.email), amount = Math.round(Number(b.amount) || 0), min = Math.max(0, Math.round(Number(b.min) || 0));
  if (!okEmail(email)) return { ok: false, error: 'Enter the customer’s email (the one on their website account).' };
  if (!(amount >= 1 && amount <= 50000)) return { ok: false, error: 'The amount must be PHP 1 to 50,000.' };
  const ymd = /^\d{4}-\d\d-\d\d$/, from = ymd.test(b.from || '') ? b.from : iso(new Date()), until = ymd.test(b.until || '') ? b.until : iso(new Date(Date.now() + 30 * 864e5));
  if (until < from) return { ok: false, error: 'The end date is before the start date.' };
  const have = new Set(rows('Vouchers').map(r => String(r[2]).toUpperCase()));
  let code = String(b.code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  if (code) { if (have.has(code)) return { ok: false, error: 'That code already exists.' }; }
  else do { code = 'RS-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase(); } while (have.has(code));
  sh('Vouchers').appendRow([new Date(), email, code, String(b.type || 'Voucher').slice(0, 30), amount, min, "'" + from, "'" + until, 'Active', '',
    (String(b.note || '').slice(0, 200) + (b.by ? ' (by ' + String(b.by).slice(0, 40) + ')' : '')).trim()]);
  return { ok: true, code, email, amount, min, from, until };
}
// status: 'Cancelled' (not for used vouchers) or 'Active' (bring a cancelled one back). The code must match the row.
function opsVoucherSet(b) {
  if (!opsKeyOk(b.key)) return { ok: false, error: 'Not allowed.' };
  const row = Math.floor(Number(b.row)), s = sh('Vouchers');
  if (!(row >= 2 && row <= s.getLastRow())) return { ok: false, error: 'Voucher not found.' };
  const r = s.getRange(row, 1, 1, SHEETS.Vouchers.length).getValues()[0];
  if (String(r[2]).toUpperCase() !== String(b.code || '').toUpperCase()) return { ok: false, error: 'Voucher not found (the list changed). Refresh and try again.' };
  if (/used/i.test(String(r[8]))) return { ok: false, error: 'That voucher was already used.' };
  if (!['Cancelled', 'Active'].includes(b.status)) return { ok: false, error: 'Nothing to change.' };
  s.getRange(row, 9).setValue(b.status);
  return { ok: true };
}
```
Customers see it in My Account → Vouchers and can pick it at checkout (existing v6 voucher logic: their account email, Active today, subtotal ≥ min, one use; returned if the order is cancelled).
