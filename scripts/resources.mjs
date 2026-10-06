/**
 * Generates the resources page (Incoterms® 2020 chart + useful links) and a
 * downloadable chart image (SVG + PNG) from one data set.
 * Run: node scripts/resources.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

/** stages of a shipment, origin to destination */
const stages = [
  ['package', 'Load', 'Packing and loading at origin'],
  ['file-check', 'Export', 'Export customs clearance'],
  ['truck', 'To port', 'Pre-carriage to the port or terminal'],
  ['forklift', 'Origin', 'Origin terminal handling and loading'],
  ['plane', 'Main leg', 'Main carriage (air or sea freight)'],
  ['shield-check', 'Insure', 'Cargo insurance'],
  ['anchor', 'Arrival', 'Destination terminal handling'],
  ['route', 'To door', 'On-carriage to the named place'],
  ['package-open', 'Unload', 'Unloading at destination'],
  ['file-text', 'Import', 'Import clearance, duties and taxes'],
];

/**
 * costs: S = seller pays, B = buyer pays, - = not required (party at risk decides).
 * risk: number of stages after which risk passes to the buyer (0 = before loading).
 */
const terms = [
  { code: 'EXW', name: 'Ex Works', mode: 'any', costs: 'BBBBB-BBBB', risk: 0, passes: 'At the seller’s premises, goods made available, not loaded.', note: 'The buyer does everything, including export clearance in the seller’s country. Often a poor fit for exports outside the EU.' },
  { code: 'FCA', name: 'Free Carrier', mode: 'any', costs: 'SSSBB-BBBB', risk: 3, passes: 'When handed to the buyer’s carrier at the named place (loaded, if that is the seller’s premises).', note: 'The usual choice for air freight and containers: the seller clears export, the buyer books the main leg.' },
  { code: 'CPT', name: 'Carriage Paid To', mode: 'any', costs: 'SSSSS-BBBB', risk: 3, passes: 'When handed to the first carrier, although the seller pays carriage to destination.', note: 'Cost and risk split at different points: the buyer carries the risk of a leg the seller paid for.' },
  { code: 'CIP', name: 'Carriage and Insurance Paid To', mode: 'any', costs: 'SSSSSSBBBB', risk: 3, passes: 'When handed to the first carrier.', note: 'As CPT, plus insurance by the seller at the highest level of cover (Institute Cargo Clauses A).' },
  { code: 'DAP', name: 'Delivered at Place', mode: 'any', costs: 'SSSSS-SSBB', risk: 8, passes: 'At the named destination, on the arriving vehicle, ready for unloading.', note: 'The seller delivers to the door; the buyer unloads and clears import.' },
  { code: 'DPU', name: 'Delivered at Place Unloaded', mode: 'any', costs: 'SSSSS-SSSB', risk: 9, passes: 'At the named destination, once unloaded.', note: 'The only rule where the seller unloads at destination. Replaced DAT in 2020.' },
  { code: 'DDP', name: 'Delivered Duty Paid', mode: 'any', costs: 'SSSSS-SSBS', risk: 8, passes: 'At the named destination, ready for unloading, import cleared.', note: 'Maximum obligation for the seller, including import duties and taxes in the buyer’s country.' },
  { code: 'FAS', name: 'Free Alongside Ship', mode: 'sea', costs: 'SSSBB-BBBB', risk: 3, passes: 'Alongside the vessel at the port of shipment.', note: 'Bulk and break-bulk cargo; not meant for containers.' },
  { code: 'FOB', name: 'Free on Board', mode: 'sea', costs: 'SSSSB-BBBB', risk: 4, passes: 'On board the vessel at the port of shipment.', note: 'Sea and inland waterway only. For containers, ICC recommends FCA instead.' },
  { code: 'CFR', name: 'Cost and Freight', mode: 'sea', costs: 'SSSSS-BBBB', risk: 4, passes: 'On board the vessel at the port of shipment, although the seller pays freight to destination port.', note: 'Sea and inland waterway only. For containers, CPT is the closer fit.' },
  { code: 'CIF', name: 'Cost, Insurance and Freight', mode: 'sea', costs: 'SSSSSSBBBB', risk: 4, passes: 'On board the vessel at the port of shipment.', note: 'As CFR, plus minimum insurance cover by the seller (Institute Cargo Clauses C).' },
];

