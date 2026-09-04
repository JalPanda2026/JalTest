// Logic tests for Pocock_Sanders_Sales_Tracker.html
//
// Same approach as tests/test_engine.js: pull the inline script block out of the HTML and
// eval it in global scope against a minimal DOM stub, then drive the real functions.
// The functions under test (mergeBackup, mergeLists, totalMismatch, fingerprint) are pure
// and touch no DOM, so this exercises the shipped code, not a copy. Run with:
//   node tests/test_sales_tracker.js

const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', 'Pocock_Sanders_Sales_Tracker.html');
const html = fs.readFileSync(HTML, 'utf8');
// Only the attribute-less inline block matches; the <script src="…xlsx…"> tag is ignored.
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 1) throw new Error('expected 1 inline script block, found ' + scripts.length);

// ── Minimal DOM / browser stub ──────────────────────────────────────────────────
const stubs = {};
function mkEl(id) {
  return {
    id, value: '', innerHTML: '', textContent: '', className: '',
    style: {}, dataset: {}, files: null,
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    appendChild() {}, addEventListener() {}, removeEventListener() {}, remove() {},
    click() {}, focus() {}, setAttribute() {}, getAttribute() { return null; },
    querySelector() { return mkEl(id + ':q'); }, querySelectorAll() { return []; }
  };
}
global.document = {
  getElementById(id) { return stubs[id] || (stubs[id] = mkEl(id)); },
  createElement(t) { return mkEl('new:' + t); },
  body: { appendChild() {}, removeChild() {}, insertBefore() {}, firstChild: null }
};
global.window = { addEventListener() {} };
const _store = {};
global.localStorage = {
  getItem(k) { return k in _store ? _store[k] : null; },
  setItem(k, v) { _store[k] = String(v); },
  removeItem(k) { delete _store[k]; }
};
global.XLSX = {};
global.confirm = () => true;
global.alert = () => {};

(0, eval)(scripts[0][1]);

// ── Test helpers ────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '\n          ' + detail : '')); }
}

// ── totalMismatch ────────────────────────────────────────────────────────────────
ok('clean row is not flagged', totalMismatch({ total: 100, actual: 60, protection: 40 }) === false);
ok('zero total against real fee is flagged', totalMismatch({ total: 0, actual: 104145, protection: 0 }) === true);
ok('total not equal to fees + protection is flagged', totalMismatch({ total: 2000, actual: 1500, protection: 0 }) === true);
ok('sub-pound rounding is tolerated (1462.5 vs 1463)', totalMismatch({ total: 1463, actual: 1462.5, protection: 0 }) === false);
ok('missing fields treated as zero', totalMismatch({ total: 0 }) === false);

// ── mergeBackup: adds only what is new ───────────────────────────────────────────
{
  const A = { id: 'a1', date: '2026-01-01', client: 'Alice', recommendation: 'ISA', projected: 0, actual: 100, protection: 0, total: 100 };
  const B = { id: 'b2', date: '2026-01-02', client: 'Bob', recommendation: 'Bond', projected: 0, actual: 200, protection: 0, total: 200 };
  const m = mergeBackup({ entries: [A], loaEntries: [], goal: 0, monthlyGoals: {} },
                        { entries: [A, B], loaEntries: [], goal: 0, monthlyGoals: {} });
  ok('merge keeps existing and adds the new one', m.entries.length === 2);
  ok('merge reports one sale added', m.salesAdded === 1);
}

// ── mergeBackup: same record under a different id is not duplicated ───────────────
{
  const A = { id: 'a1', date: '2026-01-01', client: 'Alice', recommendation: 'ISA', projected: 0, actual: 100, protection: 0, total: 100 };
  const Adup = Object.assign({}, A, { id: 'DIFFERENT' });
  const m = mergeBackup({ entries: [A], loaEntries: [], goal: 0, monthlyGoals: {} },
                        { entries: [Adup], loaEntries: [], goal: 0, monthlyGoals: {} });
  ok('value-identical record under a new id is skipped', m.entries.length === 1 && m.salesAdded === 0);
}

