import './styles/main.css';
import './styles/pages.css';
import { gsap } from 'gsap';
import { initShell, reducedMotion } from './lib/shell';
import { initHeadlines } from './lib/motion';
import { countTo, initPageMotion } from './lib/page';
import { lang, locale, t } from './lib/i18n';

initShell();
initHeadlines();
initPageMotion();

/* ── Public conversion rules ─────────────────────────────────────── */
type Mode = 'air' | 'courier' | 'road' | 'sea';
/** kg charged per cubic metre */
const KG_PER_CBM: Record<Mode, number> = { air: 1e6 / 6000, courier: 1e6 / 5000, road: 333, sea: 1000 };
const RULE: Record<Mode, string> =
  lang === 'nl'
    ? { air: 'IATA 1:6000', courier: 'Koerier 1:5000', road: 'Weg 1 m³ = 333 kg', sea: 'Zee W/M 1 m³ = 1.000 kg' }
    : { air: 'IATA 1:6000', courier: 'Courier 1:5000', road: 'Road 1 m³ = 333 kg', sea: 'Sea W/M 1 m³ = 1,000 kg' };
const QUOTE_MODE: Record<Mode, string> = { air: 'air', courier: 'time-critical', road: 'road', sea: 'ocean' };
const LDM_KG = 1750;
const IN = 2.54;
const LB = 0.45359237;

const num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const fmt = (n: number, d = 0) => n.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });

