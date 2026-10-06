/**
 * Motion shared by the inner pages (services, tools, resources). Every reveal
 * fades only (never visibility), so links stay in the tab order, and a focused
 * item that has not been revealed yet appears at once.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './shell';

gsap.registerPlugin(ScrollTrigger);

export function drawIcons(scope: Element, delay = 0): void {
  if (reducedMotion) return;
  const paths = scope.querySelectorAll<SVGGeometryElement>('.icon path, .icon circle, .icon line, .icon polyline, .icon rect, .icon polygon, .icon ellipse');
  paths.forEach((p) => p.setAttribute('pathLength', '1'));
  gsap.fromTo(paths, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.02, delay });
}

const tweens = new WeakMap<HTMLElement, gsap.core.Tween>();

/** Tween a number into an element (keeps the formatting of `fmt`). */
export function countTo(el: HTMLElement, to: number, fmt: (n: number) => string, duration = 0.7): void {
  const from = Number(el.dataset.n ?? 0);
  el.dataset.n = String(to);
  if (reducedMotion || !Number.isFinite(from)) {
    el.textContent = fmt(to);
    return;
  }
  const o = { v: from };
  tweens.get(el)?.kill();
  tweens.set(el, gsap.to(o, { v: to, duration, ease: 'expo.out', onUpdate: () => void (el.textContent = fmt(o.v)) }));
}

export function initPageMotion(): void {
  if (reducedMotion) return;

  document.addEventListener('focusin', (e) => {
    const item = (e.target as Element).closest?.('[data-reveal], [data-stagger] > *, [data-fade]');
    if (item && Number(getComputedStyle(item).opacity) < 1) gsap.to(item, { opacity: 1, y: 0, x: 0, duration: 0.25, overwrite: true });
  });

  // page hero
  gsap.from('[data-fade]', { y: 22, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.4 });
  const heroMedia = document.querySelector<HTMLElement>('[data-hero-media]');
  const hero = heroMedia?.closest<HTMLElement>('section');
  if (heroMedia && hero) {
    gsap.fromTo(heroMedia, { scale: 1.1 }, { scale: 1, duration: 2.4, ease: 'expo.out' });
    gsap.to(heroMedia, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    const head = hero.querySelector('[data-hero-head]');
    if (head) gsap.to(head, { yPercent: -16, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 15%', scrub: true } });
  }

  // single blocks rise as they arrive
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => {
      gsap.fromTo(els, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 });
      els.forEach((el) => drawIcons(el, 0.1));
    },
  });
  gsap.set('[data-reveal]', { opacity: 0 });

  // lists: children one after another
  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((list) => {
    const items = [...list.children] as HTMLElement[];
    gsap.set(items, { opacity: 0, y: 24 });
    ScrollTrigger.create({
      trigger: list,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(items, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09 });
        drawIcons(list, 0.15);
      },
    });
  });

  // framed media: opens from an inset to full frame while the image drifts
  gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((fig) => {
    const media = fig.querySelector('video, img');
    gsap.fromTo(fig, { clipPath: 'inset(10% 7% 10% 7% round 8px)' }, { clipPath: 'inset(0% 0% 0% 0% round 8px)', ease: 'power2.out', scrollTrigger: { trigger: fig, start: 'top 95%', end: 'top 45%', scrub: 0.6 } });
    if (media) gsap.fromTo(media, { scale: 1.2, yPercent: -5 }, { scale: 1.04, yPercent: 5, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // a dark close panel settles into place
  gsap.utils.toArray<HTMLElement>('[data-settle]').forEach((el) =>
    gsap.fromTo(el, { scale: 0.94 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: 0.5 } }),
  );
}
