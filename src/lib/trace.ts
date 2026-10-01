/**
 * The Trace: one illustrative temperature-logger line that runs the length of the
 * page. It starts as a horizontal reading across the hero strip, turns into the
 * right-hand rail and is drawn by scroll so its tip rides beside the fixed logger.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './shell';

type Mode = 'calm' | 'fast' | 'split' | 'end';
type Sample = { len: number; y: number };

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Deterministic smooth noise in roughly [-1, 1]. */
function noise(t: number): number {
  return (
    0.55 * Math.sin(t * 0.9) +
    0.3 * Math.sin(t * 2.3 + 1.7) +
    0.15 * Math.sin(t * 5.1 + 0.4) +
    0.08 * Math.sin(t * 11.7 + 2.2)
  );
}

export function initTrace(): void {
  const host = document.querySelector<HTMLElement>('[data-trace-host]');
  const svg = document.querySelector<SVGSVGElement>('[data-trace-svg]');
  const main = document.querySelector<SVGPathElement>('[data-trace-main]');
  const ghost = document.querySelector<SVGPathElement>('[data-trace-ghost]');
  const lanes = document.querySelector<SVGGElement>('[data-trace-lanes]');
  const rail = document.querySelector<HTMLElement>('[data-rail]');
  const strip = document.querySelector<HTMLElement>('[data-hero-strip]');
  const logger = document.querySelector<HTMLElement>('[data-logger]');
  if (!host || !svg || !main || !ghost || !lanes || !rail || !strip) return;

  rail.classList.remove('hidden');
  const tip = document.createElementNS(SVG_NS, 'circle');
  tip.setAttribute('r', '5');
  tip.setAttribute('class', 'fill-cyan');
  tip.style.filter = 'drop-shadow(0 0 6px rgba(18,196,222,.8))';
  svg.appendChild(tip);

  let samples: Sample[] = [];
  let heroLen = 0;
  let total = 0;
  let intro = reducedMotion ? 1 : 0; // 0..1 progress of the on-load hero draw
  let laneEls: { path: SVGPathElement; len: number; y0: number; y1: number }[] = [];

  const headY = () => window.innerHeight * (window.innerWidth < 768 ? 0.5 : 0.62);

  function build() {
    const hostRect = host!.getBoundingClientRect();
    const W = host!.clientWidth;
    const H = host!.scrollHeight;
    const docTop = hostRect.top + window.scrollY;
    svg!.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const railRect = rail!.getBoundingClientRect();
    const railX = railRect.left - hostRect.left + railRect.width / 2;
    const bandHalf = Math.max(3, railRect.width / 2 - (window.innerWidth < 768 ? 4 : 12)) * 0.6;

    const s = strip!.getBoundingClientRect();
    const y0 = s.top - hostRect.top + s.height / 2;
    const stripAmp = s.height * 0.16 * 0.62;
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 40;

    // chapter ranges → trace modes
    const ranges = [...document.querySelectorAll<HTMLElement>('[data-chapter]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { y0: r.top - hostRect.top, y1: r.bottom - hostRect.top, mode: (el.dataset.trace ?? 'calm') as Mode | 'hero' };
    });
    const modeAt = (y: number): Mode | 'hero' => ranges.find((r) => y >= r.y0 && y < r.y1)?.mode ?? 'calm';
    const close = ranges.find((r) => r.mode === 'end');
    const yEnd = close ? close.y0 + Math.min(close.y1 - close.y0, window.innerHeight) * 0.42 : H - 200;

    // 1 · hero: horizontal logger reading
    const pts: string[] = [];
    const xTurn = railX - 70;
    for (let x = gutter; x <= xTurn; x += 7) {
      const y = y0 + noise(x / 38) * stripAmp;
      pts.push(`${pts.length ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    // 2 · turn into the rail
    const yRail = y0 + 110;
    pts.push(`C${(xTurn + 50).toFixed(1)} ${y0.toFixed(1)} ${railX.toFixed(1)} ${(y0 + 40).toFixed(1)} ${railX.toFixed(1)} ${yRail.toFixed(1)}`);
    const heroPath = pts.join('');
    // 3 · the rail, down to delivery
    let t = 0;
    for (let y = yRail + 8; y <= yEnd; ) {
      const mode = modeAt(y);
      const fast = mode === 'fast';
      const step = fast ? 4 : 9;
      t += fast ? step / 9 : step / 48;
      const amp = fast ? bandHalf * 1.05 : bandHalf;
      const x = railX + noise(t) * amp + (fast ? Math.sin(y / 3.1) * 1.4 : 0);
      pts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
      y += step;
    }
    const d = pts.join('');
    main!.setAttribute('d', d);
    ghost!.setAttribute('d', d);

    // measure: hero length, then y → length lookup for the rail part
    const tmp = document.createElementNS(SVG_NS, 'path');
    tmp.setAttribute('d', heroPath);
    svg!.appendChild(tmp);
    heroLen = tmp.getTotalLength();
    tmp.remove();
    total = main!.getTotalLength();
    samples = [];
    for (let len = heroLen; len <= total; len += 6) samples.push({ len, y: main!.getPointAtLength(len).y });
    samples.push({ len: total, y: main!.getPointAtLength(total).y });
    main!.style.strokeDasharray = `${total} ${total}`;

    // cold chain: three lanes split from the trace (desktop only)
    lanes!.replaceChildren();
    laneEls = [];
    const split = ranges.find((r) => r.mode === 'split');
    if (split && window.innerWidth >= 768) {
      const a = split.y0 + 140;
      const b = split.y1 - 140;
      for (const off of [-30, 30]) {
        const p = document.createElementNS(SVG_NS, 'path');
        const lx = railX + off;
        let ld = `M${railX} ${a} C${railX} ${a + 50} ${lx} ${a + 40} ${lx} ${a + 100}`;
        for (let y = a + 108; y < b - 100; y += 9) ld += `L${(lx + noise(y / 40 + off) * 3).toFixed(1)} ${y}`;
        ld += `C${lx} ${b - 40} ${railX} ${b - 50} ${railX} ${b}`;
        p.setAttribute('d', ld);
        p.setAttribute('class', 'trace-path');
        p.style.stroke = '#0a7f93';
        lanes!.appendChild(p);
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len} ${len}`;
        laneEls.push({ path: p, len, y0: a, y1: b });
      }
    }
    void docTop;
    render();
  }

  function lenAtY(y: number): number {
    if (!samples.length || y <= samples[0].y) return heroLen;
    let lo = 0;
    let hi = samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (samples[mid].y <= y) lo = mid;
      else hi = mid - 1;
    }
    const a = samples[lo];
    const b = samples[Math.min(lo + 1, samples.length - 1)];
    const k = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
    return Math.min(total, a.len + (b.len - a.len) * k);
  }

  function render() {
    const hostTop = host!.getBoundingClientRect().top; // viewport
    const headDocY = headY() - hostTop; // head position in host coords
    const drawn = reducedMotion ? total : Math.max(heroLen * intro, intro >= 1 ? lenAtY(headDocY) : 0);
    main!.style.strokeDashoffset = String(total - drawn);
    const p = main!.getPointAtLength(Math.max(0.01, drawn));
    tip.setAttribute('cx', p.x.toFixed(1));
    tip.setAttribute('cy', p.y.toFixed(1));
    for (const l of laneEls) {
      const k = gsap.utils.clamp(0, 1, (headDocY - l.y0) / (l.y1 - l.y0));
      l.path.style.strokeDashoffset = String(reducedMotion ? 0 : l.len * (1 - k));
    }
    if (logger && window.innerWidth >= 768) {
      // keep the logger beside the tip while it is in the hero, then park at the head line
      const tipVy = p.y + hostTop;
      const y = gsap.utils.clamp(96, window.innerHeight - 70, tipVy);
      logger.style.top = `${y}px`;
    } else if (logger) {
      logger.style.top = '';
    }
  }

  build();
  if (!reducedMotion) {
    gsap.to({ v: 0 }, {
      v: 1,
      duration: 2.2,
      delay: 0.35,
      ease: 'power2.inOut',
      onUpdate() {
        intro = this.targets()[0].v;
        render();
      },
    });
  }
  gsap.ticker.add(render);
  ScrollTrigger.addEventListener('refresh', build);
  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
