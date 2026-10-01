import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth native scroll (no hijacking); disabled for reduced motion. */
export function initSmoothScroll(): Lenis | null {
  if (reducedMotion) return null;
  const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -88 }, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  let last = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-solid', y > 24);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 480 && y > last + 2);
    if (y < last - 2) header.classList.remove('is-hidden');
    last = y;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

export function initMenu(lenis: Lenis | null): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const label = document.querySelector<HTMLElement>('[data-menu-label]');
  const icon = document.querySelector<SVGPathElement>('[data-menu-icon]');
  const panel = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !panel) return;
  const root = document.documentElement;
  const set = (open: boolean) => {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    icon?.setAttribute('d', open ? 'M5 5l14 14M19 5L5 19' : 'M3 8h18M3 16h18');
    panel.toggleAttribute('inert', !open);
    if (open) lenis?.stop();
    else lenis?.start();
  };
  panel.toggleAttribute('inert', true);
  toggle.addEventListener('click', () => set(!root.classList.contains('menu-open')));
  panel.querySelectorAll('[data-menu-link]').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) {
      set(false);
      toggle.focus();
    }
  });
}

export function initShell(): Lenis | null {
  const lenis = initSmoothScroll();
  initHeader();
  initMenu(lenis);
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
  return lenis;
}
