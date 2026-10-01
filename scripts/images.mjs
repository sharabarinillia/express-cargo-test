// Builds responsive AVIF/WebP sets from brand/ sources into public/img.
// Source provenance: brand/photos = extracted from the Express Cargo deck;
// brand/site-photos = downloaded from the current express-cargo.nl site.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const SETS = {
  'hero-runway': ['brand/photos/runway-approach-lights.jpg', [768, 1280, 1920, 2400]],
  'air-apron': ['brand/photos/schiphol-klm-apron.jpg', [768, 1280, 1920]],
  'obc-case': ['brand/photos/obc-courier-suitcase.jpg', [640, 1060]],
  'lab-tubes': ['brand/photos/lab-sample-tubes.jpg', [768, 1280, 1920]],
  'specimen-box': ['brand/photos/specimen-transport-box.jpg', [640, 1060]],
  'cold-store': ['brand/photos/cold-store-warehouse.jpg', [768, 1280]],
  'cold-doors': ['brand/photos/cold-store-doors.jpg', [640, 1060]],
  'truck-motion': ['brand/photos/truck-motion-hero.jpg', [768, 1280, 1920, 2400]],
  'containership': ['brand/photos/aerial-containership.jpg', [640, 1060]],
  'schiphol-aerial': ['brand/photos/schiphol-aerial.jpg', [640, 1035]],
  'world-map': ['brand/photos/world-map-outline-white.jpg', [1342]],
  'project-white-glove': ['brand/site-photos/project-white-glove.jpg', [640, 1060]],
  'project-trucks-brunei': ['brand/site-photos/project-trucks-brunei.jpg', [640, 1280]],
  'project-perth': ['brand/site-photos/project-perth-construction.jpg', [640, 800]],
  'project-crate-mexico': ['brand/site-photos/project-crate-mexico.jpg', [640, 1280]],
  'project-envirotainer': ['brand/site-photos/project-envirotainer-australia.jpg', [640, 1280]],
  'project-kenya': ['brand/site-photos/project-kenya-hospital.jpg', [640, 800]],
  'team-marcel': ['brand/site-photos/team-marcel.jpg', [480, 800]],
  'team-roy': ['brand/site-photos/team-roy.jpg', [480, 800]],
  'team-niels': ['brand/site-photos/team-niels.jpg', [480, 800]],
  'team-josette': ['brand/site-photos/team-josette.jpg', [480, 800]],
  'team-kim': ['brand/site-photos/team-kim.jpg', [480, 800]],
};

await mkdir('public/img', { recursive: true });
const manifest = {};
for (const [name, [src, widths]] of Object.entries(SETS)) {
  const meta = await sharp(src).metadata();
  const out = [];
  for (const w of widths) {
    const width = Math.min(w, meta.width);
    const crop = name === 'project-kenya' ? { left: 0, top: 0, width: meta.width, height: Math.round(meta.height * 0.9) } : null; // trims the PhotoGrid app watermark
    const base = (crop ? sharp(src).extract(crop) : sharp(src)).rotate().resize({ width, withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 5 }).toFile(`public/img/${name}-${width}.avif`);
    await base.clone().webp({ quality: 74 }).toFile(`public/img/${name}-${width}.webp`);
    out.push(width);
  }
  manifest[name] = { widths: [...new Set(out)], ratio: +(meta.width / (name === 'project-kenya' ? meta.height * 0.9 : meta.height)).toFixed(4), source: src };
  console.log(name, out.join(','));
}
await writeFile('src/content/images.json', JSON.stringify(manifest, null, 2));
