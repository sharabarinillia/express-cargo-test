// Certification and network logos for the badge strip: trimmed of their white
// margin and encoded at twice the displayed height (56 px).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const out = 'public/badges';
mkdirSync(out, { recursive: true });
const logos = [
  ['iata', 'brand/site-photos/cert-iata.jpg'],
  ['sgs-academy', 'brand/site-photos/cert-sgs-academy.png'],
  ['global-logistics-network', 'brand/site-photos/network-global-logistics.png'],
];
for (const [name, src] of logos) {
  const img = sharp(src).flatten({ background: '#fff' }).trim({ background: '#fff', threshold: 18 });
  const { data, info } = await img.toBuffer({ resolveWithObject: true });
  const h = Math.min(112, info.height);
  const res = await sharp(data).resize({ height: h, kernel: 'lanczos3' }).webp({ quality: 92 }).toFile(`${out}/${name}.webp`);
  console.log(name, `${res.width}x${res.height}`);
}
