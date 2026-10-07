import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './shell';
import { drawIcons } from './page';

gsap.registerPlugin(ScrollTrigger);

/**
 * The journey: a sticky stage while the section scrolls past. The mode's
 * vehicle travels the track, each node lights as it is reached and the step
 * text changes with it. Without script or with reduced motion the steps are
 * a plain list.
 */
export function initJourney(): void {
  const section = document.querySelector<HTMLElement>('[data-journey]');
  if (!section || reducedMotion) return;
  const fill = section.querySelector<HTMLElement>('[data-jt-fill]');
  const vehicle = section.querySelector<HTMLElement>('[data-jt-vehicle]');
  const nodes = [...section.querySelectorAll<HTMLElement>('[data-jt-node]')];
  const steps = [...section.querySelectorAll<HTMLElement>('[data-jt-steps] > li')];
  const media = [...section.querySelectorAll<HTMLElement>('[data-jt-media] > figure')];
  // the stage's photos (all but the first are hidden) load as the section nears
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      section.querySelectorAll<HTMLImageElement>('[data-jt-media] img').forEach((img) => (img.loading = 'eager'));
      io.disconnect();
    },
    { rootMargin: '100% 0px' },
  );
  io.observe(section);
  if (!fill || !vehicle || !nodes.length) return;
  section.classList.add('is-live');
  const n = nodes.length;
  let active = -1;
  const lit = new Set<number>();

  const update = (p: number) => {
    fill.style.transform = `scaleX(${p})`;
    vehicle.style.transform = `translateX(${(p * 100).toFixed(2)}%)`;
    const a = Math.min(n - 1, Math.round(p * (n - 1)));
    nodes.forEach((node, i) => {
      const passed = p >= i / (n - 1) - 0.002;
      node.classList.toggle('is-passed', passed);
      if (passed && !lit.has(i)) {
        lit.add(i);
        drawIcons(node);
      }
    });
    if (a !== active) {
      active = a;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === a));
      media.forEach((m, i) => m.classList.toggle('is-active', i === a));
    }
  };
  update(0);
  ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: (st) => update(st.progress) });
}