const links = [
  ['Rules & trade', 'scroll-text', [
    ['ICC: Incoterms® rules', 'The official source, from the International Chamber of Commerce.', 'https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/'],
    ['EU TARIC', 'Commodity codes, duty rates and measures for the EU.', 'https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp'],
    ['EORI number check', 'Validate a company’s EU customs registration.', 'https://ec.europa.eu/taxation_customs/dds2/eos/eori_validation.jsp'],
    ['Dutch Customs (Douane)', 'Import, export and declarations in the Netherlands.', 'https://www.douane.nl/en/'],
  ]],
  ['Dangerous goods & pharma', 'triangle-alert', [
    ['IATA Dangerous Goods Regulations', 'The rules for shipping dangerous goods by air.', 'https://www.iata.org/en/publications/dgr/'],
    ['IATA lithium battery guidance', 'Packing and labelling for UN3480, UN3481, UN3090 and UN3091.', 'https://www.iata.org/en/programs/cargo/dgr/lithium-batteries/'],
    ['IATA pharma (CEIV Pharma)', 'The industry standard for temperature-controlled pharma.', 'https://www.iata.org/en/programs/cargo/pharma/'],
    ['Envirotainer', 'Active temperature-controlled air cargo containers.', 'https://www.envirotainer.com/'],
  ]],
  ['Tracking', 'radar', [
    ['Air waybill tracking', 'Look up an air cargo shipment by AWB number.', 'https://www.track-trace.com/aircargo'],
    ['Container tracking', 'Look up a sea container by container number.', 'https://www.track-trace.com/container'],
    ['IATA e-AWB', 'How the electronic air waybill works.', 'https://www.iata.org/en/programs/cargo/e/eawb/'],
  ]],
];

const esc = (s) => s.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const who = { S: 'Seller', B: 'Buyer', '-': 'Not required' };

function chartTable() {
  const head = stages.map(([icon, short, full], i) => `<th scope="col" title="${esc(full)}"><ec-icon name="${icon}" /><span class="ic-short">${short}</span><span class="ic-num">${i + 1}</span><span class="sr-only">${esc(full)}</span></th>`).join('');
  const rows = terms
    .map((t) => {
      const cells = [...t.costs]
        .map((c, i) => `<td class="c-${c === '-' ? 'n' : c.toLowerCase()}${t.risk === i + 1 ? ' is-risk' : ''}${t.risk === 0 && i === 0 ? ' is-risk-start' : ''}"><span class="sr-only">${who[c]}${t.risk === i + 1 || (t.risk === 0 && i === 0) ? ', risk passes here' : ''}</span></td>`)
        .join('');
      return `<tr data-term="${t.code}" data-mode="${t.mode}"><th scope="row"><a href="#term-${t.code.toLowerCase()}"><b>${t.code}</b><span>${esc(t.name)}</span></a></th>${cells}</tr>`;
    })
    .join('\n                ');
  return `<table class="ic-table">
              <caption class="sr-only">Incoterms® 2020: who pays for each stage, and where risk passes from seller to buyer</caption>
              <thead><tr><th scope="col"><span class="chart text-mute">Rule</span></th>${head}</tr></thead>
              <tbody>
                ${rows}
              </tbody>
            </table>`;
}

