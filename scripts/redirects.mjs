/**
 * Writes vercel.json: permanent redirects from the old Wix site to the new pages.
 * Old Dutch pages lived at the root, the English mirror under /en/. Sources are
 * anchored, case-insensitive regexes so `^/contact$` (old Dutch page) never
 * catches the new English `/contact/`. Inventory checked against the live site
 * (Firecrawl map + Wix sitemaps). Run: node scripts/redirects.mjs
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const map = [
  // old Dutch pages (root) → Dutch pages
  ['^/luchtvracht/?$', '/nl/diensten/luchtvracht/'],
  ['^/zeevracht/?$', '/nl/diensten/zeevracht/'],
  ['^/weg-transport/?$', '/nl/diensten/wegtransport/'],
  ['^/s-projects-basic/?$', '/nl/diensten/projecten/'],
  ['^/diensten/?$', '/nl/#services'],
  ['^/over/?$', '/nl/over-ons/'],
  ['^/meet-the-team/?$', '/nl/over-ons/#team'],
  ['^/contact$', '/nl/contact/'],
  ['^/vraag-een-offerte-aan/?$', '/nl/contact/#enquiry'],
  ['^/blog/?$', '/nl/'],
  ['^/post/dangerous-goods/?$', '/nl/diensten/luchtvracht/'],
  ['^/post/.+$', '/nl/'],
  // old English mirror (/en/…) → English pages
  ['^/en/?$', '/'],
  ['^/en/luchtvracht/?$', '/services/air-freight/'],
  ['^/en/zeevracht/?$', '/services/sea-freight/'],
  ['^/en/weg-transport/?$', '/services/road-transport/'],
  ['^/en/s-projects-basic/?$', '/services/special-projects/'],
  ['^/en/diensten/?$', '/#services'],
  ['^/en/over/?$', '/about/'],
  ['^/en/meet-the-team/?$', '/about/#team'],
  ['^/en/contact/?$', '/contact/'],
  ['^/en/vraag-een-offerte-aan/?$', '/contact/#enquiry'],
  ['^/en/blog/?$', '/'],
  ['^/en/post/dangerous-goods/?$', '/services/air-freight/'],
  ['^/en/post/.+$', '/'],
];

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  routes: [
    ...map.map(([src, to]) => ({ src: `(?i)${src}`, status: 301, headers: { Location: to } })),
    // static assets with hashed names can be cached for a year
    { src: '^/assets/(.*)$', headers: { 'cache-control': 'public, max-age=31536000, immutable' }, continue: true },
  ],
};
writeFileSync(resolve(import.meta.dirname, '..', 'vercel.json'), JSON.stringify(config, null, 2) + '\n');
console.log(`vercel.json: ${map.length} redirects`);
export { map };
