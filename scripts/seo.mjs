/**
 * Structured data and FAQ blocks, applied to every page at build time by the
 * ec-html plugin (vite.config.ts).
 *
 * - One JSON-LD @graph per page: the Organization (same @id everywhere),
 *   WebSite, the WebPage, breadcrumbs on inner pages, and the page's own
 *   nodes (Service, WebApplication, DefinedTermSet, people, FAQPage).
 * - FAQ answers live in src/content/faq.json; the same data renders the
 *   visible block (`<!-- @faq -->`) and the FAQPage markup.
 * - validateGraph() and validatePages() fail the build on broken markup or
 *   duplicate titles, descriptions and canonicals.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const SITE = 'https://www.express-cargo.nl';
const ORG = `${SITE}/#org`;
const WEBSITE = `${SITE}/#website`;
const faq = JSON.parse(readFileSync(resolve(import.meta.dirname, '../src/content/faq.json'), 'utf8'));

/** short names for breadcrumbs, [en, nl] */
const CRUMBS = {
  '/about/': ['About us', 'Over ons'],
  '/contact/': ['Contact', 'Contact'],
  '/tools/': ['Shipping tools', 'Verzendtools'],
  '/resources/': ['Incoterms® 2020', 'Incoterms® 2020'],
  '/services/air-freight/': ['Air freight', 'Luchtvracht'],
  '/services/sea-freight/': ['Sea freight', 'Zeevracht'],
  '/services/road-transport/': ['Road transport', 'Wegtransport'],
  '/services/special-projects/': ['Projects & white glove', 'Projecten & white glove'],
  '/services/lithium-batteries/': ['Lithium batteries', 'Lithiumbatterijen'],
};
const PAGE_TYPE = { '/about/': 'AboutPage', '/contact/': 'ContactPage' };