function page() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Incoterms® 2020 chart and useful shipping links',
    url: 'https://www.express-cargo.nl/resources/',
    publisher: { '@type': 'Organization', name: 'Express Cargo', url: 'https://www.express-cargo.nl/' },
  };
  return `<!doctype html>
<html lang="en">
  <head>
    <!-- @include head -->
    <title>Incoterms® 2020 chart: who pays, where risk passes | Express Cargo</title>
    <meta name="description" content="A clear Incoterms® 2020 chart for all 11 rules (EXW, FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR, CIF): which party pays each stage and where risk passes. Plus useful links for customs, dangerous goods and tracking." />
    <link rel="canonical" href="https://www.express-cargo.nl/resources/" />
    <meta property="og:title" content="Incoterms® 2020 chart | Express Cargo" />
    <meta property="og:description" content="All 11 rules on one chart: who pays for each stage and where the risk passes." />
    <meta property="og:url" content="https://www.express-cargo.nl/resources/" />
    <meta property="og:image" content="https://www.express-cargo.nl/resources/incoterms-2020-chart.png" />
    <script type="application/ld+json">
      ${JSON.stringify(ld)}
    </script>
    <script type="module" src="/src/resources.ts"></script>
  </head>
  <body>
    <!-- @include header -->

    <main id="main">
      <section class="page-hero" data-page-hero>
        <div class="wrap grid items-end gap-x-12 gap-y-8 lg:grid-cols-12">
          <div class="lg:col-span-8">
            <p class="chart flex items-center gap-2 text-cyan-ink" data-fade><ec-icon name="scroll-text" class="!h-[18px] !w-[18px]" /> Resources</p>
            <h1 class="display display-xl mt-5 max-w-[15ch]" data-split>Who pays, and where the risk passes.</h1>
          </div>
          <div class="lg:col-span-4" data-fade>
            <p class="lede">All eleven Incoterms® 2020 rules on one chart, with what each one means for your shipment.</p>
            <div class="mt-6 flex flex-wrap gap-3">
              <a class="btn btn-ink" href="/resources/incoterms-2020-chart.png" download><ec-icon name="download" /> Save the chart</a>
              <a class="btn-text" href="#links">Useful links</a>
            </div>
          </div>
        </div>
      </section>

      <!-- CHART: pinned while the rules scroll past ─────────────── -->
      <section class="section !pt-4" id="incoterms" aria-labelledby="ic-title">
        <div class="wrap">
          <h2 id="ic-title" class="sr-only">Incoterms® 2020 chart</h2>
          <div class="ic-layout">
            <div class="ic-pin" data-ic-pin>
              <div class="ic-card" data-reveal>
                <div class="ic-top">
                  <div class="ic-filter" role="group" aria-label="Show rules for">
                    <button type="button" aria-pressed="true" data-filter="all">All 11</button>
                    <button type="button" aria-pressed="false" data-filter="any">Any mode</button>
                    <button type="button" aria-pressed="false" data-filter="sea">Sea &amp; waterway</button>
                  </div>
                  <ul class="ic-legend chart" aria-label="Legend">
                    <li><i class="c-s"></i> Seller pays</li>
                    <li><i class="c-b"></i> Buyer pays</li>
                    <li><i class="ic-dia"></i> Risk passes</li>
                  </ul>
                </div>
                <div class="ic-scroll" data-ic-chart>
            ${chartTable()}
                </div>
                <ol class="ic-key">
                  ${stages.map(([, , full], i) => `<li><b class="chart">${i + 1}</b> ${esc(full)}</li>`).join('\n                  ')}
                </ol>
              </div>
            </div>

            <!-- phones: the rule being read stays pinned under the header -->
            <div class="ic-mini" aria-hidden="true" data-ic-mini><b class="chart-l" data-ic-mini-code></b><span class="ic-mini-cells" data-ic-mini-cells></span></div>
            <ol class="ic-terms" data-ic-terms>
              ${terms
                .map(
                  (t) => `<li class="ic-term" id="term-${t.code.toLowerCase()}" data-term="${t.code}" data-mode="${t.mode}">
                <p class="chart ${t.mode === 'sea' ? 'text-cyan-ink' : 'text-mute'}">${t.mode === 'sea' ? 'Sea &amp; inland waterway' : 'Any mode of transport'}</p>
                <h3 class="mt-2"><b>${t.code}</b> ${esc(t.name)}</h3>
                <p class="ic-passes"><ec-icon name="diamond" /> <span><b>Risk passes</b> ${esc(t.passes)}</span></p>
                <p class="copy mt-3 text-[0.98rem]">${esc(t.note)}</p>
              </li>`,
                )
                .join('\n              ')}
            </ol>
          </div>
          <p class="mt-6 max-w-[78ch] text-sm text-ink-2" data-reveal>A simplified overview for planning. The full rules, including where costs such as terminal handling fall in your contract of carriage, are in the ICC publication. Incoterms® is a registered trademark of the International Chamber of Commerce. Not sure which rule fits? Ask your coordinator.</p>
        </div>
      </section>

      <!-- USEFUL LINKS ─────────────────────────────────────────── -->
      <section id="links" class="section bg-paper-2" aria-labelledby="links-title">
        <div class="wrap">
          <div class="grid gap-6 lg:grid-cols-12">
            <h2 id="links-title" class="display display-l lg:col-span-7" data-split>Useful links.</h2>
            <p class="lede self-end lg:col-span-5" data-reveal>The sources we use ourselves, for rules, customs, dangerous goods and tracking.</p>
          </div>
          <div class="link-groups mt-12">
            ${links
              .map(
                ([title, icon, items]) => `<div class="link-group">
              <p class="chart flex items-center gap-2 text-ink"><ec-icon name="${icon}" class="!h-[18px] !w-[18px] text-magenta" /> ${esc(title)}</p>
              <ul class="mt-4" data-stagger>
                ${items.map(([t, d, href]) => `<li><a class="ext-link" href="${href}" rel="noopener" target="_blank"><span><b>${esc(t)}</b><small>${esc(d)}</small></span><ec-icon name="arrow-up-right" /><span class="sr-only">(opens in a new tab)</span></a></li>`).join('\n                ')}
              </ul>
            </div>`,
              )
              .join('\n            ')}
            <div class="link-group">
              <p class="chart flex items-center gap-2 text-ink"><ec-icon name="calculator" class="!h-[18px] !w-[18px] text-magenta" /> Our free tools</p>
              <ul class="mt-4" data-stagger>
                <li><a class="ext-link" href="/tools/#chargeable"><span><b>Chargeable weight calculator</b><small>Air, courier, road and sea, piece by piece.</small></span><!-- @include arrow --></a></li>
                <li><a class="ext-link" href="/tools/#loading"><span><b>Loading metres &amp; pallets</b><small>What your pallets take on a 13.6 m trailer.</small></span><!-- @include arrow --></a></li>
                <li><a class="ext-link" href="/resources/incoterms-2020-chart.svg" download><span><b>Incoterms® 2020 chart (SVG)</b><small>The chart above, to print or pin on the wall.</small></span><ec-icon name="download" /></a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- @faq -->

      <section class="close-section" aria-labelledby="res-close">
        <div class="wrap">
          <div class="close-panel on-night" data-settle>
            <div class="grid items-end gap-8 lg:grid-cols-12">
              <div class="lg:col-span-7">
                <h2 id="res-close" class="display display-l max-w-[16ch]" data-split>Rule chosen? Let’s move it.</h2>
                <p class="lede mt-5">Tell us the Incoterm, origin and destination. Quotes go out fast.</p>
              </div>
              <div class="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
                <a class="btn btn-cyan" href="/contact/#enquiry">Request a quote <!-- @include arrow --></a>
                <a class="btn btn-line" href="tel:+31203332405"><ec-icon name="phone" /> +31 20 333 2405</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- @include footer -->
  </body>
</html>
`;
}

