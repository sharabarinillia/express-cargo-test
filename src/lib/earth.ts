/**
 * A small, purpose-built WebGL Earth (three.js only): Blue Marble texture with
 * terrain bump, ocean sheen and a cloud deck, a fresnel atmosphere that reads
 * on light paper, great-circle arcs drawn progressively as tubes, destination
 * markers, a pulsing ring, and HTML labels projected from 3D.
 */
import {
  AmbientLight,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
  BackSide,
  NormalBlending,
} from 'three';

export type LatLng = { lat: number; lng: number };
export type Pov = LatLng & { altitude: number };
export type ArcSpec = { from: LatLng; to: LatLng };
export type Label = LatLng & { text: string; dest?: boolean };

const R = 1;
const rad = (d: number) => (d * Math.PI) / 180;

/** lat/lng to a point on (or above) the sphere, matching three's sphere UVs */
export function toXYZ(lat: number, lng: number, r = R): Vector3 {
  const a = rad(lat);
  const b = rad(lng);
  return new Vector3(r * Math.cos(a) * Math.cos(b), r * Math.sin(a), -r * Math.cos(a) * Math.sin(b));
}

export type EarthOptions = {
  texture: string;
  bump?: string;
  water?: string;
  clouds?: string;
  small?: boolean;
};

export class Earth {
  readonly el: HTMLElement;
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(58, 1, 0.01, 100);
  private globe: Mesh;
  private cloudMesh: Mesh | null = null;
  private arcs: { mesh: Mesh<TubeGeometry, MeshBasicMaterial>; count: number }[] = [];
  private markers: Mesh<SphereGeometry, MeshBasicMaterial>[] = [];
  private ring: Mesh<RingGeometry, MeshBasicMaterial>;
  private labelLayer: HTMLElement;
  private labels: { el: HTMLElement; pos: Vector3 }[] = [];
  private dirty = true;
  private ringOn = false;
  private t0 = performance.now();
  ready: Promise<void>;

  constructor(el: HTMLElement, opts: EarthOptions) {
    this.el = el;
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000000, 0);
    el.appendChild(this.renderer.domElement);

    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'globe-labels';
    el.appendChild(this.labelLayer);

    const loader = new TextureLoader();
    const load = (url: string) =>
      new Promise<ReturnType<TextureLoader['load']>>((res, rej) => loader.load(url, res, undefined, rej));

    const seg = opts.small ? 64 : 96;
    const mat = new MeshPhongMaterial({ color: 0xffffff, shininess: 14, specular: new Color('#6f8aa6') });
    this.globe = new Mesh(new SphereGeometry(R, seg, seg), mat);
    this.scene.add(this.globe);

