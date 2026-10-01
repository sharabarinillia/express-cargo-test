import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { reducedMotion } from './shell';
import { fmtTemp, type TraceApi } from './trace';

gsap.registerPlugin(ScrollTrigger, SplitText);


/** Brief underline flash: the instrument's "value changed" acknowledgement. */
function flash(el: Element) {
  el.classList.add('snap-flash');
  window.setTimeout(() => el.classList.remove('snap-flash'), 140);
}

/**
 * Headlines settle on Archivo's width axis: lines arrive condensed and snap
 * out to full width. Lines are split at their final width, so nothing reflows.
 */
export function initHeadlines(): void {
  if (reducedMotion) return;
  document.fonts.ready.then(() => {
    document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      const inHero = !!el.closest('#top');
      SplitText.create(el, {
        type: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit(self) {
          const tl = gsap.timeline({
            paused: !inHero,
            delay: inHero ? 0.2 : 0,
            defaults: { ease: 'expo.out' },
          });
          tl.fromTo(self.lines, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, stagger: 0.07 }, 0).fromTo(
            self.lines,
            { fontStretch: '72%', letterSpacing: '0.03em' },
            { fontStretch: '125%', letterSpacing: '-0.025em', duration: 0.55, stagger: 0.07, clearProps: 'fontStretch,letterSpacing' },
            0,
          );
          if (!inHero) ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => tl.play() });
          return tl;
        },
      });
    });
  });
}