/** the same chart as a standalone image, in the site's colours */
const CHART = {
  en: {
    sub: 'Who pays for each stage, and where the risk passes from seller to buyer.',
    seller: 'Seller pays', buyer: 'Buyer pays', risk: 'Risk passes',
    stages: stages.map(([, short]) => short),
    names: Object.fromEntries(terms.map((t) => [t.code, t.name])),
    foot1: 'EXW to DDP: any mode of transport · FAS to CIF: sea and inland waterway only. Simplified overview; see the ICC rules for detail.',
    foot2: 'Incoterms® is a registered trademark of the International Chamber of Commerce.',
  },
  nl: {
    sub: 'Wie betaalt welke stap, en waar het risico van verkoper naar koper overgaat.',
    seller: 'Verkoper betaalt', buyer: 'Koper betaalt', risk: 'Risico gaat over',
    stages: ['Laden', 'Export', 'Naar haven', 'Vertrek', 'Hoofdreis', 'Verzekering', 'Aankomst', 'Naar deur', 'Lossen', 'Import'],
    names: Object.fromEntries(terms.map((t) => [t.code, t.name])),
    foot1: 'EXW t/m DDP: elke vervoerswijze · FAS t/m CIF: alleen zee en binnenwateren. Vereenvoudigd overzicht; zie de ICC-regels voor details.',
    foot2: 'Incoterms® is een geregistreerd handelsmerk van de International Chamber of Commerce.',
  },
};

