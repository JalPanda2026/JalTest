// Logic tests for Pocock_Sanders_IHT_Calculator.html
//
// There is no browser here, so the approach is the same one used for the LOA Generator:
// pull the script block out of the HTML and eval it against a minimal DOM stub, then drive
// the real functions directly. Run with:  node tests/test_engine.js
//
// Note: indirect eval, (0,eval)(...), is deliberate. It evaluates in global scope, so the
// app's function declarations land on globalThis where the tests can reach them. A direct
// eval would keep them trapped in this module's scope.

const fs = require('fs');
const path = require('path');

const HTML = path.join(__dirname, '..', 'Pocock_Sanders_IHT_Calculator.html');
const html = fs.readFileSync(HTML, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 1) throw new Error('expected 1 script block, found ' + scripts.length);

// ── Minimal DOM stub ────────────────────────────────────────────────────────────
// Elements are created lazily, so every getElementById in the app resolves to something
// with the handful of properties the app actually touches.
const stubs = {};
function mkEl(id) {
  const el = {
    id, value: '', innerHTML: '', textContent: '', className: '', disabled: false,
    checked: false, files: null, dataset: {}, style: {}, options: [], selectedIndex: -1,
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; }
    },
    appendChild() {}, insertBefore() {}, addEventListener() {}, removeEventListener() {},
    click() {}, focus() {}, setAttribute() {}, getAttribute() { return null; },
    setSelectionRange() {}, querySelector() { return mkEl(id + ':q'); },
    querySelectorAll() { return []; }, getContext() { return {}; }
  };
  return el;
}
global.document = {
  getElementById(id) { return stubs[id] || (stubs[id] = mkEl(id)); },
  createElement(t) { return mkEl('new:' + t); },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  body: { insertBefore() {}, firstChild: null },
  title: ''
};
global.window = {
  scrollTo() {}, print() {}, addEventListener() {},
  setTimeout: (f) => f, clearTimeout() {}
};
global.setTimeout = (f) => f;
global.clearTimeout = () => {};
global.confirm = () => true;
global.alert = () => {};

(0, eval)(scripts[0][1]);

// ── Test helpers ────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '\n          ' + detail : '')); }
}
function eq(name, actual, expected) {
  const a = Math.round(actual), e = Math.round(expected);
  ok(name, a === e, 'expected ' + e.toLocaleString('en-GB') + ', got ' + a.toLocaleString('en-GB'));
}
function set(id, v) { document.getElementById(id).value = String(v); }
function clearAll() {
  ['a_res','a_prop','a_pension','a_invest','a_bpr','a_cash','a_other','a_la','a_isa','a_bond',
   'a_chattels','p_gifts','p_edgt','d_amt','d_disc','d_inc','d_wlsa','d_wlpm','b_amt','b_amt_aim',
   'd_source1_amt','d_source2_amt','d_source3_amt','b_source1_amt','b_source2_amt','b_source3_amt']
    .forEach(id => set(id, 0));
  ['d_source1','d_source2','d_source3','b_source1','b_source2','b_source3'].forEach(id => set(id, ''));
}

console.log('\ncalcRNRB — taper mechanics');
{
  const r = calcRNRB(1800000, 2, true);
  eq('below £2m: full 2-person RNRB', r.av, 350000);
  ok('below £2m: not flagged as tapered', r.tapered === false);

  const r2 = calcRNRB(2400000, 2, true);
  // £400,000 over threshold ÷ 2 = £200,000 reduction against a £350,000 maximum
  eq('£2.4m estate: taper reduction', r2.taper, 200000);
  eq('£2.4m estate: RNRB left', r2.av, 150000);

  const r3 = calcRNRB(2700000, 2, true);
  eq('£2.7m estate: 2-person RNRB fully withdrawn', r3.av, 0);

  const r4 = calcRNRB(2350000, 1, true);
  eq('£2.35m estate: single-person RNRB fully withdrawn', r4.av, 0);

  eq('RNRB switched off returns nil', calcRNRB(1000000, 2, false).av, 0);
  eq('taper base is echoed back', calcRNRB(1234567, 2, true).base, 1234567);
}

