import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { reducedMotion } from './shell';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Videos play only while on screen (and never under reduced motion). */
export function initVideos(): void {
  const vids = [...document.querySelectorAll<HTMLVideoElement>('video[data-video]')];

  // posters load only as their video approaches (in every motion mode)
  const posterIo = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const v = e.target as HTMLVideoElement;
        const small = v.clientWidth * (window.devicePixelRatio || 1) < 1100;
        const src = (small && v.dataset.posterSm) || v.dataset.poster;
        if (src) v.poster = src;
        posterIo.unobserve(v);
      }
    },
    { rootMargin: '150% 0px' },
  );
  vids.forEach((v) => posterIo.observe(v));
  if (reducedMotion) return;
  const hero = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (hero && saveData) hero.remove(); // the poster carries the hero on data-saver connections
  else if (hero) {
    // fetched only when it will actually play; fades in over its poster once frames move
    hero.preload = 'auto';
    hero.addEventListener('playing', () => hero.classList.add('is-playing'), { once: true });
    hero.play().catch(() => {});
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto';
          v.play().catch(() => {});
        } else v.pause();
      }
    },
    { rootMargin: '120px 0px' },
  );
  vids.forEach((v) => io.observe(v));
}

/** Headlines: masked line rise. */
export function initHeadlines(): void {
  if (reducedMotion) return;
  document.fonts.ready.then(() => {
    document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      const inHero = !!el.closest('#top') || !!el.closest('[data-page-hero]');
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: inHero ? 1.1 : 0.9,
            ease: 'expo.out',
            stagger: 0.08,
            delay: inHero ? 0.15 : 0,
            scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 86%', once: true },
          });
        },
      });
    });
  });
}

function drawIcons(scope: Element, delay = 0) {
  const paths = scope.querySelectorAll<SVGGeometryElement>('.icon path, .icon circle, .icon line, .icon polyline, .icon rect');
  paths.forEach((p) => p.setAttribute('pathLength', '1'));
  gsap.fromTo(paths, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.02, delay });
}

export function initReveals(): void {
  if (reducedMotion) return;

  // reveals only fade (never visibility:hidden), so links stay in the tab order;
  // a keyboard user landing on a not-yet-revealed item sees it at once
  document.addEventListener('focusin', (e) => {
    const item = (e.target as Element).closest?.('.airway, [data-crew] li, [data-strips] .strip, [data-fade], .leg');
    if (item && Number(getComputedStyle(item).opacity) < 1) gsap.to(item, { opacity: 1, y: 0, x: 0, xPercent: 0, duration: 0.25, overwrite: true });
  });

  // hero: the departure plays once, then holds on the aircraft in the distance
  gsap.from('[data-fade]', { y: 22, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.45 });
  const heroMedia = document.querySelector<HTMLElement>('[data-hero-media]');
  if (heroMedia) {
    gsap.fromTo(heroMedia, { scale: 1.08 }, { scale: 1, duration: 2.4, ease: 'expo.out' });
    gsap.to(heroMedia, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-head', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom 20%', scrub: true } });
  }

  // chart insets: scroll depth (multiplane push)
  gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((fig) => {
    const media = fig.querySelector('video, img');
    gsap.fromTo(fig, { clipPath: window.innerWidth < 768 ? 'inset(4% 3% 4% 3% round 6px)' : 'inset(12% 8% 12% 8% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'power2.out', scrollTrigger: { trigger: fig, start: 'top 95%', end: 'top 45%', scrub: 0.6 } });
    if (media) gsap.fromTo(media, { scale: 1.22, yPercent: -6 }, { scale: 1.04, yPercent: 6, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // air band: the video opens from a framed inset to full bleed
  const band = document.querySelector<HTMLElement>('[data-reveal-band]');
  if (band) {
    gsap.fromTo(band, { clipPath: 'inset(0% 5% 0% 5% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'top 15%', scrub: 0.5 } });
    const media = band.querySelector('video');
    if (media) gsap.fromTo(media, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  const legsLine = document.querySelector('[data-legs-line]');
  if (legsLine) {
    gsap.fromTo(legsLine, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '[data-legs]', start: 'top 80%', end: 'top 40%', scrub: 0.6 } });
    gsap.from('[data-legs] .leg', { opacity: 0, y: 16, stagger: 0.18, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: '[data-legs]', start: 'top 75%', once: true } });
  }

  // airways: rows land, icons draw themselves
  gsap.utils.toArray<HTMLElement>('[data-airways] .airway').forEach((row, i) => {
    gsap.set(row, { opacity: 0, y: 26 });
    ScrollTrigger.create({
      trigger: row,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(row, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: (i % 2) * 0.08 });
        drawIcons(row, 0.15);
      },
    });
  });
  gsap.utils.toArray<HTMLElement>('[data-pictos] li, [data-legend] .legend-row').forEach((row) => {
    ScrollTrigger.create({ trigger: row, start: 'top 90%', once: true, onEnter: () => drawIcons(row) });
  });

  // flight strips slide into the bay
  gsap.from('[data-strips] .strip', { xPercent: 12, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '[data-strips]', start: 'top 80%', once: true } });

  // airspace layers fill
  const layers = gsap.utils.toArray<HTMLElement>('[data-airspace] .layer');
  if (layers.length) {
    gsap.fromTo(layers, { '--fill': 0.35 }, { '--fill': 1, duration: 1.1, ease: 'expo.inOut', stagger: 0.15, scrollTrigger: { trigger: '[data-airspace]', start: 'top 80%', once: true } });
  }

  // crew
  gsap.from('[data-crew] li', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '[data-crew]', start: 'top 88%', once: true } });

  // close: the flight-plan panel rises into place
  const close = document.querySelector<HTMLElement>('[data-close-inset]');
  if (close) gsap.fromTo(close, { scale: 0.94 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: close, start: 'top bottom', end: 'top 30%', scrub: 0.5 } });
}
