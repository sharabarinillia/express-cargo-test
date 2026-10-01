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

const html = (): Plugin => ({
  name: 'ec-html',
  transformIndexHtml: { order: 'pre', handler: (src) => videos(icons(pictures(includes(src)))) },
});

export default defineConfig({
  plugins: [html(), tailwindcss()],
  build: {
    // the WebGL globe (three.js) is a lazy chunk fetched only near #projects
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        contact: resolve(import.meta.dirname, 'contact/index.html'),
      },
    },
  },
});
