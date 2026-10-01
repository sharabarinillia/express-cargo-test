import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { reducedMotion } from './shell';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Videos play only while on screen (and never under reduced motion). */
export function initVideos(): void {
  const vids = [...document.querySelectorAll<HTMLVideoElement>('video[data-video]')];
  if (reducedMotion) return;
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

  // hero
  gsap.from('[data-fade]', { y: 22, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.45 });
  const heroInset = document.querySelector<HTMLElement>('[data-hero-inset]');
  if (heroInset) {
    gsap.fromTo(heroInset, { clipPath: 'inset(100% 0% 0% 0% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', duration: 1.4, ease: 'expo.inOut', delay: 0.2 });
    gsap.fromTo(heroInset.querySelector('video'), { scale: 1.25 }, { scale: 1, duration: 2.2, ease: 'expo.out', delay: 0.2 });
    gsap.to(heroInset, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // chart insets: scroll depth (multiplane push)
  gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((fig) => {
    const media = fig.querySelector('video, img');
    gsap.fromTo(fig, { clipPath: 'inset(12% 8% 12% 8% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'power2.out', scrollTrigger: { trigger: fig, start: 'top 95%', end: 'top 45%', scrub: 0.6 } });
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
    legsLine.setAttribute('pathLength', '1');
    gsap.fromTo(legsLine, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '[data-legs]', start: 'top 80%', end: 'top 40%', scrub: 0.6 } });
    gsap.from('[data-legs] .leg', { autoAlpha: 0, y: 16, stagger: 0.18, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: '[data-legs]', start: 'top 75%', once: true } });
  }

  // airways: rows land, icons draw themselves
  gsap.utils.toArray<HTMLElement>('[data-airways] .airway').forEach((row, i) => {
    gsap.set(row, { autoAlpha: 0, y: 26 });
    ScrollTrigger.create({
      trigger: row,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(row, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: (i % 2) * 0.08 });
        drawIcons(row, 0.15);
      },
    });
  });
  gsap.utils.toArray<HTMLElement>('[data-pictos] li, [data-legend] .legend-row').forEach((row) => {
    ScrollTrigger.create({ trigger: row, start: 'top 90%', once: true, onEnter: () => drawIcons(row) });
  });

  // flight strips slide into the bay
  gsap.from('[data-strips] .strip', { xPercent: 12, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '[data-strips]', start: 'top 80%', once: true } });

  // airspace layers fill
  const layers = gsap.utils.toArray<HTMLElement>('[data-airspace] .layer');
  if (layers.length) {
    gsap.fromTo(layers, { '--fill': 0 }, { '--fill': 1, duration: 1.1, ease: 'expo.inOut', stagger: 0.15, scrollTrigger: { trigger: '[data-airspace]', start: 'top 80%', once: true } });
  }

  // crew
  gsap.from('[data-crew] li', { autoAlpha: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '[data-crew]', start: 'top 88%', once: true } });

  // close: the flight-plan panel rises into place
  const close = document.querySelector<HTMLElement>('[data-close-inset]');
  if (close) gsap.fromTo(close, { scale: 0.94 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: close, start: 'top bottom', end: 'top 30%', scrub: 0.5 } });
}

/** Projects: routes plotted from EHAM; pinned and stepped through on desktop. */
export function initProjects(): void {
  const section = document.querySelector<HTMLElement>('[data-projects]');
  const routes = document.querySelector<SVGGElement>('[data-wc-routes]');
  const cards = gsap.utils.toArray<HTMLElement>('[data-project-stack] .project-card');
  if (!section || !routes || !cards.length) return;
  const NS = 'http://www.w3.org/2000/svg';
  const ox = 468;
  const oy = 104;
  const paths: SVGPathElement[] = [];
  const dots: SVGCircleElement[] = [];
  cards.forEach((card) => {
    const x = +card.dataset.x!;
    const y = +card.dataset.y!;
    const cx = (ox + x) / 2;
    const cy = Math.max(12, Math.min(oy, y) - 70 - Math.abs(x - ox) * 0.12);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${ox} ${oy} Q${cx} ${cy} ${x} ${y}`);
    p.setAttribute('class', 'wc-route');
    p.setAttribute('pathLength', '1');
    routes.appendChild(p);
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', String(x));
    c.setAttribute('cy', String(y));
    c.setAttribute('r', '6');
    c.setAttribute('class', 'wc-dot');
    routes.appendChild(c);
    paths.push(p);
    dots.push(c);
  });

  const setActive = (i: number) => {
    cards.forEach((c, j) => c.classList.toggle('is-active', j === i));
    paths.forEach((p, j) => p.classList.toggle('is-active', j === i));
    dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
  };
  setActive(0);
  if (reducedMotion) return;

  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(dots, { scale: 0, transformOrigin: 'center', transformBox: 'fill-box' });
      const n = cards.length;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * (n * 0.7)}`,
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => setActive(Math.min(n - 1, Math.floor(self.progress * n * 0.999))),
        },
      });
      paths.forEach((p, i) => {
        tl.to(p, { strokeDashoffset: 0, duration: 0.6, ease: 'power1.inOut' }, i);
        tl.to(dots[i], { scale: 1, duration: 0.2, ease: 'power3.out' }, i + 0.55);
      });
      tl.to({}, { duration: 0.4 });
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set([...paths, ...dots], { clearProps: 'all' });
      };
    },
    '(max-width: 1023px)': () => {
      const t = gsap.fromTo(paths, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.15, ease: 'power2.inOut', scrollTrigger: { trigger: '[data-worldchart]', start: 'top 80%', once: true } });
      return () => t.kill();
    },
  });
}
