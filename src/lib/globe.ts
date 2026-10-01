/**
 * Projects: the routes, flown on a 3D Earth.
 *
 * The globe sits beside the project log. Scroll position through the log is a
 * continuous "flight": between two projects the camera slerps from one route
 * to the next with a small climb, and each route's arc is drawn out from
 * Schiphol as its card approaches the reading line. The card logic runs
 * without WebGL; the Earth (./earth, three.js) and its Blue Marble textures
 * are only fetched when the section is near.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './shell';

type Dest = { lat: number; lng: number; place: string; mode: string; km: number; from: { lat: number; lng: number }; code: string };
type Arc = { i: number; t: number };
type Pov = { lat: number; lng: number; altitude: number };

const AMS = { lat: 52.31, lng: 4.76 };
/** sea shipments leave from Rotterdam */
const RTM = { lat: 51.95, lng: 4.14 };
const R_EARTH = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function toVec(lat: number, lng: number): [number, number, number] {
  const a = rad(lat);
  const b = rad(lng);
  return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)];
}
function toLatLng([x, y, z]: [number, number, number]) {
  return { lat: deg(Math.atan2(z, Math.hypot(x, y))), lng: deg(Math.atan2(y, x)) };
}
/** spherical interpolation between two lat/lng points */
function slerp(p: { lat: number; lng: number }, q: { lat: number; lng: number }, t: number) {
  const a = toVec(p.lat, p.lng);
  const b = toVec(q.lat, q.lng);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const w = Math.acos(dot);
  if (w < 1e-6) return { ...p };
  const s = Math.sin(w);
  const k1 = Math.sin((1 - t) * w) / s;
  const k2 = Math.sin(t * w) / s;
  return toLatLng([a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]);
}
function centralAngle(p: { lat: number; lng: number }, q: { lat: number; lng: number }) {
  const a = toVec(p.lat, p.lng);
  const b = toVec(q.lat, q.lng);
  return Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
}
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** camera for one route: looks at a point between origin and destination,
 *  leaning toward the destination on long hauls so the arc lands near centre */
function routePov(d: { lat: number; lng: number }): Pov {
  const ang = centralAngle(AMS, d);
  const lean = ang > 1.6 ? 0.66 : 0.52;
  const c = slerp(AMS, d, lean);
  // viewed from a little south of the route, so its arc visibly lifts off the surface
  return { lat: c.lat - 12, lng: c.lng, altitude: Math.min(2.1, Math.max(1.6, 1.1 + ang * 0.42)) };
}

