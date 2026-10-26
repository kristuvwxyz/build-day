
/* ---------- v41: shared promo codes (RS OS Marketing > Vouchers > Shared codes) ---------- */
// Sheet "Promo Codes": Code | Type (Percent or Peso) | Value | Min Spend | Max Off | Valid From | Valid Until | Limit (total uses, 0 = no limit) | Per Customer (Yes = once per account / email) | Status (Active / Paused / Cancelled) | Note | Created | By
function promoRow(code) {
  const k = String(code || '').trim().toUpperCase(); if (!k) return null;
  const all = rows('Promo Codes'), i = all.findIndex(r => String(r[0]).trim().toUpperCase() === k); if (i < 0) return null; const r = all[i];
  return { row: i + 2, code: k, type: String(r[1] || 'Peso'), value: Number(r[2]) || 0, min: Number(r[3]) || 0, max: Number(r[4]) || 0, from: iso(r[5]), until: iso(r[6]), limit: Number(r[7]) || 0,
    once: !/^(no|n|false|0)$/i.test(String(r[8] || 'Yes').trim()), status: String(r[9] || 'Active').trim() || 'Active', note: String(r[10] || '') };
}
const promoPct = P => /percent/i.test(P.type);
function promoAmt(P, sub) { if (!P) return 0; const a = promoPct(P) ? Math.round((Number(sub) || 0) * P.value / 100) : P.value; return Math.max(0, P.max ? Math.min(a, P.max) : a); }
function promoUsedRows(code) { const s = sh('Orders'), n = s.getLastRow(); if (n < 2) return []; return s.getRange(2, 1, n - 1, SHEETS.Orders.length).getValues().filter(r => String(r[O['Discount Code']]).toUpperCase() === code && !isCancelled(r)); }
// Why the code can't be used ('' = OK). sub = null skips the minimum-spend check (the checkout shows "add PHP X more").
function promoWhy(code, c, email, sub) {
  const P = promoRow(code); if (!P) return 'unknown code';
  if (!/^active$/i.test(P.status)) return 'not active';
  const today = iso(new Date()); if (P.from && today < P.from) return 'not started'; if (P.until && today > P.until) return 'expired';
  if (sub != null && sub < P.min) return 'subtotal under PHP ' + P.min;
  const used = promoUsedRows(code); if (P.limit && used.length >= P.limit) return 'fully redeemed';
  if (P.once) {
    const mine = c ? [normEmail(c.r[C.Email]), ...String(c.r[C['Other Emails']] || '').split(',').map(normEmail)] : [];
    const ems = mine.concat(okEmail(normEmail(email)) ? [normEmail(email)] : []).filter(Boolean);
    if (ems.length && used.some(r => ems.includes(normEmail(r[O.Email])))) return 'already used';
  }
  return '';
}
function promoCheckGen(code, c, b) {
  const why = promoWhy(code, c, b.email, null);
  const msg = { 'unknown code': 'That code isn’t valid', 'not active': 'That code isn’t valid', 'not started': 'This code isn’t open yet', expired: 'This code has expired', 'fully redeemed': 'Sorry, this code has been fully redeemed', 'already used': 'You already used this code' }[why];
  if (why) return { ok: false, error: msg || 'That code isn’t valid' };
  const P = promoRow(code); return { ok: true, code, pct: promoPct(P) ? P.value : 0, off: promoPct(P) ? 0 : P.value, max: P.max, min: P.min, until: P.until || '2099-12-31' };
}
function opsPromos(b) {
  if (!opsKeyOk(b.key)) return { ok: false, error: 'Not allowed.' };
  const today = iso(new Date()), uses = {};
  const s = sh('Orders'), n = s.getLastRow();
  if (n > 1) s.getRange(2, 1, n - 1, SHEETS.Orders.length).getValues().forEach(r => { const k = String(r[O['Discount Code']]).toUpperCase(); if (k && !isCancelled(r)) uses[k] = (uses[k] || 0) + 1; });
  return { ok: true, promos: rows('Promo Codes').map((r, i) => { const P = promoRow(r[0]); if (!P) return null;
    const st = /^active$/i.test(P.status) ? (P.from && today < P.from ? 'Upcoming' : P.until && today > P.until ? 'Expired' : P.limit && (uses[P.code] || 0) >= P.limit ? 'Fully used' : 'Active') : P.status;
    return { row: i + 2, code: P.code, type: P.type, value: P.value, min: P.min, max: P.max, from: P.from, until: P.until, limit: P.limit, once: P.once, status: st, used: uses[P.code] || 0, note: P.note, at: iso(r[11]) }; }).filter(Boolean).reverse() };
}
function opsPromoAdd(b) {
  if (!opsKeyOk(b.key)) return { ok: false, error: 'Not allowed.' };
  const code = String(b.code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  if (code.length < 3) return { ok: false, error: 'The code needs at least 3 letters or numbers.' };
  if (promoRow(code) || code === WCODE.code || ['AFTERDARK', 'ROYALTY'].includes(code) || /^BDAY/.test(code) || rows('Vouchers').some(r => String(r[2]).toUpperCase() === code)) return { ok: false, error: 'That code is already taken.' };
  const pct = /percent/i.test(String(b.type)), value = Math.round(Number(b.value) || 0);
  if (pct ? !(value >= 1 && value <= 90) : !(value >= 1 && value <= 50000)) return { ok: false, error: pct ? 'Percent must be 1 to 90.' : 'The amount must be PHP 1 to 50,000.' };
  const ymd = /^\d{4}-\d\d-\d\d$/, from = ymd.test(b.from || '') ? b.from : iso(new Date()), until = ymd.test(b.until || '') ? b.until : '';
  if (!until) return { ok: false, error: 'Every code needs an end date.' };
  if (until < from) return { ok: false, error: 'The end date is before the start date.' };
  sh('Promo Codes').appendRow([code, pct ? 'Percent' : 'Peso', value, Math.max(0, Math.round(Number(b.min) || 0)), pct ? Math.max(0, Math.round(Number(b.max) || 0)) : 0, "'" + from, "'" + until,
    Math.max(0, Math.round(Number(b.limit) || 0)), b.once === false ? 'No' : 'Yes', 'Active', String(b.note || '').slice(0, 200), new Date(), String(b.by || '').slice(0, 40)]);
  return { ok: true, code, from, until };
}
function opsPromoSet(b) {
  if (!opsKeyOk(b.key)) return { ok: false, error: 'Not allowed.' };
  const P = promoRow(b.code); if (!P || P.row !== Math.floor(Number(b.row))) return { ok: false, error: 'Code not found (the list changed). Refresh and try again.' };
  if (!['Active', 'Paused', 'Cancelled'].includes(b.status)) return { ok: false, error: 'Nothing to change.' };
  sh('Promo Codes').getRange(P.row, 10).setValue(b.status); return { ok: true };
}