console.log('\nbprAprBands — £2.5m allowance from 6 April 2026');
{
  const b = bprAprBands(0, 1000000, 1);
  eq('£1m new, within allowance: 100% relieved', b.relieved, 1000000);

  const b2 = bprAprBands(0, 4000000, 1);
  // First £2.5m at 100%, remaining £1.5m at 50%
  eq('£4m new, single person: relieved', b2.relieved, 2500000 + 750000);

  const b3 = bprAprBands(3000000, 0, 1);
  eq('£3m existing, single person: relieved', b3.relieved, 2500000 + 250000);

  const b4 = bprAprBands(2500000, 1000000, 1);
  eq('allowance used by existing: new gets 50% only', b4.newFull, 0);
  eq('allowance used by existing: new relief', b4.newHalf * 0.5, 500000);

  const b5 = bprAprBands(0, 4000000, 2);
  eq('couple gets £5m combined allowance', b5.relieved, 4000000);
}

console.log('\nRNRB taper base — pensions are outside the estate until 6 April 2027');
{
  clearAll();
  setClients(2); setRNRB(true);
  // £1.9m of non-pension assets plus a £400k pension. Gross is £2.3m, but only £1.9m is
  // inside the estate today, so today's RNRB must NOT be tapered.
  set('a_res', 1200000); set('a_cash', 700000); set('a_pension', 400000);
  refresh();
  const d = _last;

  eq('gross estate includes the pension', d.gross, 2300000);
  eq('today: taper base excludes the pension', d.rnrbPre.base, 1900000);
  eq('today: full RNRB survives', d.rnrbPre.av, 350000);
  ok('today: not flagged as tapered', d.rnrbPre.tapered === false);

  eq('from 2027: taper base includes the pension', d.rnrbPost.base, 2300000);
  eq('from 2027: RNRB tapered by £150,000', d.rnrbPost.av, 200000);

  // Today: £1.9m estate − £650k NRB − £350k RNRB = £900k taxable
  eq('today: taxable estate', d.pre_i.liable, 900000);
  eq('today: IHT at 40%', d.pre_i.iht, 360000);

  // From 2027: £2.3m − £650k NRB − £200k RNRB = £1.45m taxable
  eq('from 2027: taxable estate', d.post_i.liable, 1450000);
  eq('from 2027: IHT at 40%', d.post_i.iht, 580000);
}

console.log('\nRNRB taper base — value already outside the estate never counts');
{
  clearAll();
  setClients(2); setRNRB(true);
  set('a_res', 1500000); set('a_cash', 700000); set('p_edgt', 300000);
  refresh();
  const d = _last;
  eq('gross includes existing trust value', d.gross, 2500000);
  eq('taper base excludes existing trust value', d.rnrbPre.base, 2200000);
  eq('RNRB tapered on £2.2m, not £2.5m', d.rnrbPre.av, 250000);
}

console.log('\nRelief does not restore RNRB, but a gift into trust does');
{
  clearAll();
  setClients(2); setRNRB(true);
  set('a_res', 1500000); set('a_cash', 900000);   // £2.4m, all inside the estate
  setCombine(false); setWolOnly(false);
  set('b_amt', 400000);                            // BPR investment
  set('d_amt', 400000);                            // DGT of the same size
  refresh();
  const d = _last;

  eq('baseline taper base', d.rnrbPost.base, 2400000);
  eq('baseline RNRB after taper', d.rnrbPost.av, 150000);

  ok('BPR leaves the taper base untouched', d.rnrbPort.base === 2400000,
     'expected 2,400,000, got ' + d.rnrbPort.base.toLocaleString('en-GB'));
  eq('BPR cannot restore tapered RNRB', d.rnrbPort.av, 150000);

  eq('DGT removes its value from the taper base', d.rnrbDgt.base, 2000000);
  eq('DGT restores the full RNRB', d.rnrbDgt.av, 350000);
  ok('DGT beats equal-sized BPR here', d.dgt_i.iht < d.port_i.iht,
     'DGT ' + d.dgt_i.iht + ' vs BPR ' + d.port_i.iht);
}

