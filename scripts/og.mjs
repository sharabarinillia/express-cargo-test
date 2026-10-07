/**
 * Social share images (1200×630) for every page, English and Dutch, rendered
 * from an HTML card in Chromium so they use the site's own fonts.
 * Run (Playwright isn't a project dependency):
 *   PLAYWRIGHT=/path/to/node_modules/playwright node scripts/og.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const root = resolve(import.meta.dirname, '..');
const b64 = (p) => readFileSync(resolve(root, p)).toString('base64');
const font = (f) => `url(data:font/woff2;base64,${b64(`public/fonts/${f}`)}) format('woff2')`;
const logo = readFileSync(resolve(root, 'public/logo.svg'), 'utf8');

/** [file, image, tag EN, title EN, tag NL, title NL] */
const cards = [
  ['home', 'img/poster-hero-clouds-1920.webp', 'AMS · Since 2002', 'Your most sensitive shipments, in safe hands.', 'AMS · Sinds 2002', 'Uw meest gevoelige zendingen, in veilige handen.'],
  ['about', 'img/hero-runway-1920.webp', 'About · AMS', 'Smart logistics, even when it gets complex.', 'Over ons · AMS', 'Slimme logistiek, zelfs als het complex wordt.'],
  ['contact', 'img/poster-close-wing-1600.webp', 'Contact · Fast quotes', 'Tell us what’s moving.', 'Contact · Snelle offertes', 'Vertel wat er verzonden moet worden.'],
  ['tools', 'img/poster-air-loading-1600.webp', 'Free tool · IATA 1:6000', 'Chargeable weight & loading metre calculator', 'Gratis tool · IATA 1:6000', 'Calculator belastbaar gewicht & laadmeters'],
  ['incoterms', 'img/poster-sea-river-1600.webp', 'Resources · 11 rules', 'Incoterms® 2020: who pays, and where the risk passes.', 'Kennis · 11 regels', 'Incoterms® 2020: wie betaalt, en waar het risico overgaat.'],
  ['air-freight', 'img/poster-air-loading-1600.webp', 'Air · AMS → Worldwide', 'Air freight, door to door.', 'Lucht · AMS → Wereldwijd', 'Luchtvracht, van deur tot deur.'],
  ['sea-freight', 'img/poster-sea-river-1600.webp', 'Sea · RTM → Worldwide', 'Sea freight, full or shared.', 'Zee · RTM → Wereldwijd', 'Zeevracht, vol of gedeeld.'],
  ['road-transport', 'img/poster-road-highway-1600.webp', 'Road · Europe & beyond', 'Road transport, one box to a full trailer.', 'Weg · Europa & verder', 'Wegtransport, van één doos tot een volle trailer.'],
  ['lithium-batteries', 'img/poster-tc-cargojet-1600.webp', 'UN3480 · UN3481 · Class 9', 'Lithium batteries, shipped right the first time.', 'UN3480 · UN3481 · Klasse 9', 'Lithiumbatterijen, in één keer goed verzonden.'],
  ['special-projects', 'img/poster-close-wing-1600.webp', 'Projects · White glove', 'Projects that don’t fit a form.', 'Projecten · White glove', 'Projecten die niet in een formulier passen.'],
];

const html = (img, tag, title) => `<!doctype html><html><head><style>
@font-face { font-family: Sora; src: ${font('sora-latin-wght-normal.woff2')}; font-weight: 100 900; }
@font-face { font-family: Manrope; src: ${font('manrope-latin-wght-normal.woff2')}; font-weight: 200 800; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; position: relative; overflow: hidden; background: #0b2140; color: #fff; font-family: Manrope; }
.bg { position: absolute; inset: 0; background: url(data:image/webp;base64,${b64(`public/${img}`)}) center / cover; }
.veil { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(11,33,64,.96) 0%, rgba(11,33,64,.82) 48%, rgba(11,33,64,.25) 100%); }
.logo { position: absolute; left: 72px; top: 60px; width: 150px; }
.logo svg { width: 100%; height: auto; display: block; }
.tag { position: absolute; left: 72px; top: 220px; font-weight: 600; font-size: 22px; letter-spacing: .1em; text-transform: uppercase; color: #12c4de; }
h1 { position: absolute; left: 72px; top: 262px; width: 720px; font-family: Sora; font-weight: 650; font-size: 60px; line-height: 1.04; letter-spacing: -.035em; }
.foot { position: absolute; left: 72px; bottom: 56px; font-weight: 600; font-size: 22px; color: #c9d6e3; }
.route { position: absolute; right: 72px; top: 76px; width: 260px; border-top: 2px dashed rgba(18,196,222,.7); }
.route i { position: absolute; right: -9px; top: -10px; width: 18px; height: 18px; background: #b4236b; transform: rotate(45deg); box-shadow: 0 0 0 3px #0b2140; }
.route b { position: absolute; left: -6px; top: -7px; width: 12px; height: 12px; border-radius: 50%; background: #12c4de; }
</style></head><body><div class="bg"></div><div class="veil"></div>
<div class="logo">${logo}</div><div class="route"><b></b><i></i></div>
<p class="tag">${tag}</p><h1>${title.replace(/&/g, '&amp;')}</h1>
<p class="foot">express-cargo.nl · +31 20 333 2405</p></body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [file, img, tagEn, titleEn, tagNl, titleNl] of cards) {
  for (const [suffix, tag, title] of [['', tagEn, titleEn], ['-nl', tagNl, titleNl]]) {
    await page.setContent(html(img, tag, title), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    writeFileSync(resolve(root, `public/og/${file}${suffix}.jpg`), await page.screenshot({ type: 'jpeg', quality: 84 }));
  }
}
await browser.close();
console.log(`wrote ${cards.length * 2} share images to public/og/`);