    // fresnel atmosphere: a soft cyan rim that also reads on light paper
    const atmo = new Mesh(
      new SphereGeometry(R * 1.14, seg, seg),
      new ShaderMaterial({
        side: BackSide,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
        uniforms: { c: { value: new Color('#7cc8f2') } },
        vertexShader: `varying vec3 vN; varying vec3 vV;
          void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        // far-side faces of the shell: strongest at the globe's limb, fading to nothing at the shell's edge
        fragmentShader: `uniform vec3 c; varying vec3 vN; varying vec3 vV;
          void main(){ float k = clamp(-dot(vN, vV) / 0.5, 0.0, 1.0); gl_FragColor = vec4(c, pow(k, 2.4) * 0.8); }`,
      }),
    );
    this.scene.add(atmo);

    this.scene.add(new AmbientLight(0xffffff, 1.35));
    const sun = new DirectionalLight(0xffffff, 1.9);
    sun.position.set(-1.6, 1.2, 2.2);
    this.camera.add(sun);
    this.scene.add(this.camera);

    const ringMat = new MeshBasicMaterial({ color: new Color('#e0458f'), transparent: true, side: DoubleSide, depthWrite: false });
    this.ring = new Mesh(new RingGeometry(0.85, 1, 48), ringMat);
    this.ring.visible = false;
    this.scene.add(this.ring);

    const tasks: Promise<unknown>[] = [
      load(opts.texture).then((t) => {
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        mat.map = t;
        mat.needsUpdate = true;
      }),
    ];
    if (opts.bump)
      tasks.push(
        load(opts.bump).then((t) => {
          mat.bumpMap = t;
          mat.bumpScale = 2.2;
          mat.needsUpdate = true;
        }),
      );
    if (opts.water)
      tasks.push(
        load(opts.water).then((t) => {
          mat.specularMap = t;
          mat.needsUpdate = true;
        }),
      );
    this.ready = Promise.all(tasks).then(() => {
      this.dirty = true;
    });
    if (opts.clouds)
      load(opts.clouds).then((t) => {
        t.colorSpace = SRGBColorSpace;
        this.cloudMesh = new Mesh(
          new SphereGeometry(R * 1.006, seg, seg),
          new MeshPhongMaterial({ map: t, transparent: true, opacity: 0.5, depthWrite: false }),
        );
        this.scene.add(this.cloudMesh);
        this.dirty = true;
      });
  }

  size(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  /** camera above lat/lng at `altitude` globe radii, looking at the centre */
  pov({ lat, lng, altitude }: Pov) {
    this.camera.position.copy(toXYZ(lat, lng, R * (1 + altitude)));
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    this.dirty = true;
  }

  setArcs(specs: ArcSpec[], small: boolean) {
    for (const a of this.arcs) {
      this.scene.remove(a.mesh);
      a.mesh.geometry.dispose();
    }
    this.arcs = specs.map(({ from, to }) => {
      const p = toXYZ(from.lat, from.lng);
      const q = toXYZ(to.lat, to.lng);
      const ang = p.angleTo(q);
      const h = 0.3 * (ang / Math.PI) * 1.4;
      const pts: Vector3[] = [];
      const N = 64;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        // slerp direction, lifted by a sine profile
        const s = Math.sin(ang);
        const v = p.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(q.clone().multiplyScalar(Math.sin(t * ang) / s));
        pts.push(v.normalize().multiplyScalar(R * (1.002 + h * Math.sin(Math.PI * t))));
      }
      const geo = new TubeGeometry(new CatmullRomCurve3(pts), 160, small ? 0.0055 : 0.0042, 6, false);
      const mesh = new Mesh(geo, new MeshBasicMaterial({ color: new Color('#12c4de'), transparent: true, opacity: 0.95 }));
      const count = geo.index!.count;
      geo.setDrawRange(0, 0);
      this.scene.add(mesh);
      return { mesh, count };
    });
    this.dirty = true;
  }

  /** draw progress 0..1 per arc, and which arc is active */
  paintArcs(progress: number[], active: number) {
    this.arcs.forEach((a, i) => {
      const t = progress[i] ?? 0;
      const n = Math.floor((a.count / 6) * t) * 6;
      a.mesh.geometry.setDrawRange(0, n);
      a.mesh.material.color.set(i === active ? '#e0458f' : '#12c4de');
      a.mesh.material.opacity = i === active ? 1 : 0.45;
      a.mesh.renderOrder = i === active ? 2 : 1;
    });
    this.dirty = true;
  }

  setMarkers(points: (LatLng & { kind: 'origin' | 'dest' | 'active' })[]) {
    for (const m of this.markers) this.scene.remove(m);
    this.markers = points.map((p) => {
      const m = new Mesh(
        new SphereGeometry(p.kind === 'origin' ? 0.014 : 0.011, 16, 16),
        new MeshBasicMaterial({ color: p.kind === 'origin' ? '#0e2a4a' : p.kind === 'active' ? '#e0458f' : '#12c4de' }),
      );
      m.position.copy(toXYZ(p.lat, p.lng, R * 1.003));
      this.scene.add(m);
      return m;
    });
    this.dirty = true;
  }

  setRing(at: LatLng | null) {
    this.ringOn = !!at;
    this.ring.visible = !!at;
    if (at) {
      const n = toXYZ(at.lat, at.lng);
      this.ring.position.copy(n.clone().multiplyScalar(R * 1.004));
      this.ring.lookAt(n.clone().multiplyScalar(2));
    }
    this.dirty = true;
  }

  setLabels(list: Label[]) {
    this.labelLayer.replaceChildren();
    this.labels = list.map((l) => {
      const el = document.createElement('span');
      el.className = `globe-label chart${l.dest ? ' is-dest' : ''}`;
      el.textContent = l.text;
      this.labelLayer.appendChild(el);
      return { el, pos: toXYZ(l.lat, l.lng, R * 1.01) };
    });
    this.dirty = true;
  }

  /** one frame; returns quickly when nothing changed */
  frame(animate: boolean) {
    if (animate && this.cloudMesh) {
      this.cloudMesh.rotation.y += 0.00012;
      this.dirty = true;
    }
    if (animate && this.ringOn) {
      const k = ((performance.now() - this.t0) % 1400) / 1400;
      const s = 0.012 + k * 0.07;
      this.ring.scale.setScalar(s);
      this.ring.material.opacity = (1 - k) * 0.9;
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.renderer.render(this.scene, this.camera);
    // labels: project to screen, hide on the far side of the globe
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;
    const camDir = this.camera.position.clone().normalize();
    for (const l of this.labels) {
      const facing = l.pos.clone().normalize().dot(camDir);
      const v = l.pos.clone().project(this.camera);
      // keep the tag inside the frame
      const half = l.el.offsetWidth / 2 + 4;
      const x = Math.min(w - half, Math.max(half, ((v.x + 1) / 2) * w));
      l.el.style.translate = `${x.toFixed(1)}px ${(((1 - v.y) / 2) * h).toFixed(1)}px`;
      l.el.style.opacity = facing > 0.12 ? '1' : '0';
    }
  }

  dispose() {
    this.renderer.dispose();
  }
}
