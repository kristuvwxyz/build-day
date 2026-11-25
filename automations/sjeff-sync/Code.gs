/**
 * RS S-JEFF Sync (K, Nov 25, 2026). Runs every 30 minutes in K's Google account.
 * Reads S-JEFF's sheet "Kristin - 2026 Pre Orders" (tab Nov '26), sends the rows to RS OS (/api/sjeff),
 * and types the quantities RS OS returns into column H (Additional) ONLY. It never touches any other column.
 * Before writing a cell it re-reads that row and checks the Description still matches (rows can shift).
 * Setup (once): Project Settings → Script properties → add SJEFF_KEY (from RS OS). Then run setup() once and allow access.
 */
var SHEET_ID = '1Hz8rMaSkWMgDe0NW6vtNm_2etkAEfiGf7iDod3O_UKE';
var TAB_GID = 894065226;            // Nov '26
var API = 'https://os.regalspritz.com/api/sjeff';
var SJEFF_KEY_INLINE = '__KEY__';   // filled in when the project is set up (private to K's Google account)

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sync') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sync').timeBased().everyMinutes(30).create();
  sync();
}

function tab_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheets().filter(function (s) { return s.getSheetId() === TAB_GID; })[0];
  if (!sh) throw new Error("Nov '26 tab not found");
  return sh;
}

function readRows_(sh) {
  var v = sh.getRange(1, 1, sh.getLastRow(), 8).getDisplayValues();
  var rows = [], sec = '';
  for (var i = 1; i < v.length; i++) {
    var c = v[i].map(function (x) { return String(x || '').trim(); });
    if (!c[0] && c[1] && !c[2]) { sec = c[1]; continue; }      // section header row (e.g. TESTERS, NARS Lip Gloss)
    if (!c[2]) continue;
    var num = function (x) { return Number(String(x).replace(/,/g, '')) || 0; };
    rows.push({ row: i + 1, section: sec, barcode: c[0], brand: c[1], desc: c[2], price: num(c[3]), avail: num(c[4]), F: num(c[5]), H: num(c[7]) });
  }
  return rows;
}

function sync(dry) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var key = PropertiesService.getScriptProperties().getProperty('SJEFF_KEY') || SJEFF_KEY_INLINE;
    if (!key) throw new Error('Add SJEFF_KEY in Script properties.');
    var sh = tab_();
    var rows = readRows_(sh);
    var r = UrlFetchApp.fetch(API, { method: 'post', contentType: 'application/json', headers: { 'x-sjeff-key': key },
      payload: JSON.stringify({ rows: rows, dry: dry === true }), muteHttpExceptions: true });
    var j = JSON.parse(r.getContentText() || '{}');
    if (!j.ok) throw new Error('RS OS said: ' + (j.error || r.getResponseCode()));
    var wrote = 0;
    (j.writes || []).forEach(function (w) {
      if (dry === true || w.col !== 'H') return;
      var desc = String(sh.getRange(w.row, 3).getDisplayValue() || '').trim();
      if (desc !== String(w.desc || '').trim()) { console.warn('Row ' + w.row + ' moved; skipped ' + w.desc); return; }
      sh.getRange(w.row, 8).setValue(w.value);
      wrote++;
    });
    console.log(JSON.stringify({ wrote: wrote, placed: j.placed, toBill: j.toBill, stock: j.stock, alerts: j.alerts }));
    return j;
  } finally { lock.releaseLock(); }
}

function dryRun() { return sync(true); }
