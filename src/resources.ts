import './styles/main.css';
import './styles/pages.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initShell, reducedMotion } from './lib/shell';
import { initHeadlines } from './lib/motion';
import { initPageMotion } from './lib/page';

gsap.registerPlugin(ScrollTrigger);

initShell();
initHeadlines();
initPageMotion();
initChart();

function initChart() {
  const chart = document.querySelector<HTMLElement>('[data-ic-chart]');
  const rows = [...document.querySelectorAll<HTMLTableRowElement>('[data-ic-chart] tbody tr')];
  const cards = [...document.querySelectorAll<HTMLElement>('[data-ic-terms] > li')];
  if (!chart || !rows.length) return;

  // the chart fills in once, cell by cell from origin to destination
  if (!reducedMotion) {
    const cells = chart.querySelectorAll('tbody td');
    gsap.set(cells, { opacity: 0, scaleX: 0.2, transformOrigin: 'left center' });
    ScrollTrigger.create({
      trigger: chart,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(cells, { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power3.out', stagger: { grid: [rows.length, 10], from: 0, amount: 0.9, axis: 'x' }, clearProps: 'opacity,transform' });
        chart.classList.add('is-drawn');
      },
    });
  } else chart.classList.add('is-drawn');

  // the term being read lights its row
  const mini = document.querySelector<HTMLElement>('[data-ic-mini]');
  const miniCode = document.querySelector<HTMLElement>('[data-ic-mini-code]');
  const miniCells = document.querySelector<HTMLElement>('[data-ic-mini-cells]');
  let miniFor = '';
  const setActive = (code: string | null) => {
    if (mini && miniCode && miniCells) {
      mini.classList.toggle('is-on', !!code);
      if (code && code !== miniFor) {
        miniFor = code;
        miniCode.textContent = code;
        const row = rows.find((r) => r.dataset.term === code);
        miniCells.replaceChildren(
          ...[...(row?.querySelectorAll('td') ?? [])].map((td) => {
            const i = document.createElement('i');
            i.className = td.className;
            return i;
          }),
        );
        if (!reducedMotion) gsap.fromTo(miniCells.children, { scaleX: 0.3, opacity: 0, transformOrigin: 'left center' }, { scaleX: 1, opacity: 1, duration: 0.35, stagger: 0.025, ease: 'power3.out' });
      }
    }
    rows.forEach((r) => r.classList.toggle('is-active', r.dataset.term === code));
    cards.forEach((c) => c.classList.toggle('is-active', c.dataset.term === code));
    chart.classList.toggle('has-active', !!code);
  };
  const seen = new Map<Element, boolean>();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      const on = cards.find((c) => seen.get(c) && !c.hidden);
      setActive(on?.dataset.term ?? null);
    },
    { rootMargin: '-42% 0px -42% 0px' },
  );
  cards.forEach((c) => io.observe(c));
  // keep the pinned bar clear of the header as it slides in and out
  const header = document.querySelector('[data-header]');
  if (header && mini) new MutationObserver(() => document.documentElement.classList.toggle('header-away', header.classList.contains('is-hidden'))).observe(header, { attributes: true, attributeFilter: ['class'] });
  rows.forEach((r) =>
    r.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse') setActive(r.dataset.term ?? null);
    }),
  );

  // filter by mode
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) =>
    b.addEventListener('click', () => {
      const f = b.dataset.filter!;
      document.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const show = (el: HTMLElement) => f === 'all' || el.dataset.mode === f;
      [...rows, ...cards].forEach((el) => (el.hidden = !show(el)));
      if (!reducedMotion) gsap.fromTo([...rows, ...cards].filter((el) => !el.hidden), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.03, ease: 'power3.out' });
      ScrollTrigger.refresh();
    }),
  );
}
