/**
 * The Trace: one illustrative temperature-logger record for the whole page.
 *
 * The signal is modelled, not decorative: a 4–5 °C plateau with slow drift,
 * quantised to 0.1 °C steps, a door-open bump at every handover (chapter
 * boundary) decaying back to plateau, a near-excursion towards the 8 °C limit
 * in the time-critical chapter, and recovery. It starts horizontally across the
 * hero strip, turns into the right-hand rail and is drawn by scroll, so its tip
 * rides beside the fixed logger. The same record is replayed as a horizontal
 * printout at the close.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './shell';

const SVG_NS = 'http://www.w3.org/2000/svg';
const T_MIN = 2;
const T_MAX = 8;
const BASE = 4.5;

type Pt = { x: number; y: number; t: number; len: number };
type Range = { el: HTMLElement; y0: number; y1: number; mode: string };

/** Deterministic smooth noise in roughly [-1, 1]. */
function noise(u: number): number {
  return 0.6 * Math.sin(u * 1.3 + 0.4) + 0.3 * Math.sin(u * 3.1 + 1.9) + 0.1 * Math.sin(u * 7.7 + 0.3);
}
const q = (t: number) => Math.round(t * 10) / 10; // logger resolution 0.1 °C
const smooth = (k: number) => k * k * (3 - 2 * k);

export const fmtTemp = (t: number) => `${t >= 0 ? '+' : '−'}${Math.abs(t).toFixed(1)} °C`;

export type TraceApi = {
  tempAtHead: () => number;
  journey: () => { temps: number[]; events: { f: number; label: string }[] };
};

