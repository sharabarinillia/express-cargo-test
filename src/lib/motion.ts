import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { reducedMotion } from './shell';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const DIGITS = '0123456789+−.';

/** Masked line reveal for headlines. Hero headlines play on load. */
export function initHeadlines(): void {
  if (reducedMotion) return;
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const inHero = !!el.closest('#top');
    document.fonts.ready.then(() => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 105,
            duration: inHero ? 1.15 : 0.95,
            ease: 'expo.out',
            stagger: 0.09,
            delay: inHero ? 0.15 : 0,
            scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 86%', once: true },
          });
        },
      });
    });
  });
}

export function initReveals(): void {
  if (reducedMotion) return;

  // hero supporting elements
  gsap.from('#top [data-reveal="fade"]', { y: 18, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.55 });
  const heroPlate = document.querySelector('[data-hero-plate] img');
  if (heroPlate) {
    gsap.fromTo(heroPlate, { scale: 1.12 }, { scale: 1, duration: 2.8, ease: 'power2.out' });
    gsap.to('[data-hero-plate]', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // generic fades outside the hero
  gsap.utils.toArray<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
    if (el.closest('#top')) return;
    gsap.from(el, { y: 18, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  // one dominant image per chapter: scrubbed push-in
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((fig) => {
    const img = fig.querySelector('img');
    if (!img) return;
    gsap.fromTo(img, { scale: 1.16, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.utils.toArray<HTMLElement>('[data-push]').forEach((img) => {
    const section = img.closest('section');
    gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // staggered groups
  gsap.utils.toArray<HTMLElement>('[data-stagger], [data-steps]').forEach((group) => {
    gsap.from(group.children, {
      y: 28,
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: group, start: 'top 84%', once: true },
    });
  });

  // services: logged events tick on as the trace passes
  gsap.utils.toArray<HTMLElement>('[data-log-rows] .log-row').forEach((row) => {
    const stamp = row.querySelector<HTMLElement>('.readout');
    const leader = row.querySelector<HTMLElement>('.leader');
    const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 72%', once: true } });
    tl.from(row, { autoAlpha: 0, y: 16, duration: 0.6, ease: 'power3.out' });
    if (stamp) tl.to(stamp, { duration: 0.6, scrambleText: { text: stamp.textContent ?? '', chars: DIGITS, speed: 0.6 } }, 0);
    if (leader) tl.from(leader, { scaleX: 0, duration: 0.7, ease: 'power2.inOut' }, 0.1);
  });

  // cold-chain zones: bars fill, temperatures settle
  const zones = document.querySelector('[data-zones]');
  if (zones) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: zones, start: 'top 78%', once: true } });
    tl.from(zones.querySelectorAll('[data-zone-bar]'), { scaleX: 0, transformOrigin: 'left', duration: 1.1, ease: 'power3.inOut', stagger: 0.15 });
    zones.querySelectorAll<HTMLElement>('[data-zone-temp]').forEach((el, i) => {
      tl.to(el, { duration: 0.9, scrambleText: { text: el.textContent ?? '', chars: DIGITS, speed: 0.5 } }, i * 0.15);
    });
  }

  // footprint pins: one pulse, no loops
  gsap.from('[data-pin]', { scale: 0, duration: 0.6, ease: 'back.out(2.2)', stagger: 0.25, scrollTrigger: { trigger: '[data-map]', start: 'top 75%', once: true } });
}

/** The logger readout snaps to each chapter's logged values. */
export function initLogger(): void {
  const logger = document.querySelector<HTMLElement>('[data-logger]');
  if (!logger) return;
  const fields = ['stage', 'loc', 'temp', 'time'] as const;
  const els = Object.fromEntries(fields.map((f) => [f, logger.querySelector<HTMLElement>(`[data-log="${f}"]`)]));

  const apply = (chapter: HTMLElement) => {
    for (const f of fields) {
      const el = els[f];
      const value = chapter.dataset[f];
      if (!el || !value || el.textContent === value) continue;
      gsap.killTweensOf(el);
      if (reducedMotion) {
        el.textContent = value;
        continue;
      }
      const numeric = f === 'temp' || f === 'time';
      gsap.fromTo(
        el,
        { y: -6 },
        {
          y: 0,
          duration: 0.5,
          ease: 'back.out(3)',
          scrambleText: { text: value, chars: numeric ? DIGITS : 'upperCase', speed: 0.9, revealDelay: 0.05 },
        },
      );
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

  // visible once the page has settled; hidden while the menu covers the page
  gsap.delayedCall(reducedMotion ? 0 : 1.6, () => logger.classList.add('is-live'));
}