function chartSvg(T = CHART.en) {
  // legend laid out right to left from estimated text widths (Manrope 600 at 20px)
  const legend = (T) => {
    let x = W - pad;
    const items = [
      [T.risk, (cx) => `<rect x="${cx - 7.5}" y="78" width="15" height="15" fill="${C.magenta}" transform="rotate(45 ${cx} 85.5)"/>`],
      [T.buyer, (cx) => `<rect x="${cx - 11}" y="74" width="22" height="22" rx="3" fill="${C.wash}" stroke="${C.line}"/>`],
      [T.seller, (cx) => `<rect x="${cx - 11}" y="74" width="22" height="22" rx="3" fill="${C.ink}"/>`],
    ];
    return items
      .map(([label, mark]) => {
        const w = label.length * 10.6;
        const out = `${mark(x - w - 21)}<text x="${x - w}" y="92" fill="${C.ink}" ${f(20)}>${label}</text>`;
        x -= w + 32 + 34;
        return out;
      })
      .join('\n');
  };
  const W = 1600;
  const pad = 64;
  const labelW = 390;
  const cw = (W - pad * 2 - labelW) / stages.length;
  const rowH = 58;
  const top = 250;
  const H = top + terms.length * rowH + 210;
  const C = { ink: '#0e2a4a', paper: '#eef2f5', wash: '#d6f1f6', cyan: '#12c4de', mute: '#4b5f72', magenta: '#b4236b', line: '#c9d4dd' };
  const f = (s, w = 600) => `font-family="Manrope, Arial, sans-serif" font-weight="${w}" font-size="${s}"`;
  let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${C.paper}"/>
<text x="${pad}" y="104" fill="${C.ink}" font-family="Sora, Arial, sans-serif" font-weight="700" font-size="56" letter-spacing="-1.5">Incoterms® 2020</text>
<text x="${pad}" y="148" fill="${C.mute}" ${f(24, 500)}>${T.sub}</text>
${legend(T)}

`;
  T.stages.forEach((short, i) => {
    const x = pad + labelW + cw * i + cw / 2;
    // one size per chart, small enough for its longest label
    const longest = Math.max(...T.stages.map((x) => x.length));
    const size = longest > 9 ? 13.5 : longest > 8 ? 15 : 17;
    o += `<text x="${x}" y="${top - 26}" text-anchor="middle" fill="${C.mute}" ${f(size)} letter-spacing="${size < 17 ? 0.4 : 1}">${short.toUpperCase()}</text>\n`;
  });
  terms.forEach((t, r) => {
    const y = top + r * rowH;
    if (r === 7) o += `<line x1="${pad}" x2="${W - pad}" y1="${y - 2}" y2="${y - 2}" stroke="${C.ink}" stroke-width="2" stroke-dasharray="4 6"/>\n`;
    o += `<text x="${pad}" y="${y + 36}" fill="${C.ink}" font-family="Sora, Arial, sans-serif" font-weight="700" font-size="26">${t.code}</text><text x="${pad + 82}" y="${y + 35}" fill="${C.mute}" ${f(18, 500)}>${T.names[t.code].replace(/&/g, '&amp;')}</text>\n`;
    [...t.costs].forEach((c, i) => {
      const x = pad + labelW + cw * i;
      const fill = c === 'S' ? C.ink : c === 'B' ? C.wash : C.paper;
      o += `<rect x="${x + 3}" y="${y + 8}" width="${cw - 6}" height="${rowH - 16}" rx="4" fill="${fill}"${c === '-' ? ` stroke="${C.line}" stroke-dasharray="3 4"` : ''}/>\n`;
    });
    const rx = pad + labelW + cw * t.risk;
    o += `<rect x="${rx - 10}" y="${y + rowH / 2 - 10}" width="20" height="20" fill="${C.magenta}" stroke="${C.paper}" stroke-width="3" transform="rotate(45 ${rx} ${y + rowH / 2})"/>\n`;
  });
  const fy = top + terms.length * rowH + 40;
  o += `<text x="${pad}" y="${fy}" fill="${C.mute}" ${f(17, 500)}>${T.foot1}</text>
<text x="${pad}" y="${fy + 28}" fill="${C.mute}" ${f(17, 500)}>${T.foot2}</text>
<line x1="${pad}" x2="${W - pad}" y1="${fy + 64}" y2="${fy + 64}" stroke="${C.line}"/>
<text x="${pad}" y="${fy + 116}" fill="${C.ink}" font-family="Sora, Arial, sans-serif" font-weight="700" font-size="30">Express Cargo</text>
<text x="${W - pad}" y="${fy + 114}" text-anchor="end" fill="${C.ink}" ${f(22)}>express-cargo.nl · +31 20 333 2405 · salesams@express-cargo.nl</text>
</svg>`;
  return o;
}

mkdirSync(resolve(root, 'resources'), { recursive: true });
mkdirSync(resolve(root, 'public/resources'), { recursive: true });
writeFileSync(resolve(root, 'resources/index.html'), page());
for (const [suffix, T] of [['', CHART.en], ['-nl', CHART.nl]]) {
  const svg = chartSvg(T);
  writeFileSync(resolve(root, `public/resources/incoterms-2020-chart${suffix}.svg`), svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(resolve(root, `public/resources/incoterms-2020-chart${suffix}.png`));
}
console.log('wrote resources page and chart image');