export function initTrace(onTemp?: (t: number) => void): TraceApi | null {
  const host = document.querySelector<HTMLElement>('[data-trace-host]');
  const svg = document.querySelector<SVGSVGElement>('[data-trace-svg]');
  const main = document.querySelector<SVGPathElement>('[data-trace-main]');
  const ghost = document.querySelector<SVGPathElement>('[data-trace-ghost]');
  const dots = document.querySelector<SVGPathElement>('[data-trace-dots]');
  const clipA = document.querySelector<SVGRectElement>('[data-clip-hero]');
  const clipB = document.querySelector<SVGRectElement>('[data-clip-rail]');
  const rail = document.querySelector<HTMLElement>('[data-rail]');
  const strip = document.querySelector<HTMLElement>('[data-hero-strip]');
  const events = document.querySelector<HTMLElement>('[data-trace-events]');
  if (!host || !svg || !main || !ghost || !dots || !clipA || !clipB || !rail || !strip || !events) return null;

  rail.classList.remove('hidden');
  const tip = document.createElementNS(SVG_NS, 'circle');
  tip.setAttribute('r', '4.5');
  tip.setAttribute('class', 'trace-tip');
  svg.appendChild(tip);

  let pts: Pt[] = [];
  let heroCount = 0;
  let heroLen = 0;
  let total = 0;
  let yRail = 0;
  let intro = reducedMotion ? 1 : 0;
  let markers: { el: HTMLElement; y: number }[] = [];
  let lastTemp = NaN;
  let journeyTemps: number[] = [];
  let journeyEvents: { f: number; label: string }[] = [];

  const isMobile = () => window.innerWidth < 768;
  const headY = () => window.innerHeight * (isMobile() ? 0.5 : 0.62);

  /** Chapter extents in host coordinates (pin spacers included). */
  function chapterRanges(hostTop: number): Range[] {
    return [...document.querySelectorAll<HTMLElement>('[data-chapter]')].map((el) => {
      const box = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el;
      const r = box.getBoundingClientRect();
      return { el, y0: r.top - hostTop, y1: r.bottom - hostTop, mode: el.dataset.trace ?? 'calm' };
    });
  }

  /** The modelled temperature at a host-y on the rail. */
  function railTemp(y: number, ranges: Range[]): number {
    let t = BASE + 0.32 * noise(y / 900) + 0.08 * noise(y / 140);
    ranges.forEach((r, i) => {
      if (r.mode === 'hero' || r.mode === 'end' || y < r.y0) return;
      // door-open bump at each handover: 3-sample rise, exponential decay
      const amp = 1.2 + 0.6 * (((i * 7) % 5) / 4);
      const d = y - r.y0;
      t += d < 30 ? (amp * d) / 30 : amp * Math.exp(-(d - 30) / 260);
    });
    const fast = ranges.find((r) => r.mode === 'fast');
    if (fast && y >= fast.y0 && y <= fast.y1) {
      // near-excursion towards the 8 °C alarm, then recovery in three notches
      const u = (y - fast.y0) / (fast.y1 - fast.y0);
      const level = u < 0.42 ? BASE + (7.45 - BASE) * smooth(u / 0.42) : u < 0.6 ? 7.45 : u < 0.76 ? 6.6 : u < 0.9 ? 5.7 : 4.8;
      t = Math.max(t, level) + 0.05 * noise(y / 60);
    }
    return Math.min(7.6, Math.max(2.4, q(t)));
  }

  function build() {
    const hostRect = host!.getBoundingClientRect();
    const W = host!.clientWidth;
    const H = host!.scrollHeight;
    svg!.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const ranges = chapterRanges(hostRect.top);

    const railRect = rail!.getBoundingClientRect();
    const railX = railRect.left - hostRect.left + railRect.width / 2;
    const bandW = railRect.width - (isMobile() ? 6 : 20);
    const xOf = (t: number) => railX - bandW / 2 + ((t - T_MIN) / (T_MAX - T_MIN)) * bandW;

    const s = strip!.getBoundingClientRect();
    const band = strip!.querySelector<HTMLElement>('[data-hero-band]')!.getBoundingClientRect();
    const bTop = band.top - hostRect.top;
    const bH = band.height;
    const yOf = (t: number) => bTop + bH - ((t - T_MIN) / (T_MAX - T_MIN)) * bH;
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 40;
    void s;

    // ── assemble the stepped polyline ────────────────────────────────
    const raw: { x: number; y: number; t: number }[] = [];
    journeyTemps = [];
    const xTurn = railX - 80;
    const step = isMobile() ? 6 : 9;
    for (let x = gutter; x <= xTurn; x += step) {
      const t = q(BASE + 0.35 * noise(x / 120) + 0.1 * noise(x / 23));
      journeyTemps.push(t);
      const y = yOf(t);
      if (raw.length) raw.push({ x, y: raw[raw.length - 1].y, t }); // hold, then step
      raw.push({ x, y, t });
    }
    heroCount = raw.length;
    // turn into the rail with a short curve (sampled)
    const y0 = raw[raw.length - 1].y;
    yRail = Math.max(y0 + 90, s.bottom - hostRect.top + 24);
    const tEnd = raw[raw.length - 1].t;
    const p0 = { x: xTurn, y: y0 };
    const p3 = { x: xOf(tEnd), y: yRail };
    for (let i = 1; i <= 16; i++) {
      const k = i / 16;
      const c1 = { x: xTurn + 60, y: y0 };
      const c2 = { x: p3.x, y: y0 + 30 };
      const mt = 1 - k;
      raw.push({
        x: mt ** 3 * p0.x + 3 * mt * mt * k * c1.x + 3 * mt * k * k * c2.x + k ** 3 * p3.x,
        y: mt ** 3 * p0.y + 3 * mt * mt * k * c1.y + 3 * mt * k * k * c2.y + k ** 3 * p3.y,
        t: tEnd,
      });
    }
    const close = ranges.find((r) => r.mode === 'end');
    const yEnd = close ? close.y0 + 60 : H - 200;
    for (let y = yRail + 10; y <= yEnd; y += 10) {
      const t = railTemp(y, ranges);
      journeyTemps.push(t);
      const x = xOf(t);
      raw.push({ x: raw[raw.length - 1].x, y, t }); // hold, then step
      raw.push({ x, y, t });
    }

    // cumulative length (own geometry, no getPointAtLength in the hot path)
    pts = [];
    let len = 0;
    raw.forEach((p, i) => {
      if (i) len += Math.hypot(p.x - raw[i - 1].x, p.y - raw[i - 1].y);
      pts.push({ ...p, len });
    });
    heroLen = pts[heroCount - 1]?.len ?? 0;
    total = len;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');
    for (const p of [main!, ghost!, dots!]) p.setAttribute('d', d);
    main!.style.strokeDasharray = `${total} ${total}`;
    clipA!.setAttribute('height', String(yRail + 4));
    clipB!.setAttribute('y', String(yRail));
    clipB!.setAttribute('width', String(W));

    // ── handover events on the rail ──────────────────────────────────
    events!.replaceChildren();
    markers = [];
    journeyEvents = [];
    const heroSamples = journeyTemps.length - Math.floor((yEnd - yRail - 10) / 10) - 1;
    for (const r of ranges) {
      if (r.mode === 'hero') continue;
      const ev = r.el.dataset.event;
      if (!ev) continue;
      const peakY = r.y0 + 30;
      const el = document.createElement('div');
      el.className = 'trace-event';
      el.style.top = `${peakY}px`;
      el.innerHTML = `<span class="readout">${r.el.dataset.time ?? ''}&ensp;${ev}&ensp;<b>${fmtTemp(railTemp(peakY, ranges))}</b></span><i></i>`;
      events!.appendChild(el);
      markers.push({ el, y: peakY });
      journeyEvents.push({ f: Math.min(1, (heroSamples + (peakY - yRail) / 10) / journeyTemps.length), label: ev });
    }
    render();
  }

  function pointAt(l: number): Pt {
    let lo = 0;
    let hi = pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (pts[mid].len <= l) lo = mid;
      else hi = mid - 1;
    }
    const a = pts[lo];
    const b = pts[Math.min(lo + 1, pts.length - 1)];
    const k = b.len === a.len ? 0 : (l - a.len) / (b.len - a.len);
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, t: a.t, len: l };
  }

  function lenAtY(y: number): number {
    if (y <= yRail) return heroLen;
    let lo = heroCount;
    let hi = pts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (pts[mid].y <= y) lo = mid;
      else hi = mid - 1;
    }
    return Math.min(total, pts[lo].len);
  }

  function render() {
    if (!pts.length) return;
    const hostTop = host!.getBoundingClientRect().top;
    const headDocY = headY() - hostTop;
    const drawn = reducedMotion ? total : intro < 1 ? heroLen * intro : Math.max(heroLen, lenAtY(headDocY));
    main!.style.strokeDashoffset = String(total - drawn);
    const p = pointAt(Math.max(0.01, drawn));
    tip.setAttribute('cx', p.x.toFixed(1));
    tip.setAttribute('cy', p.y.toFixed(1));
    clipA!.setAttribute('width', String(drawn >= heroLen ? 99999 : Math.max(0, p.x + 2)));
    clipB!.setAttribute('height', String(Math.max(0, p.y - yRail + 2)));
    for (const m of markers) m.el.classList.toggle('is-on', p.y >= m.y - 2);
    if (p.t !== lastTemp) {
      lastTemp = p.t;
      onTemp?.(p.t);
      rail!.classList.toggle('is-warn', p.t >= 7);
    }
  }

  build();
  if (!reducedMotion) {
    const state = { v: 0 };
    gsap.to(state, {
      v: 1,
      duration: 2.4,
      delay: 0.3,
      ease: 'power2.inOut',
      onUpdate() {
        intro = state.v;
        render();
      },
    });
  }
  gsap.ticker.add(render);
  ScrollTrigger.addEventListener('refresh', build);
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());

  return {
    tempAtHead: () => lastTemp,
    journey: () => ({ temps: journeyTemps, events: journeyEvents }),
  };
}