/* ── Hero cube: takes the proportions of the first line ──────────── */
const cube = document.querySelector<HTMLElement>('[data-cube]');
const cubeDims = document.querySelector<HTMLElement>('[data-cube-dims]');
const cubeKg = document.querySelector<HTMLElement>('[data-cube-kg]');
function shapeCube(l: number, w: number, h: number, kgVol: number, unit: string, factor: string) {
  if (!cube) return;
  const max = Math.max(l, w, h, 1);
  // the longest side takes about half the stage; the faces read these properties
  const size = (cube.parentElement?.clientWidth ?? 320) * 0.46;
  const s = (v: number) => `${(Math.max(0.16, v / max) * size).toFixed(1)}px`;
  cube.style.setProperty('--x', s(l));
  cube.style.setProperty('--y', s(h));
  cube.style.setProperty('--z', s(w));
  if (cubeDims) cubeDims.textContent = `${fmt(l)} × ${fmt(w)} × ${fmt(h)} ${unit}`;
  if (cubeKg) cubeKg.textContent = `${fmt(kgVol, kgVol < 100 ? 1 : 0)} ${unit === 'in' ? 'lb' : 'kg'}`;
  const read = cubeKg?.nextElementSibling;
  if (read) read.textContent = `${t('at', 'bij')} ${factor}`;
}
const spin = document.querySelector<HTMLElement>('[data-cube-spin]');
if (cube && spin && !reducedMotion) {
  // the tilt stays put (so the lid always shows); the box turns on its own axis
  gsap.fromTo(spin, { rotateY: -32 }, { rotateY: 328, duration: 26, ease: 'none', repeat: -1 });
  gsap.fromTo(cube, { rotateX: -18, y: 0 }, { rotateX: -27, y: -8, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

/* ── Tool 1: chargeable weight ───────────────────────────────────── */
function initCalc() {
  const form = document.querySelector<HTMLFormElement>('[data-calc]');
  const list = document.querySelector<HTMLOListElement>('[data-rows]');
  const tpl = document.querySelector<HTMLTemplateElement>('[data-row-tpl]');
  if (!form || !list || !tpl) return;
  let imperial = false;
  let seq = 0;
  const peek = document.querySelector<HTMLElement>('[data-peek]');
  const peekVal = peek?.querySelector<HTMLElement>('[data-peek-val]');
  const peekBasis = peek?.querySelector<HTMLElement>('[data-peek-basis]');
  if (peek) {
    // shown while the pieces are on screen and the result card is not
    let formOn = false;
    let resultOn = false;
    const sync = () => {
      const on = formOn && !resultOn;
      peek.classList.toggle('is-on', on);
      peek.inert = !on;
    };
    peek.inert = true;
    new IntersectionObserver(([e]) => ((formOn = e.isIntersecting), sync()), { rootMargin: '0px 0px -30% 0px' }).observe(list);
    new IntersectionObserver(([e]) => ((resultOn = e.isIntersecting), sync())).observe(form.querySelector('[data-result]')!);
  }
  const out = (k: string) => form.querySelector<HTMLElement>(`[data-out="${k}"]`)!;

  function addRow(v?: { qty?: number; l?: number; w?: number; h?: number; kg?: number }, focus = false) {
    const li = tpl!.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    const id = ++seq;
    li.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      input.id = `r${id}-${input.name}`;
      input.previousElementSibling?.setAttribute('for', input.id);
      const val = v?.[input.name as keyof typeof v];
      if (val !== undefined) input.value = String(val);
    });
    list!.appendChild(li);
    if (!reducedMotion) gsap.from(li, { opacity: 0, y: -10, duration: 0.45, ease: 'power3.out' });
    renumber();
    if (focus) li.querySelector<HTMLInputElement>('[name="l"]')?.focus();
    return li;
  }
  function renumber() {
    const rows = [...list!.children] as HTMLElement[];
    rows.forEach((r, i) => {
      r.querySelector('.row-n')!.textContent = String(i + 1).padStart(2, '0');
      const del = r.querySelector<HTMLButtonElement>('[data-del]')!;
      del.disabled = rows.length === 1;
      del.querySelector('.sr-only')!.textContent = `${t('Remove line', 'Verwijder regel')} ${i + 1}`;
    });
  }

  function compute() {
    const mode = (new FormData(form!).get('mode') as Mode) ?? 'air';
    let pcs = 0;
    let cbm = 0;
    let kg = 0;
    let first: number[] | null = null;
    for (const r of list!.children) {
      const g = (n: string) => num(r.querySelector<HTMLInputElement>(`[name="${n}"]`)!.value);
      const q = Math.max(1, Math.round(g('qty')) || 1);
      const k = imperial ? IN : 1;
      const [l, w, h] = [g('l') * k, g('w') * k, g('h') * k];
      const wt = g('kg') * (imperial ? LB : 1);
      if (l && w && h) {
        cbm += (l * w * h * q) / 1e6;
        first ??= [g('l'), g('w'), g('h')];
      }
      if (l || w || h || wt) pcs += q;
      kg += wt * q;
    }
    const volKg = cbm * KG_PER_CBM[mode];
    let cw = Math.max(kg, volKg);
    // airlines and integrators round up to the next half kilo; road and sea to the kilo
    cw = mode === 'air' || mode === 'courier' ? Math.ceil(cw * 2) / 2 : Math.ceil(cw);
    const toU = (v: number) => (imperial ? v / LB : v);
    const wd = (v: number) => (v < 100 ? 1 : 0);

    countTo(out('cw'), toU(cw), (n) => fmt(n, toU(cw) % 1 && toU(cw) < 1000 ? 1 : 0));
    out('pcs').textContent = fmt(pcs);
    out('cbm').textContent = imperial ? fmt(cbm * 35.3147, 2) : fmt(cbm, 3);
    out('actual').textContent = fmt(toU(kg), wd(toU(kg)));
    out('vol').textContent = fmt(toU(volKg), wd(toU(volKg)));
    out('actual-bar').textContent = fmt(toU(kg));
    out('vol-bar').textContent = fmt(toU(volKg));
    out('rule').textContent = RULE[mode];
    const rt = Math.max(cbm, kg / 1000);
    out('rt').textContent = fmt(rt, 2);

    const basis = form!.querySelector<HTMLElement>('[data-basis]')!;
    const byVol = volKg > kg;
    if (!kg && !cbm) basis.textContent = t('Enter dimensions and weight', 'Vul afmetingen en gewicht in');
    else if (mode === 'sea') basis.textContent = cbm >= kg / 1000 ? `${t('Charged on volume', 'Berekend op volume')}: ${fmt(rt, 2)} ${t('revenue tonnes', 'vrachttonnen')}` : `${t('Charged on weight', 'Berekend op gewicht')}: ${fmt(rt, 2)} ${t('revenue tonnes', 'vrachttonnen')}`;
    else basis.textContent = byVol ? `${t('Charged on volume', 'Berekend op volume')} · ${fmt((volKg / Math.max(kg, 0.001)) * 100 - 100)}% ${t('above actual', 'boven werkelijk')}` : t('Charged on actual weight', 'Berekend op werkelijk gewicht');
    basis.classList.toggle('is-vol', byVol);

    // bars, relative to the larger of the two
    const top = Math.max(kg, volKg, 1);
    const bar = (k: string, v: number, win: boolean) => {
      const el = form!.querySelector<HTMLElement>(`[data-bar="${k}"]`)!;
      el.classList.toggle('is-win', win && v > 0);
      gsap.to(el.querySelector('i'), { scaleX: v / top, duration: reducedMotion ? 0 : 0.7, ease: 'expo.out' });
    };
    bar('actual', kg, !byVol);
    bar('vol', volKg, byVol);

    form!.querySelectorAll<HTMLElement>('.is-sea').forEach((el) => (el.hidden = mode !== 'sea'));
    form!.querySelectorAll<HTMLElement>('[data-fit] li').forEach((li) => {
      const p = cbm / Number(li.dataset.cap);
      li.querySelector('b')!.textContent = `${fmt(Math.min(999, p * 100))}%`;
      li.classList.toggle('is-over', p > 1);
      gsap.to(li.querySelector('i'), { scaleX: Math.min(1, p), duration: reducedMotion ? 0 : 0.7, ease: 'expo.out' });
    });

    if (first) shapeCube(first[0], first[1], first[2], toU(volKg), imperial ? 'in' : 'cm', RULE[mode].replace(/^(Road|Sea W\/M|Courier|Weg|Zee W\/M|Koerier) /, ''));

    // hand the result to the quote form
    const u = imperial ? 'lb' : 'kg';
    const summary = `${fmt(pcs)} ${t('pcs', 'colli')}, ${fmt(toU(kg))} ${u} ${t('actual', 'werkelijk')}, ${cbm ? `${fmt(cbm, 3)} m³, ` : ''}${t('chargeable', 'belastbaar')} ${fmt(toU(cw), 1)} ${u} (${RULE[mode]})`;
    const q = new URLSearchParams({ type: 'quote', mode: QUOTE_MODE[mode], weight: summary });
    form!.querySelector<HTMLAnchorElement>('[data-quote]')!.href = `${t('/contact/', '/nl/contact/')}?${q}#enquiry`;
    form!.dataset.summary = summary;
    if (peekVal) peekVal.textContent = fmt(toU(cw), toU(cw) % 1 ? 1 : 0);
    if (peekBasis) peekBasis.textContent = !kg && !cbm ? '' : mode === 'sea' ? 'W/M' : byVol ? t('by volume', 'op volume') : t('by weight', 'op gewicht');
  }

  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  form.querySelector('[data-add]')!.addEventListener('click', () => {
    addRow(undefined, true);
    compute();
  });
  list.addEventListener('click', (e) => {
    const del = (e.target as Element).closest<HTMLButtonElement>('[data-del]');
    if (!del || del.disabled) return;
    const li = del.closest('li')!;
    const next = (li.nextElementSibling ?? li.previousElementSibling)?.querySelector<HTMLInputElement>('input');
    li.remove();
    renumber();
    next?.focus();
    compute();
  });
  form.querySelector('[data-example]')!.addEventListener('click', () => {
    list.replaceChildren();
    const ex = imperial
      ? [{ qty: 2, l: 24, w: 16, h: 16, kg: 20 }, { qty: 1, l: 47, w: 31, h: 39, kg: 120 }]
      : [{ qty: 2, l: 60, w: 40, h: 40, kg: 9 }, { qty: 1, l: 120, w: 80, h: 100, kg: 55 }];
    ex.forEach((r) => addRow(r));
    compute();
  });
  form.querySelectorAll<HTMLButtonElement>('[data-unit]').forEach((b) =>
    b.addEventListener('click', () => {
      const want = b.dataset.unit === 'imperial';
      if (want === imperial) return;
      imperial = want;
      form.querySelectorAll('[data-unit]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      // convert what is already typed, so the shipment stays the same
      const kL = imperial ? 1 / IN : IN;
      const kW = imperial ? 1 / LB : LB;
      list.querySelectorAll<HTMLInputElement>('[name="l"], [name="w"], [name="h"], [name="kg"]').forEach((i) => {
        const v = num(i.value);
        if (v) i.value = String(Math.round(v * (i.name === 'kg' ? kW : kL) * 10) / 10);
      });
      form.querySelectorAll('[data-u-len]').forEach((s) => (s.textContent = imperial ? 'in' : 'cm'));
      document.querySelectorAll('[data-calc] [data-u-kg], [data-peek] [data-u-kg]').forEach((s) => (s.textContent = imperial ? 'lb' : 'kg'));
      form.querySelectorAll('[data-u-vol]').forEach((s) => (s.textContent = imperial ? 'ft³' : 'm³'));
      compute();
    }),
  );
  form.querySelector('[data-copy]')!.addEventListener('click', async () => {
    const status = form.querySelector<HTMLElement>('[data-copy-status]')!;
    try {
      await navigator.clipboard.writeText(form.dataset.summary ?? '');
      status.textContent = t('Copied.', 'Gekopieerd.');
    } catch {
      status.textContent = form.dataset.summary ?? '';
    }
  });

  addRow({ qty: 1, l: 120, w: 80, h: 100, kg: 95 });
  compute();
}

/* ── Tool 2: loading metres ──────────────────────────────────────── */
function initLdm() {
  const form = document.querySelector<HTMLFormElement>('[data-ldm]');
  const deck = document.querySelector<HTMLElement>('[data-deck]');
  if (!form || !deck) return;
  const out = (k: string) => form.querySelector<HTMLElement>(`[data-l="${k}"]`)!;
  const TRAILER_L = 1360;
  const TRAILER_W = 245; // inner width; LDM uses the 2.4 m convention
  let drawn = '';

  function compute() {
    const f = new FormData(form!);
    const type = String(f.get('type'));
    form!.querySelectorAll<HTMLElement>('[data-custom]').forEach((el) => (el.hidden = type !== 'custom'));
    const [pl, pw] = type === 'custom' ? [num(String(f.get('l'))), num(String(f.get('w')))] : type.split('x').map(Number);
    const n = Math.min(99, Math.round(num(String(f.get('n')))));
    const h = num(String(f.get('h')));
    const kg = num(String(f.get('kg'))) * n;
    const stack = f.get('stack') === 'on';
    if (!pl || !pw || !n) return;

    const ldm = ((pl * pw) / 1e4 / 2.4) * (stack ? Math.ceil(n / 2) : n);
    const cbm = (pl * pw * (h || 0) * n) / 1e6;
    const ldmKg = ldm * LDM_KG;
    const volKg = cbm * 333;
    const cw = Math.ceil(Math.max(kg, ldmKg, volKg) - 1e-6);
    const fill = (ldm / 13.6) * 100;

    countTo(out('ldm'), ldm, (v) => fmt(v, 2));
    countTo(out('fill'), fill, (v) => fmt(v));
    out('cbm').textContent = fmt(cbm, 2);
    out('kg').textContent = fmt(kg);
    countTo(out('cw'), cw, (v) => fmt(v));
    const basis = kg >= ldmKg && kg >= volKg ? t('actual weight', 'werkelijk gewicht') : ldmKg >= volKg ? `${t('loading metres', 'laadmeters')} (${fmt(ldm, 2)} × ${fmt(1750)} kg)` : t('volume (1 m³ = 333 kg)', 'volume (1 m³ = 333 kg)');
    out('basis').textContent = t(`Charged on ${basis}, the greatest of weight, volume and floor space.`, `Berekend op ${basis}: het hoogste van gewicht, volume en vloerruimte.`);
    out('note').textContent = ldm > 13.6 ? t(`More than one trailer: ${fmt(Math.ceil(ldm / 13.6))} trailers, or a full load we plan with you.`, `Meer dan één trailer: ${fmt(Math.ceil(ldm / 13.6))} trailers, of een complete lading die we met u plannen.`) : stack ? t('Stacked two high: each spot carries two pallets.', 'Twee hoog gestapeld: elke plek draagt twee pallets.') : '';

    // top view: rows across the trailer, the orientation that fits the most
    const across1 = Math.floor(TRAILER_W / pw); // long side along the trailer
    const across2 = Math.floor(TRAILER_W / pl);
    const useA = across1 / pl >= across2 / pw;
    const across = Math.max(1, useA ? across1 : across2);
    const depth = useA ? pl : pw;
    const wide = useA ? pw : pl;
    const spots = stack ? Math.ceil(n / 2) : n;
    const key = `${pl}x${pw}:${n}:${stack}`;
    if (key === drawn) return;
    drawn = key;
    deck!.replaceChildren();
    const cells: HTMLElement[] = [];
    for (let i = 0; i < spots; i++) {
      const row = Math.floor(i / across);
      const col = i % across;
      const x = row * depth;
      if (x + depth > TRAILER_L + 0.1) break;
      const el = document.createElement('span');
      el.className = 'pallet';
      if (stack && (i * 2 + 1 < n)) el.classList.add('is-stacked');
      el.style.left = `${(x / TRAILER_L) * 100}%`;
      el.style.top = `${((col * wide + (TRAILER_W - across * wide) / 2) / TRAILER_W) * 100}%`;
      el.style.width = `${(depth / TRAILER_L) * 100}%`;
      el.style.height = `${(wide / TRAILER_W) * 100}%`;
      deck!.appendChild(el);
      cells.push(el);
    }
    if (!reducedMotion) gsap.from(cells, { opacity: 0, scale: 0.6, duration: 0.45, ease: 'expo.out', stagger: { each: Math.min(0.04, 0.8 / cells.length), from: 'start' } });
  }
  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  compute();
}

initCalc();
initLdm();