// ── mergeBackup: goal and monthly targets ────────────────────────────────────────
{
  const m1 = mergeBackup({ entries: [], loaEntries: [], goal: 0, monthlyGoals: {} },
                         { entries: [], loaEntries: [], goal: 50000, monthlyGoals: {} });
  ok('missing goal is filled from the backup', m1.goal === 50000);

  const m2 = mergeBackup({ entries: [], loaEntries: [], goal: 60000, monthlyGoals: { '2026-01': 100 } },
                         { entries: [], loaEntries: [], goal: 50000, monthlyGoals: { '2026-01': 200, '2026-02': 300 } });
  ok('existing goal is kept over the backup', m2.goal === 60000);
  ok('existing monthly target is kept', m2.monthlyGoals['2026-01'] === 100);
  ok('missing monthly target is added from backup', m2.monthlyGoals['2026-02'] === 300);
}

// ── mergeBackup: LOAs merge by id ────────────────────────────────────────────────
{
  const L1 = { id: 'loa1', date: '2026-01-01', client: 'Alice', type: 'Life', qty: 1, status: 'Open' };
  const L2 = { id: 'loa2', date: '2026-01-03', client: 'Carol', type: 'Pension', qty: 2, status: 'Completed' };
  const m = mergeBackup({ entries: [], loaEntries: [L1], goal: 0, monthlyGoals: {} },
                        { entries: [], loaEntries: [L1, L2], goal: 0, monthlyGoals: {} });
  ok('LOA merge adds only the new LOA', m.loaEntries.length === 2 && m.loaAdded === 1);
}

// ── Dashboard maths ──────────────────────────────────────────────────────────────
// working days: 1 Jan 2026 is a Thursday; 1–7 Jan has Thu Fri Mon Tue Wed = 5 working days
ok('workingDaysBetween counts Mon–Fri only', workingDaysBetween(new Date(2026,0,1), new Date(2026,0,7)) === 5,
   'got ' + workingDaysBetween(new Date(2026,0,1), new Date(2026,0,7)));

ok('monthPaceRatio is 0 before the month', monthPaceRatio('2026-01', '2025-12-31') === 0);
ok('monthPaceRatio is 1 after the month', monthPaceRatio('2026-01', '2026-02-15') === 1);
{
  const r = monthPaceRatio('2026-01', '2026-01-15');
  ok('monthPaceRatio is strictly between 0 and 1 mid-month', r > 0 && r < 1, 'got ' + r);
}

ok('yearPaceRatio is 0 before the year', yearPaceRatio(2026, '2025-06-01') === 0);
ok('yearPaceRatio is 1 after the year', yearPaceRatio(2026, '2027-01-01') === 1);

ok('projectYearEnd of zero is zero', projectYearEnd(0, 2026, '2026-06-01') === 0);
ok('projectYearEnd at full-year pace equals YTD', projectYearEnd(100000, 2026, '2027-01-01') === 100000);

{
  const list = [
    { date: '2026-01-10', total: 1000 },
    { date: '2026-03-10', total: 2000 },
    { date: '2025-05-10', total: 9999 }
  ];
  const t = monthlyTotals(list, 2026);
  ok('monthlyTotals has 12 slots', t.length === 12);
  ok('monthlyTotals buckets by month and year', t[0] === 1000 && t[2] === 2000 && t[1] === 0);
}

{
  const list = [
    { date: '2026-01-10', total: 1000 },
    { date: '2026-01-20', total: 500 },
    { date: '2026-03-10', total: 2000 }
  ];
  const b = bestMonth(list);
  ok('bestMonth finds the largest month', b.key === '2026-03' && b.value === 2000);
}

{
  const list = [
    { date: '2026-01-01', total: 120 },
    { date: '2026-02-01', total: 50 },
    { date: '2026-03-01', total: 200 }
  ];
  const goals = { '2026-01': 100, '2026-02': 100, '2026-03': 100 };
  ok('targetStreak stops at the first miss walking back', targetStreak(list, goals, '2026-03') === 1,
     'got ' + targetStreak(list, goals, '2026-03'));
  const list2 = [
    { date: '2026-01-01', total: 120 },
    { date: '2026-02-01', total: 150 },
    { date: '2026-03-01', total: 200 }
  ];
  ok('targetStreak counts all consecutive hits', targetStreak(list2, goals, '2026-03') === 3);
}

{
  const a = nextMilestone(45000);
  ok('nextMilestone under 50k steps by 10k', a.milestone === 50000 && a.remaining === 5000);
  const c = nextMilestone(120000);
  ok('nextMilestone in mid range steps by 25k', c.milestone === 125000 && c.remaining === 5000);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
