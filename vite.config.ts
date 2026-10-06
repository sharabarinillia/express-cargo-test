import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ImageSet = { widths: number[]; ratio: number };
const images: Record<string, ImageSet> = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'src/content/images.json'), 'utf8'),
);

/** `<!-- @include name -->` → src/partials/name.html */
function includes(html: string): string {
  return html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
    includes(readFileSync(resolve(import.meta.dirname, `src/partials/${name}.html`), 'utf8')),
  );
}

/** `<ec-img name="x" alt="…" sizes="…" class="…" loading="eager">` → responsive <picture> */
function pictures(html: string): string {
  return html.replace(/<ec-img\s+([^>]*?)\/?>/g, (_, rawAttrs: string) => {
    const attrs: Record<string, string> = {};
    rawAttrs.replace(/([\w-]+)="([^"]*)"/g, (_m: string, k: string, v: string) => ((attrs[k] = v), ''));
    const set = images[attrs.name];
    if (!set) throw new Error(`ec-img: unknown image "${attrs.name}"`);
    const srcset = (ext: string) => set.widths.map((w) => `/img/${attrs.name}-${w}.${ext} ${w}w`).join(', ');
    const largest = set.widths[set.widths.length - 1];
    const fallback = set.widths.find((w) => w >= 1000) ?? largest;
    const sizes = attrs.sizes ?? '100vw';
    const eager = attrs.loading === 'eager';
    return `<picture class="${attrs['picture-class'] ?? ''}"><source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}"><img src="/img/${attrs.name}-${fallback}.webp" alt="${attrs.alt ?? ''}" width="${largest}" height="${Math.round(largest / set.ratio)}" class="${attrs.class ?? ''}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}></picture>`;
  });
}

/** `<ec-icon name="plane" class="…">` → inline Lucide SVG (decorative, 1.5 stroke). */
function icons(html: string): string {
  return html.replace(/<ec-icon\s+([^>]*?)\/?>/g, (_, rawAttrs: string) => {
    const attrs: Record<string, string> = {};
    rawAttrs.replace(/([\w-]+)="([^"]*)"/g, (_m: string, k: string, v: string) => ((attrs[k] = v), ''));
    const file = resolve(import.meta.dirname, `node_modules/lucide-static/icons/${attrs.name}.svg`);
    let svg = readFileSync(file, 'utf8').replace(/<!--.*?-->/s, '').trim();
    svg = svg
      .replace(/class="[^"]*"/, `class="icon ${attrs.class ?? ''}" aria-hidden="true" focusable="false"`)
      .replace(/stroke-width="2"/, `stroke-width="${attrs.stroke ?? '1.5'}"`)
      .replace(/\s*width="24"\s*height="24"/, '')
      .replace(/\n\s*/g, ' ');
    return svg;
  });
}

/** `<ec-video name="x" class="…">` → muted looping inset video with responsive poster. */
function videos(html: string): string {
  return html.replace(/<ec-video\s+([^>]*?)\/?>/g, (_, rawAttrs: string) => {
    const attrs: Record<string, string> = {};
    rawAttrs.replace(/([\w-]+)="([^"]*)"/g, (_m: string, k: string, v: string) => ((attrs[k] = v), ''));
    const poster = images[`poster-${attrs.name}`];
    // posters are assigned by script as the video nears the viewport (largest and smallest width)
    const lg = poster ? poster.widths[poster.widths.length - 1] : 0;
    const sm = poster ? poster.widths[0] : 0;
    const data = poster ? ` data-poster="/img/poster-${attrs.name}-${lg}.webp" data-poster-sm="/img/poster-${attrs.name}-${sm}.webp"` : '';
    return `<video class="${attrs.class ?? ''}" muted loop playsinline preload="none" data-video${data} aria-hidden="true"><source src="/video/${attrs.name}.mp4" type="video/mp4"></video>`;
  });
}

/** English ⇄ Dutch page pairs: drives the language switch and hreflang links */
const routes: Record<string, string> = JSON.parse(readFileSync(resolve(import.meta.dirname, 'src/content/routes.json'), 'utf8'));
const SITE = 'https://www.express-cargo.nl';
/** English page → share image name in public/og/ (scripts/og.mjs) */
const OG: Record<string, string> = {
  '/': 'home', '/about/': 'about', '/contact/': 'contact', '/tools/': 'tools', '/resources/': 'incoterms',
  '/services/air-freight/': 'air-freight', '/services/sea-freight/': 'sea-freight',
  '/services/road-transport/': 'road-transport', '/services/special-projects/': 'special-projects',
};
function languages(html: string, file: string): string {
  const page = file.replace(/index\.html$/, '');
  const en = page.startsWith('/nl/') ? Object.keys(routes).find((k) => routes[k] === page) : page;
  const nl = en ? routes[en] : undefined;
  if (!en || !nl) return html;
  const alt = page.startsWith('/nl/') ? en : nl;
  // one share image per page pair, Dutch pages get the Dutch card
  const og = `${SITE}/og/${OG[en] ?? 'home'}${page.startsWith('/nl/') ? '-nl' : ''}.jpg`;
  html = html.replace(/\s*<meta property="og:image"[^>]*>/g, '');
  const meta = `<meta property="og:image" content="${og}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta name="twitter:image" content="${og}" />\n    <meta property="og:locale" content="${page.startsWith('/nl/') ? 'nl_NL' : 'en_GB'}" />\n    `;
  const links = `${meta}<link rel="alternate" hreflang="en" href="${SITE}${en}" />\n    <link rel="alternate" hreflang="nl" href="${SITE}${nl}" />\n    <link rel="alternate" hreflang="x-default" href="${SITE}${en}" />\n  </head>`;
  return html.replaceAll('{{alt-lang}}', alt).replace('</head>', links);
}

const html = (): Plugin => ({
  name: 'ec-html',
  transformIndexHtml: { order: 'pre', handler: (src, ctx) => languages(videos(icons(pictures(includes(src)))), ctx.path) },
});

/** every page, English and Dutch */
const pageInputs = Object.fromEntries(
  Object.entries(routes).flatMap(([en, nl]) => [en, nl]).map((p) => [p === '/' ? 'main' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-'), resolve(import.meta.dirname, `.${p}index.html`)]),
);

/** sitemap.xml from the same page pairs, with hreflang alternates for each URL */
const sitemap = (): Plugin => ({
  name: 'ec-sitemap',
  apply: 'build',
  generateBundle() {
    const today = new Date().toISOString().slice(0, 10);
    const entry = (loc: string, en: string, nl: string) =>
      `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
      `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${en}" />\n` +
      `    <xhtml:link rel="alternate" hreflang="nl" href="${SITE}${nl}" />\n` +
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${en}" />\n  </url>`;
    const urls = Object.entries(routes).flatMap(([en, nl]) => [entry(en, en, nl), entry(nl, en, nl)]);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml });
  },
});

export default defineConfig({
  plugins: [html(), tailwindcss(), sitemap()],
  build: {
    // the WebGL globe (three.js) is a lazy chunk fetched only near #projects
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: pageInputs,
    },
  },
});
