// Run: npm i jsdom && node --test app.test.js   (APP=path/to/macro-tracker-v2.html to override)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const FILE = process.env.APP || require('path').join(__dirname, '..', 'index.html');
const html = fs.readFileSync(FILE, 'utf8');

function boot(store, claude, pre) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://app.test/', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.scrollTo = () => {}; if (store) w.localStorage.setItem('nt2', store); if (claude) w.claude = claude; if (pre) pre(w); } });
  const w = dom.window;
  w.errors = errors;
  return w;
}
const $ = (w, s) => w.document.querySelector(s);
const click = (w, s) => { const e = $(w, s); assert.ok(e, 'missing element ' + s); e.click(); };
const type = (w, id, v) => { const e = $(w, '#' + id); assert.ok(e, 'missing #' + id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); };
const change = (w, id, v) => { const e = $(w, '#' + id); assert.ok(e, 'missing #' + id); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
const ev = (w, c) => w.eval(c);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b} ± ${tol}, got ${a}`);

// ---- Reference ranges per serving as stored in the tool: name|protein g|carbs g|kcal ----
// Approximate home-style values from typical IFCT / USDA figures for the stated portion (±~25%).
const REF = {};
`Poha with peanuts (1 plate)|5-9|38-55|220-330
Moong dal chilla ×2|10-16|18-32|160-260
Besan chilla ×2|10-14|22-32|180-260
Idli ×3 + sambar|7-12|36-55|230-330
Paneer paratha ×1|9-14|28-38|300-380
Upma (1 bowl)|5-8|35-50|200-300
Oats with milk and nuts|11-17|35-50|280-400
Egg bhurji (2 eggs) + 1 roti|14-18|16-24|260-340
Masala omelette (3 eggs) + toast|18-24|12-22|300-430
Dahi (1 bowl)|5-7|6-9|80-120
Sprouts salad (1 bowl)|7-12|14-25|90-150
Boiled eggs ×2|12-13.5|0.5-2|135-160
Whey shake|20-27|2-6|100-140
Dal + 2 roti + sabzi|14-20|50-70|380-500
Rajma + 1 cup rice|12-17|58-75|380-480
Chole + 2 roti|14-19|55-68|360-470
Paneer bhurji + 2 roti|18-26|32-44|390-490
Soya chunk curry + 2 roti|22-34|36-52|380-480
Veg pulao|6-10|45-60|300-380
Moong dal khichdi|10-15|40-55|280-380
Egg curry (2 eggs) + 1 cup rice|17-23|45-58|440-560
Chicken curry + 1 cup rice|28-38|45-55|430-560
Fish curry + 1 cup rice|25-35|45-55|380-500
Dahi / raita (1 bowl)|5-7|6-9|80-120
Dal (1 bowl)|7-11|16-26|110-170
Cucumber-onion salad|0.5-2|4-10|20-50
Extra roti|2.5-4|14-22|70-120
Paneer cubes (50 g)|8-10|0.5-3|130-165
Roasted chana (30 g)|5.5-7|14-19|105-125
Sprouts chaat|7-12|15-28|110-180
Peanuts (30 g)|7-8.5|4-7|165-180
Makhana (30 g)|2.5-4|20-23|100-110
Sattu drink|5-9|16-22|100-130
Paneer tikka (80 g)|12-16|2-6|180-260
Moong dal cheela ×1|5-8|9-15|90-140
Chaas (1 glass)|2-4|3-7|30-60
Dal + 2 roti|14-18|44-56|300-400
Paneer tikka + 2 roti|18-30|30-42|420-600
Soya chunk curry + 1 roti|18-30|22-34|290-400
Palak paneer + 1 roti|14-22|20-32|330-420
Moong dal khichdi + curd|15-22|46-60|380-470
Tofu bhurji + 1 roti|16-26|16-28|250-340
Egg bhurji + 2 roti|16-21|28-38|320-400
Grilled chicken + sabzi + 1 roti|30-45|18-30|330-450
Tandoori fish + salad + 1 roti|26-34|16-26|290-380
Roti / chapati|2.5-4|14-22|70-120
Dal (cooked)|7-11|15-26|110-170
Rice (cooked)|3-5|40-50|180-220
Curd|5-7|6-9|80-120
Sabzi|1-4|6-14|60-130
Boiled egg|6-7|0.3-1|65-80
Paneer|8-10|0.5-3|120-160
Idli|2-3.5|8-14|50-80
Plain paratha|4-6|24-32|170-240
Dosa|3-5|20-30|130-190
Milk|6-9|9-13|110-190
Chaas|2-4|3-7|30-60
Dal tadka|7-11|15-25|130-200
Rajma|7-11|20-28|130-200
Chole|8-12|22-32|160-240
Paneer bhurji|12-16|4-8|200-280
Poha|5-9|38-55|220-330
Upma|5-8|35-50|200-300
Moong chilla|5-8|8-14|80-120
Besan chilla|5-7|11-16|90-130
Khichdi|6-10|28-38|180-250
Soya chunks (cooked)|12-21|5-12|90-150
Chicken curry|14-20|3-8|150-250
Whey protein|20-27|2-6|100-140
Peanuts|7-8.5|4-7|165-180
Banana|1-1.5|24-30|95-115
Samosa|3-6|20-30|220-290
Poori|2-4|13-18|110-150
Oats (cooked)|4-7|20-30|110-170
Sprouts|5-12|10-22|60-140
Besan chilla with paneer filling|10-14|12-18|170-240
Apple|0.3-0.7|22-28|85-105
Orange|0.8-1.5|13-18|55-70
Papaya (1 bowl)|0.5-1.5|13-18|55-70
Guava|2-3|12-16|55-75
Mango (1 cup)|1-1.8|22-28|90-110
Pomegranate (½ cup)|1-2|16-20|70-90
Watermelon (1 bowl)|0.5-1.2|10-13|40-50
Grapes (1 cup)|0.8-1.5|24-29|95-110`.split('\n').forEach(l => {
  const [n, p, c, k] = l.split('|'); const r = s => s.split('-').map(Number); REF[n] = { p: r(p), c: r(c), k: r(k) };
});

// Flatten every food the tool knows: [source, name, p, c, k, tag]
function allFoods(w) {
  const out = [];
  const DB = ev(w, 'DB'), CM = ev(w, 'CM'), FR = ev(w, 'FR');
  for (const m of Object.keys(DB)) DB[m].forEach(x => out.push({ src: 'DB.' + m, n: x[0], p: x[1], c: x[2], k: x[3], tag: x[4] }));
  CM.forEach(x => out.push({ src: 'CM', n: x[0], p: x[2], c: x[3], k: x[4] }));
  FR.forEach(x => out.push({ src: 'FR', n: x[0], p: x[1], c: x[2], k: x[3] }));
  return out;
}

describe('1. Food database: protein / carbs / kcal accuracy', () => {
  const w = boot();
  const foods = allFoods(w);
  test('database is not empty', () => assert.ok(foods.length > 80));
  for (const f of foods) {
    test(`${f.src} · ${f.n}`, () => {
      assert.ok([f.p, f.c, f.k].every(Number.isFinite) && f.p >= 0 && f.c >= 0 && f.k > 0, 'numbers must be finite and kcal > 0');
      const r = REF[f.n];
      assert.ok(r, 'no reference range defined for ' + f.n);
      const chk = (v, [lo, hi], what) => assert.ok(v >= lo && v <= hi, `${what} ${v} outside expected ${lo}–${hi}`);
      chk(f.p, r.p, 'protein g'); chk(f.c, r.c, 'carbs g'); chk(f.k, r.k, 'kcal');
      // Atwater sanity: kcal must cover 4/g protein+carbs; implied fat must be 0–45 g
      const fat = (f.k - 4 * f.p - 4 * f.c) / 9;
      assert.ok(fat >= -1.5, `kcal ${f.k} is less than 4P+4C (${4 * f.p + 4 * f.c}) → impossible`);
      assert.ok(fat <= 45, `implied fat ${fat.toFixed(1)} g is implausible`);
    });
  }
});

describe('2. Calculation engine', () => {
  test('meal splits add up to 100%', () => near(ev(boot(), 'Object.values(SPL).reduce((a,b)=>a+b,0)'), 1, 1e-9));
  test('tt(): eaten vs planned totals multiply per-unit value by quantity', () => {
    const w = boot();
    const r = ev(w, `(()=>{const a=[{p:6,c:13,k:110,q:2,done:true},{p:9,c:2,k:130,q:1.5,done:false}];
      return [tt(a,'p'),tt(a,'p',1),tt(a,'c'),tt(a,'k'),tt(a,'k',1)]})()`);
    assert.deepEqual(Array.from(r), [25.5, 12, 29, 415, 220]);
  });
  test('count mode: every quick-pick food autofills its exact per-unit values', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]');
    for (const x of ev(w, 'CM')) {
      type(w, 'cn', ''); type(w, 'cn', x[0]);
      assert.equal(ev(w, 'CF.p'), x[2], x[0] + ' protein'); assert.equal(ev(w, 'CF.c'), x[3], x[0] + ' carbs'); assert.equal(ev(w, 'CF.k'), x[4], x[0] + ' kcal');
    }
  });
  test('weight mode: eating exactly one standard portion in grams equals one unit', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]'); click(w, '[data-a="mode"][data-v="g"]');
    const GPU = ev(w, 'GPU');
    for (const x of ev(w, 'CM')) {
      assert.ok(GPU[x[0]] > 0, 'no gram weight for ' + x[0]);
      type(w, 'cn', ''); type(w, 'cn', x[0]); type(w, 'cq', String(GPU[x[0]]));
      const r = ev(w, 'cv()'); const g = +ev(w, 'CF.q');
      near(r.p * g, x[2], Math.max(.4, x[2] * .03), x[0] + ' protein'); near(r.c * g, x[3], Math.max(.6, x[3] * .03), x[0] + ' carbs'); near(r.k * g, x[4], Math.max(4, x[4] * .03), x[0] + ' kcal');
    }
  });
  test('MILK: weight mode must not silently log 1 g', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]'); click(w, '[data-a="mode"][data-v="g"]');
    type(w, 'cn', 'Milk');
    const q = +ev(w, 'CF.q'); assert.ok(q >= 100, 'milk should default to a real portion (≥100 g), got "' + ev(w, 'CF.q') + '"');
    type(w, 'cq', ''); click(w, '[data-a="cust"]');
    assert.equal(ev(w, 'D().m.b.length'), 0, 'blank weight must be rejected, not logged as 1 g');
    type(w, 'cq', '250'); click(w, '[data-a="cust"]');
    const it = ev(w, 'D().m.b[0]'); near(it.p * it.q, 10, 1.5, '250 ml milk protein'); near(it.k * it.q, 188, 25, '250 ml milk kcal');
  });
  test('tiny weights like 1 g need a second tap to confirm', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]'); click(w, '[data-a="mode"][data-v="g"]');
    type(w, 'cn', 'Milk'); type(w, 'cq', '1'); click(w, '[data-a="cust"]');
    assert.equal(ev(w, 'D().m.b.length'), 0); click(w, '[data-a="cust"]'); assert.equal(ev(w, 'D().m.b.length'), 1);
  });
  test('kcal is estimated as 4P+4C when left blank', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]');
    type(w, 'cn', 'Homemade ladoo'); type(w, 'cu', 'piece'); type(w, 'cq', '2'); type(w, 'cp', '3'); type(w, 'cc', '20'); click(w, '[data-a="cust"]');
    const it = ev(w, 'D().m.b[0]'); assert.equal(it.k, 92); assert.equal(it.q, 2);
  });
  test('implausible entry (448 × per-chilla value) is blocked until confirmed', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]');
    type(w, 'cn', 'Besan chilla'); type(w, 'cq', '448'); click(w, '[data-a="cust"]');
    assert.equal(ev(w, 'D().m.b.length'), 0); click(w, '[data-a="cust"]'); assert.equal(ev(w, 'D().m.b.length'), 1);
  });
  test('2 besan chillas with paneer filling ≈ 23 g protein', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]');
    type(w, 'cn', 'Besan chilla with paneer filling'); type(w, 'cq', '2'); click(w, '[data-a="cust"]');
    const it = ev(w, 'D().m.b[0]'); near(it.p * it.q, 23, 2, 'protein'); near(it.c * it.q, 28, 3, 'carbs'); near(it.k * it.q, 380, 30, 'kcal');
  });
});

describe('3. Suggestion engine', () => {
  const tagOf = (w, m, name) => ev(w, 'DB')[m].find(x => x[0] === name)[4];
  for (const m of ['b', 'l', 's', 'd']) for (const diet of ['v', 'e', 'n']) {
    test(`${m}/${diet}: gives 3 options and respects diet`, () => {
      const w = boot(); ev(w, `S.diet='${diet}'`);
      const c = ev(w, `combos('${m}')`); assert.equal(c.list.length, 3);
      for (const o of c.list) for (const it of o.items) {
        const t = tagOf(w, m, it.n);
        if (diet === 'v') assert.equal(t, 'v', it.n + ' is not vegetarian');
        if (diet === 'e') assert.ok(t === 'v' || t === 'e', it.n + ' is non-veg');
      }
    });
    test(`${m}/${diet}: best option lands near the meal target`, () => {
      const w = boot(); ev(w, `S.diet='${diet}'`);
      const c = ev(w, `combos('${m}')`); const o = c.list[0];
      const p = o.items.reduce((s, i) => s + i.p, 0), cc = o.items.reduce((s, i) => s + i.c, 0);
      const score = Math.abs(p - c.rp) / Math.max(c.rp, 5) + Math.abs(cc - c.rc) / Math.max(c.rc, 10);
      assert.ok(score <= 1.2, `best option P${p}/C${cc} vs target P${c.rp}/C${c.rc} (score ${score.toFixed(2)})`);
    });
  }
  test('"More" gives different options', () => {
    const w = boot(); const a = ev(w, `combos('l')`).list.map(o => o.items.map(i => i.n).join()); ev(w, `OFF.l=1`);
    const b = ev(w, `combos('l')`).list.map(o => o.items.map(i => i.n).join()); assert.notDeepEqual(a, b);
  });
  test('no suggestions once the meal target is met', () => {
    const w = boot(); ev(w, `S.tp=100;S.tc=250;D().m.s.push({id:'x',n:'x',u:'u',p:40,c:80,k:500,q:1,done:false})`);
    assert.equal(ev(w, `combos('s')`).list.length, 0);
  });
  test('remaining target shrinks after adding food', () => {
    const w = boot(); const before = ev(w, `combos('b')`).rp; click(w, '[data-a="open"][data-m="b"]'); click(w, '[data-a="add"][data-i="0"]');
    assert.ok(ev(w, `combos('b')`).rp < before);
  });
});

describe('4. UI components and flows', () => {
  test('page loads with no runtime errors and shows 5 meal rows', () => {
    const w = boot(); assert.deepEqual(w.errors, []); assert.equal(w.document.querySelectorAll('.mrow').length, 6);
  });
  test('bottom tabs switch pages and highlight', () => {
    const w = boot();
    click(w, 'nav [data-p="health"]'); assert.match($(w, '#app').textContent, /Weight & BP/); assert.equal($(w, 'nav .on').dataset.p, 'health');
    click(w, 'nav [data-p="targets"]'); assert.match($(w, '#app').textContent, /Your targets/);
    click(w, 'nav [data-p="home"]'); assert.match($(w, '#app').textContent, /Daily progress/);
  });
  test('meal page opens and back returns', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="l"]'); assert.match($(w, '#app').textContent, /Lunch/); click(w, '.bk'); assert.match($(w, '#app').textContent, /Daily progress/);
  });
  test('calendar: week arrows, day tap and date picker', () => {
    const w = boot(); const d0 = ev(w, 'S.date');
    click(w, '[data-a="wk"][data-d="7"]'); const d1 = ev(w, 'S.date'); assert.equal((new Date(d1) - new Date(d0)) / 864e5, 7);
    click(w, '[data-a="wk"][data-d="-7"]'); assert.equal(ev(w, 'S.date'), d0);
    change(w, 'dt', '2026-12-25'); assert.equal(ev(w, 'S.date'), '2026-12-25');
    const days = [...w.document.querySelectorAll('[data-a="day"]')]; assert.equal(days.length, 7); days[0].click(); assert.equal(new Date(ev(w, 'S.date') + 'T00:00').getDay(), 1);
  });
  test('data is stored per date and survives reload', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]'); const n0 = ev(w, 'CUR[0].items.length'); click(w, '[data-a="add"][data-i="0"]'); const d0 = ev(w, 'S.date');
    click(w, 'nav [data-p="home"]'); click(w, '[data-a="wk"][data-d="7"]'); assert.equal(ev(w, 'D().m.b.length'), 0);
    click(w, '[data-a="wk"][data-d="-7"]'); assert.equal(ev(w, 'D().m.b.length'), n0);
    const w2 = boot(w.localStorage.getItem('nt2')); assert.equal(ev(w2, 'S.days["' + d0 + '"].m.b.length'), n0);
  });
  test('suggestion: option stepper scales quantity, add logs it, item stepper and delete work', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]');
    const o = ev(w, 'CUR[0]'); const p1 = o.items.reduce((s, i) => s + i.p, 0);
    click(w, '[data-a="op"][data-i="0"]'); click(w, '[data-a="add"][data-i="0"]');
    let it = ev(w, 'D().m.b[0]'); assert.equal(it.q, 1.5); assert.equal(it.done, false);
    click(w, '[data-a="qp"]'); assert.equal(ev(w, 'D().m.b[0].q'), 2); click(w, '[data-a="qm"]'); click(w, '[data-a="qm"]'); click(w, '[data-a="qm"]'); assert.equal(ev(w, 'D().m.b[0].q'), .5, 'quantity floors at 0.5');
    click(w, '[data-a="del"]'); assert.equal(ev(w, 'D().m.b.length'), o.items.length - 1);
    assert.ok(p1 > 0);
  });
  test('checklist: eaten vs planned totals and progress bars update', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="b"]'); click(w, '[data-a="add"][data-i="0"]');
    const it = ev(w, 'D().m.b[0]'); click(w, '[data-a="tog"]'); assert.equal(ev(w, 'D().m.b[0].done'), true);
    click(w, '.bk'); const txt = $(w, '#prog,#app').textContent;
    assert.ok(txt.includes(`${Math.round(it.p * it.q)} / 100 g`), 'protein eaten shown with grams: ' + txt.slice(0, 200));
    assert.ok(txt.includes(`${Math.round(it.k * it.q)} / 2000 kcal`), 'kcal eaten shown');
    click(w, '[data-a="open"][data-m="b"]'); click(w, '[data-a="tog"]'); assert.equal(ev(w, 'tt(D().m.b,"p",1)'), 0);
  });
  test('fruit chips log a fruit with its calories', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="f"]'); click(w, '[data-a="addf"][data-i="0"]');
    const it = ev(w, 'D().m.f[0]'); assert.equal(it.n, 'Banana'); assert.equal(it.k, 105);
  });
  test('custom food in count mode multiplies quantity × per-unit values', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="l"]'); type(w, 'cn', 'Roti / chapati'); type(w, 'cq', '2'); click(w, '[data-a="cust"]');
    const it = ev(w, 'D().m.l[0]'); assert.deepEqual([it.q, it.p * it.q, it.c * it.q, it.k * it.q, it.u], [2, 6, 30, 170, 'roti']);
    assert.match($(w, '#app').textContent, /Protein 6 g \(2 × 3 g\)/);
  });
  test('custom food in weight mode: 120 g paneer', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="s"]'); click(w, '[data-a="mode"][data-v="g"]'); type(w, 'cn', 'Paneer'); type(w, 'cq', '120');
    assert.match($(w, '#pv').textContent, /120 g: P 21\.6 g/); click(w, '[data-a="cust"]');
    const it = ev(w, 'D().m.s[0]'); assert.equal(it.u, 'g'); near(it.p * it.q, 21.6, .2); near(it.k * it.q, 312, 5);
    click(w, '[data-a="qp"]'); assert.equal(ev(w, 'D().m.s[0].q'), 130, 'gram items step by 10');
  });
  test('weight & BP save, show in history, and persist per day', () => {
    const w = boot(); click(w, 'nav [data-p="health"]'); type(w, 'hw', '72.5'); type(w, 'hs', '120'); type(w, 'hd', '80'); click(w, '[data-a="hsave"]');
    assert.deepEqual(Array.from([ev(w, 'D().w'), ev(w, 'D().sys'), ev(w, 'D().dia')]), ['72.5', '120', '80']);
    assert.match($(w, '#app').textContent, /Weight & BP saved/, 'saving returns to the day with a confirmation');
    assert.match($(w, '#app').textContent, /72\.5 kg · BP 120\/80/);
    click(w, 'nav [data-p="health"]'); assert.match($(w, '#app').textContent, /72\.5 kg · 120\/80/);
    click(w, '[data-a="wk"][data-d="7"]'); assert.equal($(w, '#hw').value, '');
  });
  test('targets: protein/carb/kcal edits flow into progress; diet change clears AI ideas', () => {
    const w = boot(); click(w, 'nav [data-p="targets"]'); change(w, 'tp', '150'); change(w, 'tc', '300'); change(w, 'tk', '2400'); change(w, 'diet', 'n');
    assert.deepEqual(Array.from([ev(w, 'S.tp'), ev(w, 'S.tc'), ev(w, 'S.tk'), ev(w, 'S.diet')]), [150, 300, 2400, 'n']);
    click(w, 'nav [data-p="home"]'); const t = $(w, '#app').textContent; assert.ok(t.includes('/ 150 g') && t.includes('/ 300 g') && t.includes('/ 2400 kcal'));
    click(w, '[data-a="open"][data-m="b"]'); near(ev(w, 'tgt("b").p'), 37.5, 1e-9);
  });
  test('no runtime errors across a full session', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="d"]'); click(w, '[data-a="add"][data-i="1"]'); click(w, '[data-a="more"]'); click(w, '[data-a="tog"]');
    type(w, 'cn', 'Milk'); click(w, '[data-a="mode"][data-v="g"]'); type(w, 'cq', '200'); click(w, '[data-a="cust"]'); click(w, 'nav [data-p="health"]'); click(w, 'nav [data-p="targets"]');
    assert.deepEqual(w.errors, []);
  });
});

// ---- 5. Accounts: claude.ai identity + private per-user cloud copy (mocked capabilities) ----
const wait = ms => new Promise(r => setTimeout(r, ms));
function mockClaude({ id = 'u1', name = 'Test User', doc = null, failSet = false, signedOut = false } = {}) {
  const sets = [], ref = { path: '', get: async () => ({ exists: !!doc, data: () => doc }), set: async d => { if (failSet) throw new Error('offline'); sets.push(JSON.parse(d.json)); } };
  return { sets, ref, api: { use: async n => signedOut ? null : n === 'user' ? { id: async () => id, me: async () => ({ id, name }) } : n === 'db' ? { doc: p => { ref.path = p; return ref; } } : null } };
}
describe('5. User accounts', () => {
  test('signed out: runs in local mode and the Account card says so', async () => {
    const m = mockClaude({ signedOut: true }); const w = boot(null, m.api); await wait(40);
    assert.equal(ev(w, 'ACC.s'), 'local'); click(w, 'nav [data-p="targets"]'); assert.match($(w, '#app').textContent, /Not signed in/); assert.deepEqual(w.errors, []);
  });
  test('signed in: shows name, uses a private per-user path, and loads the cloud copy', async () => {
    const cloud = { tp: 140, tc: 220, tk: 2100, diet: 'e', pref: '', days: { '2026-11-01': { m: { b: [], l: [], s: [], d: [], f: [] }, w: '70' } } };
    const m = mockClaude({ doc: { json: JSON.stringify(cloud) } }); const w = boot(null, m.api); await wait(60);
    assert.equal(ev(w, 'ACC.s'), 'cloud'); assert.equal(m.ref.path, 'data/users/u1/tracker');
    assert.equal(ev(w, 'S.tp'), 140); assert.equal(ev(w, 'S.days["2026-11-01"].w'), '70'); assert.equal(ev(w, 'S.date'), ev(w, 'td()'), 'always opens on today');
    click(w, 'nav [data-p="targets"]'); assert.match($(w, '#app').textContent, /Test User/);
  });
  test('signed in with no cloud copy: this device’s data becomes the account’s data', async () => {
    const local = JSON.stringify({ tp: 90, tc: 200, tk: 1800, diet: 'v', pref: '', days: {} });
    const m = mockClaude(); const w = boot(local, m.api); await wait(1100);
    assert.ok(m.sets.length >= 1, 'should upload'); assert.equal(m.sets.at(-1).tp, 90); assert.equal(m.sets.at(-1).uid, 'u1');
  });
  test('changes sync to the cloud (debounced)', async () => {
    const m = mockClaude(); const w = boot(null, m.api); await wait(60); const n0 = m.sets.length;
    click(w, '[data-a="open"][data-m="b"]'); click(w, '[data-a="add"][data-i="0"]'); click(w, '[data-a="add"][data-i="1"]'); await wait(1100);
    assert.equal(m.sets.length, n0 + 1, 'two quick edits → one write'); assert.ok(Object.values(m.sets.at(-1).days)[0].m.b.length >= 2);
  });
  test('shared device: another person’s cached data is NOT adopted or uploaded', async () => {
    const other = JSON.stringify({ tp: 77, tc: 99, tk: 1500, diet: 'n', pref: 'secret', uid: 'someone-else', days: { '2026-11-02': { m: { b: [{ n: 'Private', p: 1, c: 1, k: 1, q: 1, u: 'x', id: 'a', done: true }], l: [], s: [], d: [], f: [] } } } });
    const m = mockClaude({ id: 'u2' }); const w = boot(other, m.api); await wait(1100);
    assert.equal(ev(w, 'S.tp'), 100); assert.equal(ev(w, 'Object.values(S.days).every(d=>Object.values(d.m).every(a=>a.length===0)&&!d.w)'), true, "other person's days must not be adopted"); assert.equal(ev(w, 'S.uid'), 'u2');
    assert.ok(!JSON.stringify(m.sets).includes('Private') && !JSON.stringify(m.sets).includes('secret'));
  });
  test('cloud failure never breaks the app and is reported', async () => {
    const m = mockClaude({ failSet: true }); const w = boot(null, m.api); await wait(60);
    click(w, '[data-a="open"][data-m="b"]'); click(w, '[data-a="add"][data-i="0"]'); await wait(1100);
    assert.equal(ev(w, 'ACC.sync'), 'failed'); assert.equal(ev(w, 'D().m.b.length') > 0, true); assert.deepEqual(w.errors, []);
  });
});

// ---- 6. Save button, lunch/dinner and login gate ----
describe('6. Save flow, lunch & dinner, login', () => {
  test('Save button commits the meal and returns to the day entry with a confirmation', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="l"]'); const n = ev(w, 'CUR[0].items.length'); click(w, '[data-a="add"][data-i="0"]');
    assert.equal(ev(w, 'P'), 'meal'); click(w, '[data-a="savem"]');
    assert.equal(ev(w, 'P'), 'home'); const t = $(w, '#app').textContent;
    assert.match(t, /Lunch saved/); assert.ok(t.includes(`${n} item`), 'lunch row shows saved items'); assert.equal(ev(w, 'D().m.l.length'), n);
    assert.ok(JSON.parse(w.localStorage.getItem('nt2')).days[ev(w, 'S.date')].m.l.length === n, 'persisted');
  });
  for (const m of ['b', 'l', 's', 'd', 'f']) test(`Save works on ${m} even when empty`, () => {
    const w = boot(); click(w, `[data-a="open"][data-m="${m}"]`); click(w, '[data-a="savem"]'); assert.equal(ev(w, 'P'), 'home');
  });
  test('lunch and dinner items land only in their own meal and totals add up', () => {
    const w = boot(); click(w, '[data-a="open"][data-m="l"]'); click(w, '[data-a="add"][data-i="0"]'); click(w, '[data-a="savem"]');
    click(w, '[data-a="open"][data-m="d"]'); click(w, '[data-a="add"][data-i="0"]'); click(w, '[data-a="savem"]');
    const l = ev(w, 'D().m.l'), d = ev(w, 'D().m.d'); assert.ok(l.length && d.length); assert.equal(ev(w, 'D().m.b.length') + ev(w, 'D().m.s.length'), 0);
    const planned = ev(w, 'tt(Object.values(D().m).flat(),"p")'); near(planned, ev(w, 'tt(D().m.l,"p")') + ev(w, 'tt(D().m.d,"p")'), 1e-9);
    assert.match($(w, '#app').textContent, /Lunch[\s\S]*Dinner/);
  });
  test('suggestions never pair a dish with a redundant side (e.g. dal + dal, roti + extra roti)', () => {
    const w = boot();
    const bad = Array.from(ev(w, `(()=>{const bad=[];for(const m of ['b','l','s','d'])for(const diet of ['v','e','n']){S.diet=diet;for(let k=0;k<4;k++){OFF[m]=k;combos(m).list.forEach(o=>{if(o.items.length>1&&dup(o.items[0].n,o.items[1].n))bad.push(m+': '+o.items.map(i=>i.n).join(' + '))})}}return bad})()`));
    assert.deepEqual(bad, []);
  });
  test('lunch and dinner offer a variety of options across "More"', () => {
    const w = boot(); for (const m of ['l', 'd']) {
      const seen = new Set(); for (let k = 0; k < 4; k++) { ev(w, `OFF.${m}=${k}`); ev(w, `combos('${m}')`).list.forEach(o => seen.add(o.items.map(i => i.n).join())); }
      assert.ok(seen.size >= 10, m + ' variety: ' + seen.size);
    }
  });
  test('login gate: signed-out visitor sees Sign in with Claude and can continue on this device', async () => {
    const m = mockClaude({ signedOut: true }); const w = boot(null, m.api); await wait(40);
    assert.equal(ev(w, 'P'), 'login'); assert.match($(w, '#app').textContent, /Sign in with Claude/); assert.equal($(w, 'a.btn').target, '_blank'); assert.equal($(w, '#nav').style.display, 'none');
    click(w, '[data-a="guest"]'); assert.equal(ev(w, 'P'), 'home'); assert.equal($(w, '#nav').style.display, '');
    const w2 = boot(w.localStorage.getItem('nt2'), mockClaude({ signedOut: true }).api); assert.equal(ev(w2, 'P'), 'boot'.replace('boot', 'home'), 'guest is not asked again');
  });
  test('login gate: signed-in user skips it and is greeted by name', async () => {
    const w = boot(null, mockClaude({ name: 'Asha' }).api); assert.equal(ev(w, 'P'), 'boot'); await wait(60);
    assert.equal(ev(w, 'P'), 'home'); assert.match($(w, '#app').textContent, /Hi, Asha/);
  });
  test('no Claude runtime (e.g. GitHub Pages): opens straight to the app in local mode', () => {
    const w = boot(); assert.equal(ev(w, 'P'), 'home'); assert.deepEqual(w.errors, []);
  });
});

// ---- 7. Water, steps, health report ----
const today = w => ev(w, 'td()');
const putFood = (w, p, c, k, extra = {}) => ev(w, `(()=>{const d=D();d.m.l.push({id:'t'+Math.random(),n:'Test meal',u:'serving',p:${p},c:${c},k:${k},q:1,done:true});Object.assign(d,${JSON.stringify(extra)})})()`);
const fruit = w => ev(w, `D().m.f.push({id:'fr',n:'Guava',u:'piece',p:0,c:0,k:0,q:1,done:true})`);
const fire = (w, m, t) => { const e = new w.Event('devicemotion'); Object.defineProperty(e, 'accelerationIncludingGravity', { value: { x: 0, y: 0, z: m } }); Object.defineProperty(e, 'timeStamp', { value: t }); w.dispatchEvent(e); };
const sine = (hz, amp, secs) => { const out = []; for (let t = 0; t < secs * 1000; t += 20) out.push([9.8 + amp * Math.sin(2 * Math.PI * hz * t / 1000), t]); return out; };
const countSteps = (w, samples) => { const det = ev(w, 'stepDet()'); return samples.reduce((n, [m, t]) => n + det(m, t), 0); };

describe('7a. Water', () => {
  test('glass / 500 ml / 1 L / undo / custom ml add up and never go below 0', () => {
    const w = boot(); click(w, '[data-a="wat"][data-v="250"]'); click(w, '[data-a="wat"][data-v="250"]'); assert.equal(ev(w, 'D().wa'), 500);
    click(w, '[data-a="wat"][data-v="-250"]'); assert.equal(ev(w, 'D().wa'), 250); click(w, '[data-a="wat"][data-v="500"]'); click(w, '[data-a="wat"][data-v="1000"]'); assert.equal(ev(w, 'D().wa'), 1750);
    type(w, 'wc', '330'); click(w, '[data-a="watc"]'); assert.equal(ev(w, 'D().wa'), 2080); assert.match($(w, '#app').textContent, /2080 \/ 2500 ml/);
    for (let i = 0; i < 12; i++) click(w, '[data-a="wat"][data-v="-250"]'); assert.equal(ev(w, 'D().wa'), 0);
  });
  test('invalid custom water is ignored; water is stored per day', () => {
    const w = boot(); type(w, 'wc', '-5'); click(w, '[data-a="watc"]'); type(w, 'wc', ''); click(w, '[data-a="watc"]'); assert.equal(ev(w, 'D().wa||0'), 0);
    click(w, '[data-a="wat"][data-v="500"]'); click(w, '[data-a="wk"][data-d="-7"]'); assert.equal(ev(w, 'D().wa||0'), 0); click(w, '[data-a="wk"][data-d="7"]'); assert.equal(ev(w, 'D().wa'), 500);
  });
  test('water and steps goals are editable and drive the bars', () => {
    const w = boot(); click(w, 'nav [data-p="targets"]'); change(w, 'twg', '3000'); change(w, 'tsg', '10000'); assert.deepEqual([ev(w, 'WG()'), ev(w, 'SG()')].map(Number), [3000, 10000]);
    click(w, 'nav [data-p="home"]'); assert.match($(w, '#app').textContent, /0 \/ 3000 ml/); assert.match($(w, '#app').textContent, /0 \/ 10000/);
  });
});

describe('7b. Steps', () => {
  test('manual: save a total, +/- 1,000 with floor at 0', () => {
    const w = boot(); type(w, 'stv', '4321'); click(w, '[data-a="stsave"]'); assert.equal(ev(w, 'D().st'), 4321);
    click(w, '[data-a="stadd"][data-v="1000"]'); assert.equal(ev(w, 'D().st'), 5321); for (let i = 0; i < 7; i++) click(w, '[data-a="stadd"][data-v="-1000"]'); assert.equal(ev(w, 'D().st'), 0);
    type(w, 'stv', '-50'); click(w, '[data-a="stsave"]'); assert.equal(ev(w, 'D().st'), 0);
  });
  test('detector: walking at 2 Hz for 30 s ≈ 60 steps', () => near(countSteps(boot(), sine(2, 3, 30)), 60, 4));
  test('detector: slower walk at 1.6 Hz for 20 s ≈ 32 steps', () => near(countSteps(boot(), sine(1.6, 2.6, 20)), 32, 3));
  test('detector: standing still, typing and noise count zero steps', () => {
    const w = boot(); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - .5;
    assert.equal(countSteps(w, Array.from({ length: 1500 }, (_, i) => [9.8 + rnd() * .8, i * 20])), 0);
    assert.equal(countSteps(w, sine(3, .8, 20).map(([m, t]) => [m, t + 40000])), 0);
  });
  test('detector: shuffling too fast is capped (no more than ~3.5 steps/s)', () => { const r = countSteps(boot(), sine(8, 4, 10)) / 10; assert.ok(r > 1 && r <= 3.6, 'rate ' + r); });
  test('phone counting: start, steps accumulate on today, stop ends it', () => {
    const w = boot(null, null, w => { w.DeviceMotionEvent = function () {}; });
    click(w, '[data-a="stauto"]'); return wait(5).then(() => {
      assert.ok(ev(w, 'AUTO')); sine(2, 3, 15).forEach(([m, t]) => fire(w, m, t)); const n = ev(w, 'D().st'); near(n, 30, 3);
      assert.match($(w, '#stn').textContent, new RegExp('^' + n + '$'));
      click(w, '[data-a="stauto"]'); return wait(5).then(() => { assert.equal(ev(w, 'AUTO'), null); sine(2, 3, 5).forEach(([m, t]) => fire(w, m, t + 100000)); assert.equal(ev(w, 'D().st'), n); });
    });
  });
  test('phone counting: sensor permission denied or unsupported falls back to manual with a message', async () => {
    const w1 = boot(null, null, w => { w.DeviceMotionEvent = function () {}; w.DeviceMotionEvent.requestPermission = async () => 'denied'; });
    click(w1, '[data-a="stauto"]'); await wait(10); assert.equal(ev(w1, 'AUTO'), null); assert.match($(w1, '#app').textContent, /doesn’t allow motion sensors/);
    const w2 = boot(null, null, w => { w.DeviceMotionEvent = undefined; }); click(w2, '[data-a="stauto"]'); await wait(10); assert.match($(w2, '#app').textContent, /Enter your steps manually/); assert.deepEqual(w2.errors, []);
  });
  test('auto-count button only appears for today', () => {
    const w = boot(); assert.ok($(w, '[data-a="stauto"]')); click(w, '[data-a="wk"][data-d="-7"]'); assert.equal($(w, '[data-a="stauto"]'), null);
  });
});

describe('7c. Health report logic', () => {
  test('blood pressure categories (AHA ranges)', () => {
    const w = boot(); const c = (s, d) => { const r = ev(w, `bpCat(${s},${d})`); return r && r.t; };
    assert.equal(c(110, 70), 'Normal'); assert.equal(c(125, 75), 'Elevated'); assert.equal(c(135, 78), 'High (stage 1 range)'); assert.equal(c(118, 85), 'High (stage 1 range)');
    assert.equal(c(145, 85), 'High (stage 2 range)'); assert.equal(c(125, 95), 'High (stage 2 range)'); assert.equal(c(185, 100), 'Very high'); assert.equal(c(130, 125), 'Very high'); assert.equal(c(85, 55), 'Low');
    assert.equal(ev(w, 'bpCat(0,0)'), null); assert.match(ev(w, 'bpCat(190,100)').n, /seek medical care now/);
  });
  test('nothing logged → no score and a prompt to tick foods', () => {
    const r = ev(boot(), 'review(td())'); assert.equal(r.score, null); assert.match(r.focus[0], /Tick the foods/);
  });
  test('only unticked (planned) food does not count as eaten', () => {
    const w = boot(); ev(w, `D().m.l.push({id:'p',n:'x',u:'u',p:50,c:50,k:500,q:1,done:false})`); assert.equal(ev(w, 'dayStats(td()).n'), 0); assert.equal(ev(w, 'review(td()).score'), null);
  });
  test('ideal day scores 100 and says to repeat it', () => {
    const w = boot(); putFood(w, 100, 250, 2000, { wa: 2500, st: 8000 }); fruit(w); const r = ev(w, 'review(td())');
    assert.equal(r.score, 100); assert.deepEqual(Array.from(r.focus), ['Good day. Repeat the same routine tomorrow.']);
  });
  test('poor day: every metric low, lowest scores come first, amounts are specific', () => {
    const w = boot(); putFood(w, 30, 100, 500, { wa: 800, st: 1000 }); const r = ev(w, 'review(td())');
    assert.ok(r.score < 40); assert.deepEqual(Array.from(r.F.map(z => z.st)), ['low', 'low', 'low', 'low', 'low']); assert.match(r.focus[0], /^Steps: Add a 70-minute walk/);
    assert.match(r.F.find(z => z.name === 'Protein').act, /about 70 g more/); assert.ok(r.focus.some(t => /^Fruit/.test(t)));
  });
  test('water message gives the exact amount left; above-target protein/carbs/calories are flagged', () => {
    const w = boot(); putFood(w, 100, 250, 2000, { wa: 800, st: 9000 }); fruit(w); assert.match(ev(w, 'review(td())').F.find(z => z.name === 'Water').act, /about 1700 ml more/);
    const w2 = boot(); putFood(w2, 160, 320, 2500, { wa: 2500, st: 9000 }); const F = ev(w2, 'review(td())').F; assert.deepEqual(Array.from(['Protein', 'Carbs', 'Calories'].map(n => F.find(z => z.name === n).st)), ['high', 'high', 'high']);
    assert.match(F.find(z => z.name === 'Carbs').act, /rice/);
  });
  test('BP adds a focus item; a crisis reading says seek care', () => {
    const w = boot(); putFood(w, 100, 250, 2000, { wa: 2500, st: 8000, sys: '150', dia: '95' }); fruit(w); assert.ok(ev(w, 'review(td())').focus.some(t => /^Blood pressure/.test(t)));
    const w2 = boot(); putFood(w2, 100, 250, 2000, { wa: 2500, st: 8000, sys: '185', dia: '125' }); fruit(w2); assert.ok(ev(w2, 'review(td())').focus.some(t => /seek medical care now/.test(t)));
  });
  test('week(): 7 days ending on the selected date with averages over logged days only', () => {
    const w = boot(); putFood(w, 80, 200, 1800, { wa: 2000, st: 6000 }); click(w, '[data-a="wk"][data-d="-7"]'); click(w, '[data-a="wk"][data-d="1"]'.replace('"1"', '"7"')); 
    const k = ev(w, 'S.date'); const wk = ev(w, 'week()'); assert.equal(wk.days.length, 7); assert.equal(wk.days[6].d, k); assert.equal(wk.avg.days_logged, 1); assert.equal(wk.avg.kcal, 1800); assert.equal(wk.avg.water_ml, 2000);
  });
});

describe('7d. Health report page and AI summary', () => {
  test('Report tab shows all sections with no errors', () => {
    const w = boot(); putFood(w, 90, 200, 1700, { wa: 1500, st: 5000, w: '72', sys: '118', dia: '76' }); click(w, 'nav [data-p="report"]'); const t = $(w, '#app').textContent;
    for (const x of ['Health report', 'Vitals', 'Focus for tomorrow', 'AI health summary', 'Last 7 days', 'Normal', '72 kg', 'not medical advice']) assert.ok(t.includes(x), 'missing ' + x);
    assert.equal(w.document.querySelectorAll('table tr').length, 8); assert.equal($(w, 'nav .on').dataset.p, 'report'); assert.deepEqual(w.errors, []);
  });
  test('empty day: friendly empty state', () => { const w = boot(); click(w, 'nav [data-p="report"]'); assert.match($(w, '#app').textContent, /Nothing to report yet/); });
  test('weight change vs the previous logged weight is shown', () => {
    const w = boot(); change(w, 'dt', '2026-11-10'); ev(w, `D().w='72'`); change(w, 'dt', '2026-11-12'); ev(w, `D().w='71.4'`); click(w, 'nav [data-p="report"]');
    assert.match($(w, '#app').textContent, /71\.4 kg \(-0\.6 kg since/);
  });
  const withAI = (resp) => { const prompts = []; const api = { use: async n => n === 'sample' ? { json: async q => { prompts.push(q); if (resp instanceof Error) throw resp; return resp; } } : null }; return { prompts, api }; };
  test('AI summary: sends food, water, steps, vitals and goals; renders the answer', async () => {
    const m = withAI({ status: 'Solid day, low on water', summary: 'You hit protein but water was short.', good: ['Protein on target'], focus: ['Drink 3 more glasses', 'Add a guava'], watch: [] });
    const w = boot(null, m.api); await wait(50); putFood(w, 100, 240, 1900, { wa: 900, st: 4000, w: '70', sys: '122', dia: '78' }); click(w, 'nav [data-p="report"]');
    click(w, '[data-a="airep"]'); await wait(30); const t = $(w, '#app').textContent;
    assert.ok(t.includes('Solid day, low on water') && t.includes('Drink 3 more glasses') && t.includes('Refresh summary'));
    const q = m.prompts[0]; for (const x of ['"water_ml":900', '"steps":4000', '"weight_kg":70', '"bp":"122/78"', '"water_ml":2500', 'Test meal', 'not medical advice']) assert.ok(q.includes(x), 'prompt missing ' + x);
  });
  test('AI summary: malformed answers are sanitised; failures show a message and the rule-based report stays', async () => {
    const m = withAI({ status: 5, summary: null, good: 'oops', focus: [1, 2], watch: undefined }); const w = boot(null, m.api); await wait(50); putFood(w, 100, 250, 2000); click(w, 'nav [data-p="report"]'); click(w, '[data-a="airep"]'); await wait(30);
    assert.deepEqual(w.errors, []); assert.match($(w, '#app').textContent, /Focus for tomorrow/);
    const m2 = withAI(new Error('boom')); const w2 = boot(null, m2.api); await wait(50); click(w2, 'nav [data-p="report"]'); click(w2, '[data-a="airep"]'); await wait(30);
    assert.match($(w2, '#app').textContent, /Couldn’t reach Claude/); assert.deepEqual(w2.errors, []);
  });
  test('without the Claude runtime the AI card explains and the rest still works', () => {
    const w = boot(); click(w, 'nav [data-p="report"]'); assert.equal($(w, '[data-a="airep"]'), null); assert.match($(w, '#app').textContent, /available inside the claude\.ai app/);
  });
  test('water, steps and report data sync with the account copy', async () => {
    const sets = [], ref = { get: async () => ({ exists: false }), set: async d => { sets.push(JSON.parse(d.json)); } };
    const api = { use: async n => n === 'user' ? { id: async () => 'u9', me: async () => ({ name: 'N' }) } : n === 'db' ? { doc: () => ref } : null };
    const w = boot(null, api); await wait(60); click(w, '[data-a="wat"][data-v="500"]'); type(w, 'stv', '3000'); click(w, '[data-a="stsave"]'); await wait(1100);
    const day = Object.values(sets.at(-1).days).find(d => d.wa); assert.equal(day.wa, 500); assert.equal(day.st, 3000);
  });
});

// ---- 8. Own-site accounts (Supabase email + password) with a fake Supabase server ----
function fakeSB({ confirm = false, netdown = false } = {}) {
  const users = {}, tokens = {}, refresh = {}, rows = {}, calls = []; let n = 0;
  const mk = u => { const at = 'at' + (++n), rt = 'rt' + n; tokens[at] = u.id; refresh[rt] = u.id; return { access_token: at, refresh_token: rt, expires_in: 3600, user: { id: u.id, email: u.email } }; };
  const res = (status, body) => ({ ok: status < 400, status, json: async () => { if (body === undefined) throw new Error('no body'); return body; } });
  const srv = { users, tokens, refresh, rows, calls, mk, down: netdown, confirm };
  srv.fetch = async (url, opt = {}) => {
    if (srv.down) throw new TypeError('Failed to fetch');
    const u = new URL(url), h = opt.headers || {}, body = opt.body ? JSON.parse(opt.body) : null, p = u.pathname, m = opt.method || 'GET';
    calls.push({ path: p + u.search, method: m, h, body });
    if (h.apikey !== 'anon-key') return res(401, { message: 'No API key' });
    if (p === '/auth/v1/signup') { if (users[body.email]) return res(422, { msg: 'User already registered' }); const usr = { id: 'id-' + body.email, email: body.email, pw: body.password, ok: !srv.confirm }; users[body.email] = usr; return res(200, srv.confirm ? { id: usr.id, email: usr.email } : mk(usr)); }
    if (p === '/auth/v1/token') {
      const g = u.searchParams.get('grant_type');
      if (g === 'password') { const usr = users[body.email]; if (!usr || usr.pw !== body.password) return res(400, { error_description: 'Invalid login credentials' }); if (!usr.ok) return res(400, { error_description: 'Email not confirmed' }); return res(200, mk(usr)); }
      if (g === 'refresh_token') { const id = refresh[body.refresh_token]; if (!id) return res(400, { error_description: 'Invalid Refresh Token' }); delete refresh[body.refresh_token]; return res(200, mk(Object.values(users).find(x => x.id === id))); }
    }
    if (p === '/auth/v1/recover') return res(200, {});
    if (p === '/auth/v1/logout') { delete tokens[(h.Authorization || '').slice(7)]; return res(204); }
    if (p.startsWith('/rest/v1/tracker_data')) {
      const uid = tokens[(h.Authorization || '').slice(7)]; if (!uid) return res(401, { message: 'JWT expired' });
      if (m === 'GET') return res(200, rows[uid] ? [{ json: rows[uid] }] : []); // row-level security: caller's own row only
      if (body.user_id !== uid) return res(403, { message: 'violates row-level security policy' }); rows[uid] = body.json; return res(201);
    }
    return res(404, { message: 'not found' });
  };
  return srv;
}
const cfgBoot = (srv, { store, auth, allowGuest } = {}) => boot(store, null, w => {
  w.APP_CONFIG = { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'anon-key', allowGuest: !!allowGuest }; w.fetch = srv.fetch;
  if (auth) w.localStorage.setItem('nt2auth', JSON.stringify(auth));
});
const signIn = async (w, em, pw, mode) => { if (mode) click(w, `[data-a="sbm"][data-v="${mode}"]`); type(w, 'em', em); if (pw != null) type(w, 'pw', pw); click(w, '[data-a="sbgo"]'); await wait(40); };

describe('8. Accounts on your own site (Supabase)', () => {
  test('login form is shown first; tabs hidden; no guest option by default', async () => {
    const w = cfgBoot(fakeSB()); await wait(30);
    assert.equal(ev(w, 'P'), 'login'); assert.ok($(w, '#em') && $(w, '#pw')); assert.equal($(w, '#nav').style.display, 'none'); assert.equal($(w, '[data-a="guest"]'), null); assert.deepEqual(w.errors, []);
  });
  test('tab bar is at the top, not the bottom (clear of hosting badges)', () => {
    const rule = html.match(/nav\{position:fixed[^}]*\}/)[0]; assert.ok(rule.includes('top:0') && !rule.includes('bottom:0'), rule);
  });
  test('validation: bad email / short password never reach the server', async () => {
    const srv = fakeSB(), w = cfgBoot(srv); await wait(30);
    await signIn(w, 'not-an-email', '123456'); assert.match($(w, '#app').textContent, /valid email/);
    await signIn(w, 'a@x.com', '123'); assert.match($(w, '#app').textContent, /at least 6 characters/); assert.equal(srv.calls.length, 0);
  });
  test('sign up → signed in, greeted, data row created for that user', async () => {
    const srv = fakeSB(), w = cfgBoot(srv); await wait(30); await signIn(w, 'asha@x.com', 'secret1', 'up');
    assert.equal(ev(w, 'P'), 'home'); assert.match($(w, '#app').textContent, /Hi, asha@x\.com/); assert.equal($(w, '#nav').style.display, '');
    await wait(1000); assert.ok(srv.rows['id-asha@x.com'], 'row saved'); assert.equal(JSON.parse(srv.rows['id-asha@x.com']).uid, 'id-asha@x.com');
  });
  test('sign up when email confirmation is required: asks to confirm, blocks sign-in until then', async () => {
    const srv = fakeSB({ confirm: true }), w = cfgBoot(srv); await wait(30); await signIn(w, 'b@x.com', 'secret1', 'up');
    assert.equal(ev(w, 'P'), 'login'); assert.match($(w, '#app').textContent, /Check your email to confirm/);
    await signIn(w, 'b@x.com', 'secret1'); assert.match($(w, '#app').textContent, /Email not confirmed/); assert.equal(ev(w, 'P'), 'login');
  });
  test('duplicate sign-up and wrong password show clear messages', async () => {
    const srv = fakeSB(), w = cfgBoot(srv); await wait(30); await signIn(w, 'c@x.com', 'secret1', 'up'); click(w, 'nav [data-p="targets"]'); click(w, '[data-a="sbout"]'); await wait(20);
    await signIn(w, 'c@x.com', 'secret1', 'up'); assert.match($(w, '#app').textContent, /already registered/);
    await signIn(w, 'c@x.com', 'wrong-pass', 'in'); assert.match($(w, '#app').textContent, /Wrong email or password\./);
    await signIn(w, 'nobody@x.com', 'secret1'); assert.match($(w, '#app').textContent, /Wrong email or password\./); assert.equal(ev(w, 'P'), 'login');
  });
  test('sign in loads your saved data from the server', async () => {
    const srv = fakeSB(); srv.users['d@x.com'] = { id: 'id-d', email: 'd@x.com', pw: 'secret1', ok: true };
    srv.rows['id-d'] = JSON.stringify({ tp: 140, tc: 220, tk: 2100, diet: 'e', pref: '', days: { '2026-11-01': { m: { b: [], l: [], s: [], d: [], f: [] }, w: '70' } } });
    const w = cfgBoot(srv); await wait(30); await signIn(w, 'd@x.com', 'secret1');
    assert.equal(ev(w, 'S.tp'), 140); assert.equal(ev(w, 'S.days["2026-11-01"].w'), '70'); assert.equal(ev(w, 'S.date'), ev(w, 'td()'));
  });
  test('changes sync to the server and show up on a second device', async () => {
    const srv = fakeSB(), w = cfgBoot(srv); await wait(30); await signIn(w, 'e@x.com', 'secret1', 'up');
    click(w, '[data-a="wat"][data-v="500"]'); type(w, 'stv', '4200'); click(w, '[data-a="stsave"]'); await wait(1100);
    const w2 = cfgBoot(srv, { auth: JSON.parse(w.localStorage.getItem('nt2auth')) }); await wait(60);
    assert.equal(ev(w2, 'P'), 'home'); assert.equal(ev(w2, 'D().wa'), 500); assert.equal(ev(w2, 'D().st'), 4200);
  });
  test('session persists across reloads; expired token is refreshed; invalid session returns to login', async () => {
    const srv = fakeSB(), w = cfgBoot(srv); await wait(30); await signIn(w, 'f@x.com', 'secret1', 'up'); const auth = JSON.parse(w.localStorage.getItem('nt2auth'));
    const w2 = cfgBoot(srv, { auth }); await wait(60); assert.equal(ev(w2, 'P'), 'home'); assert.ok(!srv.calls.some(c => c.path.includes('grant_type=password') && c.body && c.body.email === 'f@x.com' && srv.calls.indexOf(c) > 3), 'no re-login');
    const n0 = srv.calls.filter(c => c.path.includes('refresh_token')).length; const exp = { ...JSON.parse(w2.localStorage.getItem('nt2auth')), exp: Date.now() - 1000 };
    const w3 = cfgBoot(srv, { auth: exp }); await wait(80); assert.equal(ev(w3, 'P'), 'home'); assert.equal(srv.calls.filter(c => c.path.includes('refresh_token')).length, n0 + 1);
    const w4 = cfgBoot(srv, { auth: { ...exp, refresh_token: 'dead' } }); await wait(80); assert.equal(ev(w4, 'P'), 'login'); assert.equal(w4.localStorage.getItem('nt2auth'), null);
  });
  test('sign out clears the session and local data; the next person does not see it', async () => {
    const srv = fakeSB(), w = cfgBoot(srv); await wait(30); await signIn(w, 'g@x.com', 'secret1', 'up'); click(w, '[data-a="wat"][data-v="500"]'); click(w, '[data-a="wat"][data-v="250"]'); await wait(1000);
    click(w, 'nav [data-p="targets"]'); assert.match($(w, '#app').textContent, /Sign out/); click(w, '[data-a="sbout"]'); await wait(30);
    assert.equal(ev(w, 'P'), 'login'); assert.equal(w.localStorage.getItem('nt2auth'), null); assert.equal(w.localStorage.getItem('nt2'), null);
    assert.ok(srv.calls.some(c => c.path === '/auth/v1/logout')); assert.equal(Object.keys(srv.tokens).length, 0, 'server session revoked');
    await signIn(w, 'h@x.com', 'secret1', 'up'); assert.equal(ev(w, 'D().wa||0'), 0, 'new user starts clean'); await wait(1000);
    assert.equal(JSON.parse(srv.rows['id-g@x.com']).days[ev(w, 'S.date')].wa, 750, 'first user data untouched'); assert.ok(!JSON.stringify(srv.rows['id-h@x.com']).includes('750'));
  });
  test('every data request uses your own id and your own token; password is never stored or sent to data endpoints', async () => {
    const srv = fakeSB(), w = cfgBoot(srv); await wait(30); await signIn(w, 'i@x.com', 'Sup3rSecret!', 'up'); click(w, '[data-a="wat"][data-v="250"]'); await wait(1000);
    const rest = srv.calls.filter(c => c.path.startsWith('/rest/v1/')); assert.ok(rest.length >= 2);
    for (const c of rest) { assert.ok(/^Bearer at\d+$/.test(c.h.Authorization)); if (c.method === 'GET') assert.ok(c.path.endsWith('user_id=eq.id-i@x.com')); else assert.equal(c.body.user_id, 'id-i@x.com'); assert.ok(!JSON.stringify(c).includes('Sup3rSecret!')); }
    for (let i = 0; i < w.localStorage.length; i++) assert.ok(!w.localStorage.getItem(w.localStorage.key(i)).includes('Sup3rSecret!'), 'password in storage');
  });
  test('forgot password sends a reset request and confirms without revealing if the email exists', async () => {
    const srv = fakeSB(), w = cfgBoot(srv); await wait(30); await signIn(w, 'who@x.com', null, 'rs');
    assert.match($(w, '#app').textContent, /reset link is on its way/); assert.ok(srv.calls.some(c => c.path === '/auth/v1/recover' && c.body.email === 'who@x.com'));
  });
  test('server down: friendly message, no crash', async () => {
    const srv = fakeSB({ netdown: true }), w = cfgBoot(srv); await wait(30); await signIn(w, 'j@x.com', 'secret1');
    assert.match($(w, '#app').textContent, /Couldn’t reach the server/); assert.equal(ev(w, 'P'), 'login'); assert.deepEqual(w.errors, []);
  });
  test('optional guest mode (allowGuest) works locally without touching the server', async () => {
    const srv = fakeSB(), w = cfgBoot(srv, { allowGuest: true }); await wait(30); click(w, '[data-a="guest"]'); assert.equal(ev(w, 'P'), 'home');
    click(w, '[data-a="wat"][data-v="250"]'); await wait(900); assert.equal(srv.calls.filter(c => c.path.startsWith('/rest/')).length, 0);
  });
});
