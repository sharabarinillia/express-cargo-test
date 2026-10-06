import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { t } from './i18n';

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
    const menuOpen = document.documentElement.classList.contains('menu-open') || header.classList.contains('is-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 480 && y > last + 2);
    if (y < last - 2) header.classList.remove('is-hidden');
    last = y;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/**
 * Quick actions (call, quote) docked to the viewport once the hero is behind
 * you. They step aside where the page already offers the same actions: the
 * closing panel, the footer and the contact form, and clear the pinned
 * flight log, whose cards run to the bottom of the screen.
 */
export function initDock(): void {
  const dock = document.querySelector<HTMLElement>('[data-dock]');
  if (!dock) return;
  if (document.querySelector('[data-enquiry]')) {
    dock.remove();
    return;
  }
  const stops = [...document.querySelectorAll<HTMLElement>('.close-section, [data-footer], [data-flog]')];
  const near = new Set<Element>();
  const update = () => {
    const menuOpen = document.documentElement.classList.contains('menu-open');
    const on = !menuOpen && window.scrollY > window.innerHeight * 0.8 && near.size === 0;
    dock.classList.toggle('is-on', on);
    dock.inert = !on;
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? near.add(e.target) : near.delete(e.target);
    update();
  }, { rootMargin: '0px 0px -12% 0px' });
  stops.forEach((el) => io.observe(el));
  update();
  window.addEventListener('scroll', update, { passive: true });
  new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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
    if (label) label.textContent = open ? t('Close menu', 'Menu sluiten') : t('Open menu', 'Menu openen');
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

/** Desktop dropdowns: click or hover to open, Escape / outside click / focus leaving to close. */
export function initNav(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const triggers = [...document.querySelectorAll<HTMLButtonElement>('[data-nav-trigger]')];
  if (!header || !triggers.length) return;
  const panelOf = (t: HTMLButtonElement) => document.getElementById(t.getAttribute('aria-controls')!)!;
  let open: HTMLButtonElement | null = null;
  let timer = 0;
  let openedAt = 0;
  let hoverAt = 0;

  // a top-level link that already marks the page wins over the dropdowns
  const topMatch = [...document.querySelectorAll<HTMLAnchorElement>('a.nav-link')].some((a) => {
    const u = new URL(a.href, location.href);
    return !u.hash && u.pathname === location.pathname;
  });
  triggers.forEach((t) => {
    const panel = panelOf(t);
    panel.toggleAttribute('inert', true);
    panel.querySelectorAll<HTMLElement>('li, .nav-feature').forEach((el, i) => el.style.setProperty('--i', String(i)));
    // a group holding the current page carries the current-page diamond
    const here = [...panel.querySelectorAll<HTMLAnchorElement>('a')].some((a) => {
      const u = new URL(a.href, location.href);
      return u.pathname === location.pathname && location.pathname !== '/' && location.pathname !== '/nl/';
    });
    t.classList.toggle('is-current', here && !topMatch);
  });

  const set = (t: HTMLButtonElement | null) => {
    window.clearTimeout(timer);
    if (open === t) return;
    if (open) {
      open.setAttribute('aria-expanded', 'false');
      const p = panelOf(open);
      p.classList.remove('is-open');
      p.toggleAttribute('inert', true);
    }
    open = t;
    if (t) {
      t.setAttribute('aria-expanded', 'true');
      const p = panelOf(t);
      p.classList.add('is-open');
      p.toggleAttribute('inert', false);
    }
    header.classList.toggle('is-open', !!t);
    openedAt = window.scrollY;
  };

  triggers.forEach((t) => {
    // a click right after hover opened the sheet confirms it rather than closing it
    t.addEventListener('click', () => set(open === t && performance.now() - hoverAt > 450 ? null : t));
    t.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (open !== t) hoverAt = performance.now();
        set(t);
      }, open ? 0 : 90);
    });
  });
  header.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse' || !open) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => set(null), 220);
  });
  header.addEventListener('pointerenter', () => window.clearTimeout(timer));
  // pointing at other bar items (logo, contact, CTA) closes the sheet
  header.querySelectorAll<HTMLElement>('.header-bar a').forEach((a) =>
    a.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && open) timer = window.setTimeout(() => set(null), 120);
    }),
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      const t = open;
      set(null);
      t.focus();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (open && !header.contains(e.target as Node)) set(null);
  });
  header.addEventListener('focusout', (e) => {
    if (open && !header.contains(e.relatedTarget as Node)) set(null);
  });
  header.querySelectorAll('[data-nav-panel] a').forEach((a) => a.addEventListener('click', () => set(null)));
  // scrolling the page away from an open sheet closes it
  window.addEventListener('scroll', () => open && Math.abs(window.scrollY - openedAt) > 80 && set(null), { passive: true });
}

export function initShell(): Lenis | null {
  const lenis = initSmoothScroll();
  initHeader();
  initMenu(lenis);
  initNav();
  initDock();
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
  // mark the current page in the navigation (in-page anchors are not pages)
  document.querySelectorAll<HTMLAnchorElement>('a.nav-link, [data-menu-link], .nav-card').forEach((a) => {
    const url = new URL(a.href, location.href);
    if (!url.hash && url.pathname === location.pathname) a.setAttribute('aria-current', 'page');
  });
  return lenis;
}