const organization = {
  '@type': ['Organization', 'LocalBusiness'],
  '@id': ORG,
  name: 'Express Cargo',
  alternateName: 'Express-Cargo Amsterdam',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/logo-ink.svg` },
  image: `${SITE}/og/home.jpg`,
  description:
    'Specialist freight forwarder at Amsterdam Schiphol since 2002: air, sea and road freight, dangerous goods (IATA DGR), clinical trials, biological samples on dry ice, temperature-controlled and white glove shipments.',
  foundingDate: '2002',
  email: 'salesams@express-cargo.nl',
  telephone: '+31 20 333 2405',
  address: { '@type': 'PostalAddress', streetAddress: 'Breguetlaan 21', postalCode: '1438 BA', addressLocality: 'Oude Meer', addressRegion: 'Noord-Holland', addressCountry: 'NL' },
  hasMap: 'https://maps.google.com/?cid=6484987491529801286',
  areaServed: 'Worldwide',
  parentOrganization: { '@type': 'Organization', name: 'Express-Cargo Group' },
  memberOf: [
    { '@type': 'Organization', name: 'International Air Transport Association (IATA)' },
    { '@type': 'Organization', name: 'Global Logistics Network' },
  ],
  knowsAbout: ['Air freight', 'Sea freight', 'Road transport', 'Dangerous goods (IATA DGR)', 'Lithium batteries', 'Clinical trial logistics', 'UN3373 biological samples', 'Dry ice shipments', 'Temperature-controlled logistics', 'Bonded warehousing', 'White glove delivery', 'Incoterms'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+31 20 333 2405', email: 'salesams@express-cargo.nl', availableLanguage: ['English', 'Dutch'] },
  sameAs: ['https://www.linkedin.com/company/express-cargo-amsterdam/'],
};

const website = {
  '@type': 'WebSite',
  '@id': WEBSITE,
  url: `${SITE}/`,
  name: 'Express Cargo',
  inLanguage: ['en', 'nl'],
  publisher: { '@id': ORG },
};

const TEAM = [
  ['Marcel Sannes', 'Director', 'Directeur', 'marcel@express-cargo.nl'],
  ['Roy van Zwieten', 'Operations manager', 'Operationeel manager', 'roy@express-cargo.nl'],
  ['Niels Meijaard', 'Export', 'Export', 'exportams@express-cargo.nl'],
  ['Josette van Kaam', 'Import', 'Import', 'importams@express-cargo.nl'],
  ['Kim Sannes', 'Accounting', 'Administratie', 'accounting@express-cargo.nl'],
];

const pick = (html, re) => html.match(re)?.[1]?.trim();
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;');

/** the FAQ block for a page, or '' when the page has none */
export function renderFaq(en, lang) {
  const items = faq[en]?.[lang];
  if (!items) return '';
  const t = lang === 'nl' ? { kicker: 'Veelgestelde vragen', title: 'Vragen, direct beantwoord.' } : { kicker: 'Questions', title: 'Questions, answered.' };
  return `<section class="section faq" id="faq" aria-labelledby="faq-title">
        <div class="wrap grid gap-x-10 gap-y-8 lg:grid-cols-12">
          <div class="lg:col-span-4">
            <p class="chart flex items-center gap-2 text-cyan-ink" data-reveal><ec-icon name="message-circle-question" class="!h-[18px] !w-[18px]" /> ${t.kicker}</p>
            <h2 id="faq-title" class="display display-l mt-4" data-split>${t.title}</h2>
          </div>
          <div class="faq-list lg:col-span-8" data-stagger>
            ${items.map(([q, a], i) => `<details class="faq-item"${i === 0 ? ' open' : ''}><summary><span>${esc(q)}</span><ec-icon name="plus" /></summary><p>${esc(a)}</p></details>`).join('\n            ')}
          </div>
        </div>
      </section>`;
}

/** the JSON-LD graph for one page, read from its own head and markup */
export function buildGraph(html, en, page, lang) {
  const canonical = pick(html, /<link rel="canonical" href="([^"]+)"/);
  const title = text(pick(html, /<title>([\s\S]*?)<\/title>/) ?? '');
  const description = pick(html, /<meta name="description" content="([^"]*)"/)?.replace(/&amp;/g, '&');
  const image = pick(html, /<meta property="og:image" content="([^"]+)"/);
  const nl = lang === 'nl';
  const home = nl ? `${SITE}/nl/` : `${SITE}/`;
  const pageId = `${canonical}#webpage`;
  const graph = [organization, website];

  const webpage = {
    '@type': PAGE_TYPE[en] ?? 'WebPage',
    '@id': pageId,
    url: canonical,
    name: title,
    description,
    inLanguage: lang,
    isPartOf: { '@id': WEBSITE },
    publisher: { '@id': ORG },
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
  };
  if (en === '/' || en === '/about/' || en === '/contact/') webpage.about = { '@id': ORG };
  graph.push(webpage);

  if (CRUMBS[en]) {
    webpage.breadcrumb = { '@id': `${canonical}#breadcrumb` };
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: home },
        { '@type': 'ListItem', position: 2, name: CRUMBS[en][nl ? 1 : 0], item: canonical },
      ],
    });
  }

  if (en.startsWith('/services/')) {
    const name = text(pick(html, /<meta property="og:title" content="([^"|]+)/) ?? CRUMBS[en][nl ? 1 : 0]);
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name,
      serviceType: CRUMBS[en][0],
      description,
      url: canonical,
      areaServed: nl ? 'Wereldwijd' : 'Worldwide',
      provider: { '@id': ORG },
      mainEntityOfPage: { '@id': pageId },
    });
  }

  if (en === '/tools/') {
    graph.push({
      '@type': 'WebApplication',
      '@id': `${canonical}#app`,
      name: nl ? 'Calculator belastbaar gewicht & laadmeters' : 'Chargeable weight & loading metre calculator',
      url: canonical,
      description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any (runs in the browser)',
      isAccessibleForFree: true,
      inLanguage: lang,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      provider: { '@id': ORG },
      featureList: nl
        ? ['Luchtvracht IATA 1:6000', 'Koerier 1:5000', 'Weg 1 m³ = 333 kg', 'Zee LCL W/M 1 m³ = 1.000 kg', 'Laadmeters op een trailer van 13,6 m']
        : ['Air freight IATA 1:6000', 'Courier 1:5000', 'Road 1 m³ = 333 kg', 'Sea LCL W/M 1 m³ = 1,000 kg', 'Loading metres on a 13.6 m trailer'],
    });
  }

  if (en === '/resources/') {
    const terms = [...html.matchAll(/<li class="ic-term" id="term-(\w+)"[^>]*>[\s\S]*?<h3[^>]*><b>(\w+)<\/b>\s*([^<]+)<\/h3>[\s\S]*?<span><b>[^<]+<\/b>\s*([^<]+)<\/span>[\s\S]*?<p class="copy[^"]*">([^<]+)<\/p>/g)];
    graph.push({
      '@type': 'DefinedTermSet',
      '@id': `${canonical}#incoterms`,
      name: 'Incoterms® 2020',
      description: nl ? 'De elf Incoterms® 2020-regels van de International Chamber of Commerce.' : 'The eleven Incoterms® 2020 rules of the International Chamber of Commerce.',
      inLanguage: lang,
      hasDefinedTerm: terms.map(([, id, code, name, passes, note]) => ({
        '@type': 'DefinedTerm',
        '@id': `${canonical}#term-${id}`,
        termCode: code,
        name: `${code} (${name.trim()})`,
        description: `${text(passes)} ${text(note)}`,
        url: `${canonical}#term-${id}`,
        inDefinedTermSet: { '@id': `${canonical}#incoterms` },
      })),
    });
  }

  if (en === '/services/lithium-batteries/') {
    // the four UN numbers for lithium batteries, as answered on the page (IATA DGR 2026)
    const UN = nl
      ? [
          ['UN3480', 'Lithium ion batteries', 'Lithium-ionbatterijen die los worden verzonden, ook powerbanks. IATA-verpakkingsinstructie 965; alleen vrachtvliegtuig; maximaal 30% laadtoestand.'],
          ['UN3481', 'Lithium ion batteries packed with / contained in equipment', 'Lithium-ionbatterijen bij apparatuur (PI 966) of in apparatuur (PI 967). Passagiers- of vrachtvliegtuig binnen de limieten per pakket; sinds 1 januari 2026 maximaal 30% laadtoestand als ze bij apparatuur zijn verpakt.'],
          ['UN3090', 'Lithium metal batteries', 'Lithiummetaalbatterijen die los worden verzonden. IATA-verpakkingsinstructie 968; alleen vrachtvliegtuig.'],
          ['UN3091', 'Lithium metal batteries packed with / contained in equipment', 'Lithiummetaalbatterijen bij apparatuur (PI 969) of in apparatuur (PI 970). Passagiers- of vrachtvliegtuig binnen de limieten per pakket.'],
        ]
      : [
          ['UN3480', 'Lithium ion batteries', 'Lithium-ion batteries shipped on their own, including power banks. IATA packing instruction 965; cargo aircraft only; at most 30% state of charge.'],
          ['UN3481', 'Lithium ion batteries packed with / contained in equipment', 'Lithium-ion batteries packed with equipment (PI 966) or contained in it (PI 967). Passenger or cargo aircraft within the package limits; since 1 January 2026 at most 30% state of charge when packed with equipment.'],
          ['UN3090', 'Lithium metal batteries', 'Lithium metal batteries shipped on their own. IATA packing instruction 968; cargo aircraft only.'],
          ['UN3091', 'Lithium metal batteries packed with / contained in equipment', 'Lithium metal batteries packed with equipment (PI 969) or contained in it (PI 970). Passenger or cargo aircraft within the package limits.'],
        ];
    graph.push({
      '@type': 'DefinedTermSet',
      '@id': `${canonical}#un-numbers`,
      name: nl ? 'UN-nummers voor lithiumbatterijen' : 'UN numbers for lithium batteries',
      description: nl ? 'De vier UN-nummers voor lithiumbatterijen in de IATA Dangerous Goods Regulations (2026).' : 'The four UN numbers for lithium batteries in the IATA Dangerous Goods Regulations (2026).',
      inLanguage: lang,
      hasDefinedTerm: UN.map(([code, name, description]) => ({
        '@type': 'DefinedTerm',
        '@id': `${canonical}#${code.toLowerCase()}`,
        termCode: code,
        name: `${code} (${name})`,
        description,
        url: `${canonical}#classifier`,
        inDefinedTermSet: { '@id': `${canonical}#un-numbers` },
      })),
    });
  }

  if (en === '/about/') {
    for (const [name, role, roleNl, email] of TEAM)
      graph.push({ '@type': 'Person', name, jobTitle: nl ? roleNl : role, email, worksFor: { '@id': ORG } });
  }

  const items = faq[en]?.[lang];
  if (items) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      inLanguage: lang,
      isPartOf: { '@id': pageId },
      mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** structural checks; returns a list of problems (empty = valid) */
export function validateGraph(data, page) {
  const problems = [];
  const fail = (m) => problems.push(`${page}: ${m}`);
  let parsed;
  try {
    parsed = JSON.parse(JSON.stringify(data));
  } catch (e) {
    return [`${page}: JSON-LD does not serialise (${e.message})`];
  }
  if (parsed['@context'] !== 'https://schema.org') fail('missing @context');
  const nodes = parsed['@graph'] ?? [];
  const ids = new Set();
  const refs = [];
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') {
      const keys = Object.keys(v);
      if (keys.length === 1 && keys[0] === '@id') refs.push(v['@id']);
      else if (v['@id']) ids.add(v['@id']);
      Object.values(v).forEach(walk);
    }
  };
  walk(nodes);
  for (const r of refs) if (!ids.has(r)) fail(`unresolved @id reference ${r}`);
  const need = {
    Organization: ['name', 'url', 'logo', 'address', 'telephone'],
    WebSite: ['name', 'url'],
    WebPage: ['name', 'url', 'description', 'inLanguage', 'isPartOf'],
    BreadcrumbList: ['itemListElement'],
    Service: ['name', 'provider', 'description'],
    WebApplication: ['name', 'applicationCategory', 'offers'],
    DefinedTermSet: ['name', 'hasDefinedTerm'],
    FAQPage: ['mainEntity'],
    Person: ['name', 'worksFor'],
  };
  for (const n of nodes) {
    const types = [].concat(n['@type'] ?? []);
    if (!types.length) fail('node without @type');
    for (const t of types) {
      const base = ['AboutPage', 'ContactPage'].includes(t) ? 'WebPage' : t;
      for (const k of need[base] ?? []) if (n[k] === undefined || n[k] === '' || (Array.isArray(n[k]) && !n[k].length)) fail(`${t} missing ${k}`);
    }
    if (types.includes('BreadcrumbList'))
      n.itemListElement.forEach((it, i) => {
        if (it.position !== i + 1) fail('breadcrumb positions out of order');
        if (!it.item || !it.name) fail('breadcrumb item without url or name');
      });
    if (types.includes('FAQPage'))
      for (const q of n.mainEntity) if (!q.name || !q.acceptedAnswer?.text) fail('FAQ question without answer');
    if (types.includes('DefinedTermSet') && n['@id'].endsWith('#incoterms') && n.hasDefinedTerm.length !== 11) fail(`expected 11 Incoterms, found ${n.hasDefinedTerm.length}`);
    if (types.includes('DefinedTermSet') && n['@id'].endsWith('#un-numbers') && n.hasDefinedTerm.length !== 4) fail(`expected 4 lithium UN numbers, found ${n.hasDefinedTerm.length}`);
  }
  if (!nodes.some((n) => n['@id'] === ORG)) fail('Organization missing');
  return problems;
}

/** across pages: every page has a title, description and canonical, none shared */
export function validatePages(pages) {
  const problems = [];
  for (const key of ['title', 'description', 'canonical']) {
    const seen = new Map();
    for (const p of pages) {
      if (!p[key]) problems.push(`${p.page}: missing ${key}`);
      else if (seen.has(p[key])) problems.push(`${p.page}: ${key} duplicates ${seen.get(p[key])}`);
      else seen.set(p[key], p.page);
    }
  }
  for (const p of pages) if (p.canonical && p.canonical !== `${SITE}${p.page}`) problems.push(`${p.page}: canonical ${p.canonical} does not match the page URL`);
  return problems;
}
