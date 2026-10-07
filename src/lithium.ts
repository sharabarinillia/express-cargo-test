import './styles/main.css';
import './styles/pages.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initShell, reducedMotion } from './lib/shell';
import { initHeadlines } from './lib/motion';
import { countTo, initPageMotion } from './lib/page';
import { initJourney } from './lib/journey';

gsap.registerPlugin(ScrollTrigger);

initShell();
initHeadlines();
initPageMotion();
initJourney();
initHeroArt();
initClassifier();
initCounts();

/**
 * Hero package: the edges draw, the labels go on one by one, then the package
 * alternates between a box of loose batteries (UN3480: Class 9 label, Cargo
 * Aircraft Only, battery mark) and equipment with batteries inside (UN3481,
 * Section II: the battery mark only). Without motion it stays on the first.
 */
function initHeroArt(): void {
  const fig = document.querySelector<HTMLElement>('[data-lb-hero]');
  const svg = fig?.querySelector<SVGSVGElement>('svg.lb-hero-box');
  if (!fig || !svg || reducedMotion) return;
  const chip = fig.querySelector<HTMLElement>('[data-lb-state]');
  const un = svg.querySelector<SVGTextElement>('[data-lb-un]');
  const labels = [...svg.querySelectorAll<SVGGElement>('.lb-l')];
  const legend = [...fig.querySelectorAll<HTMLElement>('[data-legend]')];
  const states = [
    { marks: ['class9', 'cao', 'mark'], un: 'UN3480', text: fig.dataset.stateA ?? '' },
    { marks: ['mark'], un: 'UN3481', text: fig.dataset.stateB ?? '' },
  ];

  svg.classList.add('lb-anim');
  labels.forEach((l) => l.classList.remove('is-on'));
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add('is-drawn')));
  ['class9', 'mark', 'cao'].forEach((k, i) => gsap.delayedCall(1.15 + i * 0.3, () => svg.querySelector(`.lb-l[data-mark="${k}"]`)?.classList.add('is-on')));

  let current = 0;
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(fig);
  const show = (i: number) => {
    const s = states[i];
    labels.forEach((l) => l.classList.toggle('is-on', s.marks.includes(l.dataset.mark ?? '')));
    legend.forEach((li) => li.classList.toggle('is-off', !s.marks.includes(li.dataset.legend ?? '')));
    if (un) {
      un.textContent = s.un;
      gsap.fromTo(un, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    }
    if (chip) {
      const span = document.createElement('span');
      span.textContent = s.text;
      chip.replaceChildren(span);
      gsap.fromTo(span, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    }
  };
  const cycle = () => {
    if (visible && !document.hidden) {
      current = 1 - current;
      show(current);
    }
    gsap.delayedCall(4.8, cycle);
  };
  gsap.delayedCall(5.6, cycle);
}

/**
 * Battery classifier: three radio groups pick one row of the rules table and
 * the result card shows it. The table stays the source (and the no-script
 * fallback, open by default); with script it folds away behind its summary.
 */
function initClassifier(): void {
  const root = document.querySelector<HTMLElement>('[data-lb-cls]');
  const form = root?.querySelector<HTMLFormElement>('[data-lb-form]');
  const result = root?.querySelector<HTMLElement>('[data-lb-result]');
  if (!root || !form || !result) return;
  root.hidden = false;
  document.querySelector<HTMLDetailsElement>('[data-lb-table]')?.removeAttribute('open');

  const rows = [...document.querySelectorAll<HTMLTableRowElement>('[data-lb-rows] tr[data-chem]')];
  const art = result.querySelector<SVGSVGElement>('.lb-mini');
  const live = result.querySelector<HTMLElement>('[data-lb-live]');
  const quote = result.querySelector<HTMLAnchorElement>('[data-lb-quote]');
  const value = (name: string) => (form.elements.namedItem(name) as RadioNodeList).value;

  const update = (animate: boolean) => {
    const chem = value('chem');
    const pack = value('pack');
    const size = value('size');
    form.dataset.chem = chem;
    const row = rows.find((r) => r.dataset.chem === chem && r.dataset.pack === pack && r.dataset.size === size);
    if (!row) return;
    rows.forEach((r) => r.classList.toggle('is-match', r === row));
    result.querySelectorAll<HTMLElement>('[data-out]').forEach((out) => {
      const src = row.querySelector<HTMLElement>(`[data-f="${out.dataset.out}"]`);
      if (src) out.innerHTML = src.innerHTML;
    });
    const marks = (row.dataset.marks ?? '').split(' ');
    art?.querySelectorAll<SVGGElement>('.lb-l').forEach((l) => l.classList.toggle('is-on', marks.includes(l.dataset.mark ?? '')));
    const un = art?.querySelector('[data-lb-un]');
    if (un) un.textContent = row.dataset.un ?? '';
    if (quote) {
      const url = new URL(quote.href);
      url.searchParams.set('what', row.dataset.what ?? '');
      url.searchParams.set('un', row.dataset.un ?? '');
      quote.href = `${url.pathname}${url.search}${url.hash}`;
    }
    if (live) {
      const text = (f: string) => row.querySelector(`[data-f="${f}"]`)?.textContent?.trim() ?? '';
      live.textContent = `${text('un')}, ${text('pi')}: ${text('aircraft')}.`;
    }
    if (animate && !reducedMotion) {
      gsap.fromTo(result.querySelectorAll('[data-out]'), { opacity: 0.15, y: 6 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.03, overwrite: true });
    }
  };
  form.addEventListener('change', () => update(true));
  update(false);
}

/** the rule numbers count up as they arrive (the markup holds the final value) */
function initCounts(): void {
  if (reducedMotion) return;
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const to = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? '';
    const fmt = (n: number) => `${Math.round(n)}${suffix}`;
    el.textContent = fmt(0);
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => countTo(el, to, fmt, 1.2) });
  });
}