export function initGlobe(): void {
  const section = document.querySelector<HTMLElement>('[data-projects]');
  const host = document.querySelector<HTMLElement>('[data-globe]');
  const cards = [...document.querySelectorAll<HTMLElement>('[data-project-log] .project-card')];
  const hudRoute = document.querySelector<HTMLElement>('[data-globe-route]');
  const hudDist = document.querySelector<HTMLElement>('[data-globe-dist]');
  if (!section || !host || !cards.length) return;
  // cards dim only once scripting can light the active one
  section.classList.add('is-live');

  const dests: Dest[] = cards.map((c) => {
    const d = { lat: +c.dataset.lat!, lng: +c.dataset.lng!, place: c.dataset.place!, mode: c.dataset.mode! };
    const sea = d.mode === 'sea';
    const from = sea ? RTM : AMS;
    return { ...d, from, code: sea ? 'RTM' : 'AMS', km: Math.round((centralAngle(from, d) * R_EARTH) / 10) * 10 };
  });
  const povs: Pov[] = [{ lat: AMS.lat - 14, lng: AMS.lng + 8, altitude: 1.8 }, ...dests.map(routePov)];
  const arcs: Arc[] = dests.map((_, i) => ({ i, t: reducedMotion ? 1 : 0 }));

  // f: fractional index of the card on the reading line (-1 = before the first)
  let f = -1;
  let active = -1;
  let lastF = NaN;

  const stage = document.querySelector<HTMLElement>('[data-globe-stage]');
  function measure() {
    // the reading line is the middle of the space the cards can actually use:
    // the full viewport beside the globe, or the band below it when it sits on top
    let mid = window.innerHeight * 0.5;
    if (stage && window.innerWidth < 1024) {
      const b = Math.max(0, stage.getBoundingClientRect().bottom);
      mid = b + (window.innerHeight - b) * 0.45;
    }
    const centers = cards.map((c) => {
      const r = c.getBoundingClientRect();
      return r.top + r.height / 2 - mid;
    });
    // centers[i] is the card centre relative to the reading line (0 = on it)
    if (centers[0] > 0) {
      const lead = cards[0].getBoundingClientRect().height;
      return Math.max(-1, -centers[0] / lead);
    }
    for (let i = 0; i < centers.length - 1; i++) {
      if (centers[i + 1] > 0) return i + -centers[i] / (centers[i + 1] - centers[i]);
    }
    return cards.length - 1;
  }

  function setActive(i: number) {
    if (i === active) return;
    active = i;
    cards.forEach((c, j) => c.classList.toggle('is-active', j === i));
    const d = dests[Math.max(0, i)];
    if (hudRoute) hudRoute.textContent = `${d.code} → ${d.place}`;
    if (hudDist) hudDist.textContent = `Great-circle ${d.km.toLocaleString('en-GB')} km`;
    onActive?.(i);
  }

  let onActive: ((i: number) => void) | null = null;
  let onFrame: ((f: number) => void) | null = null;

  function tick() {
    f = measure();
    if (Math.abs(f - lastF) < 0.0005) return;
    lastF = f;
    setActive(Math.max(0, Math.min(cards.length - 1, Math.round(f))));
    onFrame?.(f);
  }
  setActive(0);
  gsap.ticker.add(tick);

  // ── WebGL Earth, loaded on approach ────────────────────────────────
  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    const { Earth } = await import('./earth');
    const small = window.innerWidth < 1024;
    const earth = new Earth(host, {
      texture: small ? '/globe/earth-2k.webp' : '/globe/earth-4k.webp',
      bump: '/globe/bump-2k.jpg',
      water: '/globe/water-1600.jpg',
      clouds: small ? undefined : '/globe/clouds-2k.webp',
      small,
    });
    earth.setArcs(dests.map((d) => ({ from: d.from, to: d })), small);

    const size = () => {
      const r = host.getBoundingClientRect();
      earth.size(r.width, r.height);
    };
    size();
    new ResizeObserver(size).observe(host);

    const paintMarks = () => {
      const d = dests[active];
      earth.setMarkers([{ ...d.from, kind: 'origin' }, ...dests.map((p, i) => ({ ...p, kind: i === active ? ('active' as const) : ('dest' as const) }))]);
      earth.setRing(reducedMotion ? null : d);
      earth.setLabels([
        { ...d.from, text: d.code },
        { lat: d.lat, lng: d.lng, text: d.place, dest: true },
      ]);
    };
    onActive = () => {
      paintMarks();
      earth.paintArcs(arcs.map((a) => a.t), active);
    };
    onFrame = (ff: number) => {
      // arcs draw out as their card approaches the reading line
      if (!reducedMotion) for (const a of arcs) a.t = smoother(clamp01((ff - (a.i - 0.8)) / 0.65));
      earth.paintArcs(arcs.map((a) => a.t), active);
      // camera: settle on each route, travel (with a small climb) between them
      const k = Math.max(-1, Math.min(cards.length - 1, ff)) + 1;
      const i0 = Math.floor(k);
      const i1 = Math.min(povs.length - 1, i0 + 1);
      const t = reducedMotion ? Math.round(k - i0) : smoother(clamp01((k - i0 - 0.15) / 0.7));
      const ll = slerp(povs[i0], povs[i1], t);
      const alt = povs[i0].altitude + (povs[i1].altitude - povs[i0].altitude) * t + Math.sin(Math.PI * t) * 0.45;
      earth.pov({ lat: ll.lat, lng: ll.lng, altitude: alt });
    };
    onActive(active);
    onFrame(f);

    // render only while the section is on screen
    let visible = false;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '100px 0px' }).observe(section);
    gsap.ticker.add(() => {
      if (visible) earth.frame(!reducedMotion);
    });
    await earth.ready;
    earth.frame(false);
    host.classList.add('is-ready');
  };

  ScrollTrigger.create({ trigger: section, start: 'top 250%', once: true, onEnter: () => void start() });
}
