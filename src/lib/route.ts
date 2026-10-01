/**
 * The route: one shipment's flight, plotted across the whole page.
 *
 * Each chapter declares a leg (`data-leg="left|right"`) and a waypoint label
 * (`data-wp`). The route runs down the chosen margin through every chapter,
 * crossing over in the gaps between chapters, from the EHAM waypoint at the
 * foot of the departure hero to the destination at the close. A small aircraft flies it: its
 * position is tied to scroll so it stays on a fixed reading line, and the
 * flown part of the line is drawn behind it.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './shell';

type Sample = { x: number; y: number; len: number };
type Waypoint = { el: HTMLElement; len: number };

export function initRoute(): void {
  const host = document.querySelector<HTMLElement>('[data-route-host]');
  const svg = document.querySelector<SVGSVGElement>('[data-route-svg]');
  const plan = document.querySelector<SVGPathElement>('[data-route-plan]');
  const flown = document.querySelector<SVGPathElement>('[data-route-flown]');
  const wpLayer = document.querySelector<HTMLElement>('[data-route-wps]');
  const aircraft = document.querySelector<HTMLElement>('[data-aircraft]');
  if (!host || !svg || !plan || !flown || !wpLayer || !aircraft) return;

  let samples: Sample[] = [];
  let total = 0;
  let wps: Waypoint[] = [];
  let lastHead = -1;

  const headRatio = () => (window.innerWidth < 768 ? 0.45 : 0.55);

  function build() {
    const hostRect = host!.getBoundingClientRect();
    const W = host!.clientWidth;
    const H = host!.scrollHeight;
    svg!.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const rel = (r: DOMRect) => ({ top: r.top - hostRect.top, bottom: r.bottom - hostRect.top, left: r.left - hostRect.left, right: r.right - hostRect.left });

    const legs = [...document.querySelectorAll<HTMLElement>('[data-leg]')];
    const firstWrap = document.querySelector<HTMLElement>('.wrap');
    const gutter = parseFloat(getComputedStyle(firstWrap!).paddingLeft) || 20;
    const wrapBox = rel(firstWrap!.getBoundingClientRect());
    const xLeft = Math.max(10, wrapBox.left + gutter * 0.5);
    const xRight = Math.min(W - 10, wrapBox.right - gutter * 0.5);

    // anchor points: [x, y, waypoint?]
    type Pt = { x: number; y: number; wp?: { label: string; side: 'left' | 'right' } };
    const pts: Pt[] = [];
    for (const leg of legs) {
      const side = leg.dataset.leg!;
      const box = rel(leg.getBoundingClientRect());
      const label = leg.dataset.wp ?? '';
      if (side === 'hero') {
        const foot = leg.querySelector<HTMLElement>('.hero-foot');
        const fb = foot ? rel(foot.getBoundingClientRect()) : box;
        pts.push({ x: xRight, y: fb.top - 24, wp: { label, side: 'right' } });
        continue;
      }
      if (side === 'end') {
        const inset = leg.querySelector<HTMLElement>('[data-close-inset]');
        const ib = inset ? rel(inset.getBoundingClientRect()) : box;
        pts.push({ x: xLeft, y: ib.top - 36, wp: { label, side: 'left' } });
        continue;
      }
      const x = side === 'left' ? xLeft : xRight;
      pts.push({ x, y: box.top + 72, wp: { label, side: side as 'left' | 'right' } });
      pts.push({ x, y: Math.max(box.top + 140, box.bottom - 56) });
    }

    // path: verticals down each margin, S-curves across the gaps
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      if (Math.abs(a.x - b.x) < 1) d += `L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      else {
        const dy = b.y - a.y;
        d += `C${a.x.toFixed(1)} ${(a.y + dy * 0.55).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - dy * 0.55).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
    }
    plan!.setAttribute('d', d);
    flown!.setAttribute('d', d);
    total = flown!.getTotalLength();
    flown!.style.strokeDasharray = `${total} ${total}`;

    samples = [];
    for (let l = 0; l <= total; l += 6) {
      const p = flown!.getPointAtLength(l);
      samples.push({ x: p.x, y: p.y, len: l });
    }
    const end = flown!.getPointAtLength(total);
    samples.push({ x: end.x, y: end.y, len: total });

    // waypoints
    wpLayer!.replaceChildren();
    wps = [];
    for (const p of pts) {
      if (!p.wp) continue;
      const el = document.createElement('span');
      el.className = 'wp';
      el.dataset.side = p.wp.side;
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      el.innerHTML = `<i></i><b class="chart">${p.wp.label}</b>`;
      wpLayer!.appendChild(el);
      wps.push({ el, len: lenAtY(p.y) });
    }
    lastHead = -1;
    render();
  }

  function lenAtY(y: number): number {
    if (!samples.length) return 0;
    if (y <= samples[0].y) return 0;
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

  function pointAt(l: number): Sample {
    const i = Math.max(0, Math.min(samples.length - 1, Math.round(l / 6)));
    return samples[i];
  }

  function render() {
    if (!samples.length) return;
    const hostTop = host!.getBoundingClientRect().top;
    const headDocY = window.innerHeight * headRatio() - hostTop;
    if (Math.abs(headDocY - lastHead) < 0.5) return;
    lastHead = headDocY;
    const l = reducedMotion ? total : lenAtY(headDocY);
    flown!.style.strokeDashoffset = String(total - l);
    const p = pointAt(l);
    const q = pointAt(Math.min(total, l + 18));
    const back = pointAt(Math.max(0, l - 18));
    const angle = (Math.atan2(q.y - back.y, q.x - back.x) * 180) / Math.PI + 90;
    aircraft!.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${angle.toFixed(1)}deg)`;
    for (const w of wps) w.el.classList.toggle('is-on', l >= w.len - 2);
  }

  build();
  if (reducedMotion) aircraft.style.display = 'none';
  gsap.ticker.add(render);
  ScrollTrigger.addEventListener('refresh', build);
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