console.log('\nFunding-source mismatch warning (previously a ReferenceError)');
{
  clearAll();
  setClients(2); setRNRB(true);
  set('a_res', 1000000); set('a_cash', 500000);
  setWolOnly(false); setCombine(false);
  set('d_amt', 250000);
  set('d_source1', 'cash'); set('d_source1_amt', 200000);  // deliberate £50k shortfall
  let threw = null;
  try { refresh(); } catch (e) { threw = e; }
  ok('refresh survives a source/investment mismatch', threw === null,
     threw ? threw.constructor.name + ': ' + threw.message : '');
  const warn = document.getElementById('dgt_src_warn').innerHTML;
  ok('shortfall is reported to the adviser', /shortfall of/.test(warn), 'warn html: ' + warn);
  ok('shortfall amount is correct', /50,000/.test(warn), 'warn html: ' + warn);

  set('d_source1_amt', 300000);  // now a £50k excess
  threw = null;
  try { refresh(); } catch (e) { threw = e; }
  ok('refresh survives an excess too', threw === null,
     threw ? threw.constructor.name + ': ' + threw.message : '');
  ok('excess is reported', /excess of/.test(document.getElementById('dgt_src_warn').innerHTML));

  set('d_source1_amt', 250000);  // matched
  refresh();
  ok('no warning when sources match', !/shortfall|excess/.test(document.getElementById('dgt_src_warn').innerHTML));
}

console.log('\nReport table reconciles to the tax figure it prints');
{
  clearAll();
  setClients(2); setRNRB(true);
  // Deliberately populate the asset types the old table omitted.
  set('a_res', 900000); set('a_prop', 250000); set('a_pension', 300000); set('a_invest', 120000);
  set('a_cash', 80000); set('a_isa', 60000); set('a_bond', 40000); set('a_chattels', 30000);
  set('a_other', 20000); set('p_gifts', 100000);
  setCombine(false); setWolOnly(false);
  set('d_amt', 200000);
  goStep(6);
  const d = _last;
  const body = document.getElementById('rep_table_body').innerHTML;

  // Asset lines must sum to the printed gross estate.
  const money = s => Number(String(s).replace(/[^\d]/g, '')) || 0;
  const before = body.split('Total (Gross Estate)')[0];
  const cells = [...before.matchAll(/<td class="r[^"]*">£([\d,]+)<\/td>/g)].map(m => money(m[1]));
  const summed = cells.reduce((a, b) => a + b, 0);
  eq('asset rows sum to gross estate', summed, d.gross);

  ok('ISA line present in report', /ISA funds/.test(body));
  ok('Offshore Bond line present in report', /Offshore Bond/.test(body));
  ok('Chattels line present in report', /Chattels/.test(body));

  // Gifts must appear as a reduction of the NRB, not as a second deduction.
  ok('gifts shown against the Nil Rate Band', /less £100,000 of gifts/.test(body), 'body: ' + body.slice(0, 400));
  ok('no separate standalone gifts deduction row',
     !/<td[^>]*>Less: gifts within the last 7 years<\/td>/.test(body));

  // The NRB line must show the gift-reduced figure that the tax was actually computed from.
  eq('NRB shown net of gifts', money((body.match(/Less: Nil Rate Band[\s\S]*?<td class="r">−£([\d,]+)<\/td>/) || [])[1]), 650000 - 100000);

  // And the liable figure must be the one the printed tax is 40% of.
  const liable = money((body.match(/Estate liable to Inheritance Tax<\/td><td class="r">£([\d,]+)/) || [])[1]);
  eq('liable line matches the engine', liable, d.dgt_i.liable);
  eq('printed tax is 40% of the liable line', d.dgt_i.iht, liable * 0.4);
}

console.log('\n' + (fail === 0 ? 'ALL PASS' : 'FAILURES PRESENT') + ' — ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail === 0 ? 0 : 1);
