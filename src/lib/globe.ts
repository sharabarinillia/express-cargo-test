/**
 * Projects: the routes, flown on a 3D Earth.
 *
 * The globe sits beside the project log. Scroll position through the log is a
 * continuous "flight": between two projects the camera slerps from one route
 * to the next with a small climb, and each route's arc is drawn out from
 * Schiphol as its card approaches the reading line. The card logic runs
 * without WebGL; globe.gl (three.js) and the Blue Marble textures are only
 * fetched when the section is near.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './shell';

type Dest = { lat: number; lng: number; place: string; mode: string; km: number };
type Arc = { startLat: number; startLng: number; endLat: number; endLng: number; i: number; t: number; sea: boolean };
type Pov = { lat: number; lng: number; altitude: number };

const AMS = { lat: 52.31, lng: 4.76 };
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
  return { lat: c.lat - 12, lng: c.lng, altitude: Math.min(2.3, Math.max(1.55, 1.15 + ang * 0.5)) };
}

export function initGlobe(): void {
  const section = document.querySelector<HTMLElement>('[data-projects]');
  const host = document.querySelector<HTMLElement>('[data-globe]');
  const cards = [...document.querySelectorAll<HTMLElement>('[data-project-log] .project-card')];
  const hudRoute = document.querySelector<HTMLElement>('[data-globe-route]');
  const hudDist = document.querySelector<HTMLElement>('[data-globe-dist]');
  if (!section || !host || !cards.length) return;

  const dests: Dest[] = cards.map((c) => {
    const d = { lat: +c.dataset.lat!, lng: +c.dataset.lng!, place: c.dataset.place!, mode: c.dataset.mode! };
    return { ...d, km: Math.round((centralAngle(AMS, d) * R_EARTH) / 10) * 10 };
  });
  const povs: Pov[] = [{ lat: AMS.lat - 14, lng: AMS.lng + 8, altitude: 1.8 }, ...dests.map(routePov)];
  const arcs: Arc[] = dests.map((d, i) => ({ startLat: AMS.lat, startLng: AMS.lng, endLat: d.lat, endLng: d.lng, i, t: reducedMotion ? 1 : 0, sea: d.mode === 'sea' }));

  // f: fractional index of the card on the reading line (-1 = before the first)
  let f = -1;
  let active = -1;
  let lastF = NaN;

  function measure() {
    const mid = window.innerHeight * 0.5;
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
    if (hudRoute) hudRoute.textContent = `EHAM → ${d.place}`;
    if (hudDist) hudDist.textContent = `GC ${d.km.toLocaleString('en-GB')} km`;
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

  // ── WebGL globe, loaded on approach ────────────────────────────────
  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    const [{ default: Globe }, THREE] = await Promise.all([import('globe.gl'), import('three')]);
    const small = window.innerWidth < 1024;

    const globe = new Globe(host, { rendererConfig: { antialias: true, alpha: true }, animateIn: false, waitForGlobeReady: true })
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl(small ? '/globe/earth-2k.webp' : '/globe/earth-4k.webp')
      .bumpImageUrl('/globe/bump-2k.jpg')
      .showAtmosphere(true)
      .atmosphereColor('#8fd3ff')
      .atmosphereAltitude(0.16)
      .arcsData(arcs)
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcAltitudeAutoScale(0.42)
      .arcStroke(small ? 0.9 : 0.7)
      .arcDashGap(4)
      .arcDashInitialGap(0)
      .arcDashAnimateTime(0)
      .arcsTransitionDuration(0)
      .pointsData([{ ...AMS, origin: true }, ...dests.map((d, i) => ({ ...d, i }))])
      .pointAltitude(0.01)
      .pointRadius((d: object) => ((d as { origin?: boolean }).origin ? 0.7 : 0.5))
      .pointsTransitionDuration(0)
      .ringMaxRadius(4.5)
      .ringPropagationSpeed(2.2)
      .ringRepeatPeriod(1300)
      .ringColor(() => (t: number) => `rgba(236, 72, 153, ${1 - t})`)
      .htmlAltitude(0.015)
      .htmlTransitionDuration(0)
      .htmlElement((d: object) => {
        const el = document.createElement('span');
        const lab = d as { text: string; dest?: boolean };
        el.className = `globe-label chart${lab.dest ? ' is-dest' : ''}`;
        el.textContent = lab.text;
        return el;
      });

    // ocean sheen: the water mask drives the specular highlight
    const mat = globe.globeMaterial() as InstanceType<typeof THREE.MeshPhongMaterial>;
    new THREE.TextureLoader().load('/globe/water-1600.jpg', (tex) => {
      mat.specularMap = tex;
      mat.specular = new THREE.Color('#6f8aa6');
      mat.shininess = 14;
      mat.needsUpdate = true;
    });

    // a thin, slow cloud deck (desktop only)
    let clouds: InstanceType<typeof THREE.Mesh> | null = null;
    if (!small) {
      new THREE.TextureLoader().load('/globe/clouds-2k.webp', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        clouds = new THREE.Mesh(
          new THREE.SphereGeometry(globe.getGlobeRadius() * 1.006, 72, 72),
          new THREE.MeshPhongMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false }),
        );
        globe.scene().add(clouds);
      });
    }

    const renderer = globe.renderer();
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const controls = globe.controls();
    controls.enabled = false;
    controls.enableZoom = false;
    controls.autoRotate = false;

    const size = () => {
      const r = host.getBoundingClientRect();
      globe.width(r.width).height(r.height);
    };
    size();
    new ResizeObserver(size).observe(host);

    const colorFor = (a: Arc) => (a.i === active ? ['#ff7ab8', '#e0458f'] : ['rgba(18,196,222,0.95)', 'rgba(110,230,245,0.95)']);
    const paintArcs = () => {
      globe
        .arcColor((d: object) => colorFor(d as Arc))
        .arcDashLength((d: object) => Math.max(0.0001, (d as Arc).t))
        .arcStroke((d: object) => ((d as Arc).i === active ? (small ? 1.2 : 0.95) : small ? 0.7 : 0.55));
    };
    const paintMarks = () => {
      const d = dests[active];
      globe
        .pointColor((p: object) => {
          const q = p as { origin?: boolean; i?: number };
          return q.origin ? '#0e2a4a' : q.i === active ? '#e0458f' : '#12c4de';
        })
        .ringsData(reducedMotion ? [] : [{ lat: d.lat, lng: d.lng }])
        .htmlElementsData([
          { lat: AMS.lat, lng: AMS.lng, text: 'EHAM' },
          { lat: d.lat, lng: d.lng, text: d.place, dest: true },
        ]);
    };
    onActive = () => {
      paintArcs();
      paintMarks();
    };

    let lastPov = '';
    onFrame = (ff: number) => {
      // arcs draw out as their card approaches the reading line
      if (!reducedMotion) for (const a of arcs) a.t = smoother(clamp01((ff - (a.i - 0.8)) / 0.65));
      paintArcs();
      // camera: settle on each route, travel (with a small climb) between them
      const k = Math.max(-1, Math.min(cards.length - 1, ff)) + 1;
      const i0 = Math.floor(k);
      const i1 = Math.min(povs.length - 1, i0 + 1);
      const t = reducedMotion ? Math.round(k - i0) : smoother(clamp01((k - i0 - 0.15) / 0.7));
      const ll = slerp(povs[i0], povs[i1], t);
      const alt = povs[i0].altitude + (povs[i1].altitude - povs[i0].altitude) * t + Math.sin(Math.PI * t) * 0.45;
      const key = `${ll.lat.toFixed(2)},${ll.lng.toFixed(2)},${alt.toFixed(3)}`;
      if (key !== lastPov) {
        lastPov = key;
        globe.pointOfView({ lat: ll.lat, lng: ll.lng, altitude: alt }, 0);
      }
    };

    onActive(active);
    onFrame(f);
    globe.onGlobeReady(() => host.classList.add('is-ready'));

    // only render while the section is on screen
    let visible = true;
    new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) globe.resumeAnimation();
        else globe.pauseAnimation();
      },
      { rootMargin: '100px 0px' },
    ).observe(section);
    gsap.ticker.add(() => {
      if (visible && clouds && !reducedMotion) clouds.rotation.y += 0.00012;
    });
  };

  ScrollTrigger.create({ trigger: section, start: 'top 250%', once: true, onEnter: () => void start() });
}