export function initReveals(): void {
  if (reducedMotion) return;

  // hero: supporting copy simply appears once the headline has settled
  gsap.fromTo('#top [data-reveal="fade"]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.1, delay: 0.75, ease: 'power1.out' });
  const heroPlate = document.querySelector('[data-hero-plate] img');
  if (heroPlate) {
    gsap.fromTo(heroPlate, { scale: 1.1 }, { scale: 1, duration: 2.8, ease: 'power2.out' });
    gsap.to('[data-hero-plate]', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // one dominant image per chapter: scrubbed push-in
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((fig) => {
    const img = fig.querySelector('img');
    if (!img) return;
    gsap.fromTo(img, { scale: 1.14, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.utils.toArray<HTMLElement>('[data-push]').forEach((img) => {
    const section = img.closest('section');
    gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // services: logged events are stamped as the trace passes them
  gsap.utils.toArray<HTMLElement>('[data-log-rows] .log-row').forEach((row) => {
    const stamp = row.querySelector<HTMLElement>('.readout');
    const leader = row.querySelector<HTMLElement>('.leader');
    if (leader) gsap.set(leader, { scaleX: 0 });
    ScrollTrigger.create({
      trigger: row,
      start: 'top 62%',
      once: true,
      onEnter: () => {
        if (stamp) flash(stamp);
        if (leader) gsap.to(leader, { scaleX: 1, duration: 0.5, ease: 'expo.out' });
      },
    });
  });

  // footprint pins land once
  gsap.from('[data-pin]', { scale: 0, duration: 0.5, ease: 'expo.out', stagger: 0.2, scrollTrigger: { trigger: '[data-map]', start: 'top 75%', once: true } });
}

/** The logger: stage/loc/time snap per chapter; temperature is live from the trace. */
export function initLogger(trace: TraceApi | null): (t: number) => void {
  const logger = document.querySelector<HTMLElement>('[data-logger]');
  const tempEl = logger?.querySelector<HTMLElement>('[data-log="temp"]');
  const setTemp = (t: number) => {
    if (!logger || !tempEl || Number.isNaN(t)) return;
    tempEl.textContent = fmtTemp(t);
    logger.classList.toggle('is-warn', t >= 7);
  };
  if (!logger) return setTemp;
  const fields = ['stage', 'loc', 'time'] as const;
  const els = Object.fromEntries(fields.map((f) => [f, logger.querySelector<HTMLElement>(`[data-log="${f}"]`)]));

  const apply = (chapter: HTMLElement) => {
    for (const f of fields) {
      const el = els[f];
      const value = chapter.dataset[f];
      if (!el || !value || el.textContent === value) continue;
      el.textContent = value;
      if (!reducedMotion) flash(el);
    }
  };

  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((chapter) => {
    ScrollTrigger.create({
      trigger: chapter,
      start: () => `top ${window.innerWidth < 768 ? 50 : 62}%`,
      end: () => `bottom ${window.innerWidth < 768 ? 50 : 62}%`,
      onToggle: (self) => self.isActive && apply(chapter),
    });
  });

  // step aside over the footer
  const footer = document.querySelector('[data-footer]');
  if (footer) ScrollTrigger.create({ trigger: footer, start: 'top 85%', onToggle: (self) => logger.classList.toggle('is-parked', self.isActive) });

  // phones: stay out of the way until the hero actions have been passed
  const ctas = document.querySelector('[data-hero-ctas]');
  ScrollTrigger.matchMedia({
    '(max-width: 767px)': () => {
      logger.classList.remove('is-live');
      if (!ctas) return;
      const st = ScrollTrigger.create({
        trigger: ctas,
        start: 'bottom top+=72',
        onEnter: () => logger.classList.add('is-live'),
        onLeaveBack: () => logger.classList.remove('is-live'),
      });
      return () => st.kill();
    },
    '(min-width: 768px)': () => {
      const call = gsap.delayedCall(reducedMotion ? 0 : 1.6, () => logger.classList.add('is-live'));
      return () => call.kill();
    },
  });
  if (trace) setTemp(trace.tempAtHead());
  return setTemp;
}

/** Time-critical: pinned while the trace nears its limit and custody bars recover it. */
export function initTimeCritical(): void {
  const section = document.querySelector<HTMLElement>('#time-critical');
  const rows = gsap.utils.toArray<HTMLElement>('[data-custody-row]');
  if (!section || !rows.length) return;
  const segsOf = (row: HTMLElement) => row.querySelectorAll<HTMLElement>('.seg');
  if (reducedMotion) return;

  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      rows.forEach((r) => gsap.set(segsOf(r), { '--fill': 0 }));
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top top', end: '+=130%', pin: true, scrub: 0.6 },
      });
      tl.to({}, { duration: 1 }, 0);
      rows.forEach((r, i) => {
        tl.to(segsOf(r), { '--fill': 1, duration: 0.12, stagger: 0.04, ease: 'none' }, 0.46 + i * 0.16);
      });
      return () => tl.scrollTrigger?.kill();
    },
    '(max-width: 1023px)': () => {
      rows.forEach((r) => gsap.set(segsOf(r), { '--fill': 0 }));
      const sts = rows.map((r) =>
        ScrollTrigger.create({ trigger: r, start: 'top 75%', once: true, onEnter: () => gsap.to(segsOf(r), { '--fill': 1, duration: 0.6, stagger: 0.12, ease: 'expo.out' }) }),
      );
      return () => sts.forEach((s) => s.kill());
    },
  });
}

/** Cold chain: frost sweeps in from the rail; three zones plotted on one axis. */
export function initColdChain(): void {
  const ice = document.querySelector<HTMLElement>('[data-ice]');
  const section = document.querySelector<HTMLElement>('#cold-chain');
  if (ice && section && !reducedMotion) {
    gsap.fromTo(
      ice,
      { clipPath: 'inset(0 0 0 100%)' },
      { clipPath: 'inset(0 0 0 0%)', duration: 1.1, ease: 'expo.inOut', scrollTrigger: { trigger: section, start: 'top 82%', toggleActions: 'play none none reverse' } },
    );
  }

  const svg = document.querySelector<SVGSVGElement>('[data-lanes-svg]');
  const axis = document.querySelector<HTMLElement>('[data-lanes-axis]');
  if (!svg || !axis) return;
  const TOP = 30;
  const BOT = -25;
  const y = (t: number) => ((TOP - t) / (TOP - BOT)) * 440;
  const pct = (t: number) => `${((TOP - t) / (TOP - BOT)) * 100}%`;

  const grid = svg.querySelector('.lanes-grid')!;
  for (const t of [30, 20, 10, 0, -10, -20]) {
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', '0');
    l.setAttribute('x2', '1000');
    l.setAttribute('y1', String(y(t)));
    l.setAttribute('y2', String(y(t)));
    grid.appendChild(l);
    const s = document.createElement('span');
    s.style.top = pct(t);
    s.textContent = `${t > 0 ? '+' : t < 0 ? '−' : ''}${Math.abs(t)}`;
    axis.appendChild(s);
  }

  const zones = {
    ambient: { lo: 15, hi: 25, set: 20.2, amp: 1.1 },
    refrigerated: { lo: 2, hi: 8, set: 4.8, amp: 0.6 },
    frozen: { lo: -21.5, hi: -18.5, set: -20, amp: 0.35 },
  } as const;
  const paths: SVGPathElement[] = [];
  (Object.keys(zones) as (keyof typeof zones)[]).forEach((k, zi) => {
    const z = zones[k];
    const band = svg.querySelector<SVGRectElement>(`[data-lane-band="${k}"]`)!;
    band.setAttribute('x', '0');
    band.setAttribute('width', '1000');
    band.setAttribute('y', String(y(z.hi)));
    band.setAttribute('height', String(y(z.lo) - y(z.hi)));
    const p = svg.querySelector<SVGPathElement>(`[data-lane="${k}"]`)!;
    let d = '';
    let last: number = z.set;
    for (let x = 0; x <= 1000; x += 8) {
      const t = Math.round((z.set + z.amp * (0.6 * Math.sin(x / 70 + zi * 2) + 0.4 * Math.sin(x / 23 + zi))) * 10) / 10;
      d += x ? `L${x} ${y(last).toFixed(1)}L${x} ${y(t).toFixed(1)}` : `M0 ${y(t).toFixed(1)}`;
      last = t;
    }
    p.setAttribute('d', d);
    paths.push(p);
    const label = document.querySelector<HTMLElement>(`[data-lane-label="${k}"]`);
    if (label) label.style.top = pct((z.lo + z.hi) / 2);
  });

  if (reducedMotion) return;
  paths.forEach((p) => {
    const len = p.getTotalLength();
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: svg, start: 'top 85%', end: 'bottom 45%', scrub: 0.5 } });
  });
}

/** Logged journeys: one dominant photo, swapped from the ledger. */
export function initJourneys(): void {
  const rows = gsap.utils.toArray<HTMLButtonElement>('[data-ledger] .ledger-row');
  const shots = gsap.utils.toArray<HTMLElement>('[data-shot]');
  const caption = document.querySelector<HTMLElement>('[data-shot-caption]');
  rows.forEach((row) => {
    const activate = () => {
      rows.forEach((r) => {
        const on = r === row;
        r.classList.toggle('is-active', on);
        r.setAttribute('aria-pressed', String(on));
      });
      shots.forEach((s) => s.classList.toggle('is-active', s.dataset.shot === row.dataset.show));
      if (caption) caption.textContent = row.dataset.route ?? '';
    };
    row.addEventListener('click', activate);
    row.addEventListener('focus', activate);
    row.addEventListener('mouseenter', () => window.matchMedia('(hover: hover)').matches && activate());
  });
}

/** Close: the whole journey replayed as one printout. */
export function initPrintout(trace: TraceApi | null): void {
  const fig = document.querySelector<HTMLElement>('[data-printout]');
  const path = document.querySelector<SVGPathElement>('[data-printout-path]');
  const evs = document.querySelector<HTMLElement>('[data-printout-events]');
  const peakEl = document.querySelector<HTMLElement>('[data-printout-peak]');
  const legend = document.querySelector<HTMLElement>('[data-printout-legend]');
  if (!fig || !path || !evs || !trace) return;

  const draw = () => {
    const { temps, events } = trace.journey();
    if (!temps.length) return;
    const n = temps.length;
    const yOf = (t: number) => 100 - ((t - 2) / 6) * 80; // band 2–8 °C ↔ y 100–20
    let d = '';
    temps.forEach((t, i) => {
      const x = (i / (n - 1)) * 1000;
      d += i ? `L${x.toFixed(1)} ${yOf(temps[i - 1]).toFixed(1)}L${x.toFixed(1)} ${yOf(t).toFixed(1)}` : `M0 ${yOf(t).toFixed(1)}`;
    });
    path.setAttribute('d', d);
    evs.replaceChildren(
      ...events.map((e, i) => {
        const tick = document.createElement('span');
        tick.style.left = `${(Math.min(e.f, 0.97) * 100).toFixed(2)}%`;
        tick.textContent = String(i + 1);
        return tick;
      }),
    );
    legend?.replaceChildren(
      ...events.map((e, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<b>${i + 1}</b>${e.label}`;
        return li;
      }),
    );
    if (peakEl) peakEl.textContent = fmtTemp(Math.max(...temps));
  };
  draw();
  ScrollTrigger.addEventListener('refresh', draw);

  if (reducedMotion) return;
  const plot = fig.querySelector<HTMLElement>('.printout-plot');
  gsap.fromTo(plot, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: fig, start: 'top 88%', end: 'bottom 55%', scrub: 0.4 } });
}
