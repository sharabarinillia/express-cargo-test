/**
 * Generates the lithium battery page in English and Dutch:
 * services/lithium-batteries/ and nl/diensten/lithiumbatterijen/.
 * Text and the air rules live in scripts/content/lithium.mjs.
 * Run: node scripts/lithium.mjs
 *
 * The illustrations are drawn here as inline SVG: a package in oblique view
 * with the Class 9 lithium battery label, the lithium battery mark and the
 * Cargo Aircraft Only label (one sprite, reused by the hero, the classifier
 * and the journey plates).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RULES, PSN, lithium } from './content/lithium.mjs';

const root = resolve(import.meta.dirname, '..');
const esc = (s) => String(s).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const LOCALES = {
  en: {
    lang: 'en', header: 'header', footer: 'footer', path: '/services/lithium-batteries/', contact: '/contact/',
    mode: (slug) => `/services/${slug}/`, fast: 'Fast quotes from a real coordinator', what: 'lithium batteries',
    cells: '9 cells × 10.7 Wh', calc: ['11.1 V · 8.7 Ah', '11.1 V × 8.7 Ah', '= 96.6 Wh'],
  },
  nl: {
    lang: 'nl', header: 'header-nl', footer: 'footer-nl', path: '/nl/diensten/lithiumbatterijen/', contact: '/nl/contact/',
    mode: (slug) => `/nl/diensten/${slug}/`, fast: 'Snelle offertes van een echte coördinator', what: 'lithiumbatterijen',
    cells: '9 cellen × 10,7 Wh', calc: ['11,1 V · 8,7 Ah', '11,1 V × 8,7 Ah', '= 96,6 Wh'],
  },
};

/* ── SVG helpers ───────────────────────────────────────────────────── */

/** inner elements of a Lucide icon */
const lucide = (name) =>
  readFileSync(resolve(root, `node_modules/lucide-static/icons/${name}.svg`), 'utf8')
    .replace(/<!--.*?-->/s, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\n\s*/g, '')
    .trim();
/** a Lucide icon inside an SVG: top-left (x, y), size and stroke in the outer SVG's units */
const glyph = (name, x, y, size, stroke = 2, cls = '') => {
  const s = size / 24;
  return `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="currentColor" stroke-width="${(stroke / s).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round">${lucide(name)}</g>`;
};
/** split text into lines of about `max` characters (SVG text does not wrap) */
const wrap = (text, max) => {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  return line ? [...lines, line] : lines;
};
const tspans = (lines, x, dy) => lines.map((l, i) => `<tspan x="${x}" dy="${i ? dy : 0}">${esc(l)}</tspan>`).join('');

/** the marks and labels, defined once per page */
const SPRITE = `<svg class="lb-sprite" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="lb-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4.5" height="9" fill="#d7262e" /></pattern>
        <clipPath id="lb-c9clip"><polygon points="50,9 91,50 9,50" /></clipPath>
        <!-- a group of batteries, one damaged and emitting flame -->
        <symbol id="lb-cells" viewBox="0 0 60 52"><g fill="#fff" stroke="#111" stroke-width="2.6" stroke-linejoin="round"><rect x="3" y="20" width="15" height="28" rx="2" /><rect x="21" y="20" width="15" height="28" rx="2" /><path d="M40 48V27l3 2.6 3.2-4.4 3.2 3.6 3.1-3.4 3.5 2.2V48z" /></g><g fill="#111"><rect x="7.5" y="15.6" width="6" height="4.4" rx="1" /><rect x="25.5" y="15.6" width="6" height="4.4" rx="1" /><path d="M48 3c4.6 5 8.4 8.6 7 14.2-.9 3.6-3.8 5.2-6.9 5.2-3.6 0-6.6-2.6-6.3-6.6.3-3.4 3.2-4.9 3.3-8.6 1.4 2 1.9 4 2 5.6 1-3.1 1.6-6.4.9-9.8z" /></g></symbol>
        <!-- Class 9 lithium battery hazard label -->
        <symbol id="lb-class9" viewBox="0 0 100 100"><polygon points="50,1 99,50 50,99 1,50" fill="#fff" stroke="#c9d4dd" stroke-width="1" /><polygon points="50,6 94,50 50,94 6,50" fill="none" stroke="#111" stroke-width="1.6" /><g clip-path="url(#lb-c9clip)" fill="#111">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${(29.7 + i * 6.2).toFixed(1)}" y="9" width="3.4" height="41" />`).join('')}</g><use href="#lb-cells" x="35" y="53" width="30" height="26" /><text x="50" y="88" text-anchor="middle" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#111">9</text><line x1="46.5" y1="89.8" x2="53.5" y2="89.8" stroke="#111" stroke-width="1.2" /></symbol>
        <!-- lithium battery mark (the UN number is added where it is used) -->
        <symbol id="lb-markframe" viewBox="0 0 120 100"><rect width="120" height="100" rx="2" fill="#fff" /><rect width="120" height="100" rx="2" fill="url(#lb-hatch)" /><rect x="7" y="7" width="106" height="86" rx="1" fill="#fff" /><use href="#lb-cells" x="34" y="11" width="52" height="45" /></symbol>
        <!-- Cargo Aircraft Only label -->
        <symbol id="lb-cao" viewBox="0 0 120 100"><rect width="120" height="100" rx="3" fill="#f28c28" /><rect x="4" y="4" width="112" height="92" rx="2" fill="none" stroke="#111" stroke-width="1.6" /><g fill="#111" font-family="Manrope, sans-serif" font-weight="800" text-anchor="middle"><text x="60" y="24" font-size="11.5">CARGO AIRCRAFT</text><text x="60" y="38" font-size="11.5">ONLY</text><text x="60" y="88.5" font-size="5.5" font-weight="700">FORBIDDEN IN PASSENGER AIRCRAFT</text></g><path fill="#111" d="M60 44c2 0 3 2 3 5v8l19 7v4l-19-4v8l6 4v3l-9-2-9 2v-3l6-4v-8l-19 4v-4l19-7v-8c0-3 1-5 3-5z" /></symbol>
      </defs>
    </svg>`;

/**
 * The package in oblique view. Front face x 30–330, y 170–420; depth (+110, −90).
 * on: marks shown at first ('class9' | 'cao' | 'mark'); text: lines printed on the
 * front instead of the battery mark; numbered: legend numbers beside the labels.
 */
function box({ un = 'UN3481', on = [], numbered = false, text = null, cls = '', label = '' }) {
  const L = (k, inner) => `<g class="lb-l${on.includes(k) ? ' is-on' : ''}" data-mark="${k}">${inner}</g>`;
  const num = (n, x, y) => (numbered ? `<g class="lb-num" data-mark-num="${n}"><circle cx="${x}" cy="${y}" r="11" /><text x="${x}" y="${y + 4.3}" text-anchor="middle">${n}</text></g>` : '');
  const front = text
    ? `<g class="lb-print">${text.map((t, i) => `<text x="176" y="${262 + i * 22}" class="${i ? 'lb-print-t' : 'lb-print-un'}">${esc(t)}</text>`).join('')}</g>`
    : L('mark', `<use href="#lb-markframe" x="176" y="246" width="138" height="115" /><text class="lb-mark-un" x="245" y="341" text-anchor="middle" data-lb-un>${un}</text>${num(2, 170, 240)}`);
  return `<svg class="lb-art ${cls}" viewBox="0 50 470 390"${label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true" focusable="false"'}>
          <path class="lb-face lb-face-top" d="M30 170L140 80H440L330 170Z" />
          <path class="lb-face lb-face-side" d="M330 170L440 80V330L330 420Z" />
          <rect class="lb-face lb-face-front" x="30" y="170" width="300" height="250" />
          <path class="lb-tape" d="M160 170L270 80H310L200 170Z" /><rect class="lb-tape" x="160" y="170" width="40" height="30" />
          <g transform="matrix(1 -0.818 0 1 330 0)" class="lb-ship"><rect x="18" y="250" width="74" height="62" rx="3" /><path d="M28 266h46M28 280h54M28 294h34" /></g>
          <path class="lb-edge" pathLength="1" d="M30 170H330V420H30Z" />
          <path class="lb-edge" pathLength="1" d="M30 170L140 80H440L330 170" />
          <path class="lb-edge" pathLength="1" d="M440 80V330L330 420" />
          ${L('cao', `<use href="#lb-cao" x="46" y="190" width="104" height="86.7" />${num(3, 40, 186)}`)}
          ${L('class9', `<use href="#lb-class9" x="46" y="292" width="108" height="108" />${num(1, 60, 306)}`)}
          ${front}
        </svg>`;
}

/* ── the journey plates (dark media panels, 480 × 360) ────────────── */

function plates(P, LC) {
  const pill = (t, x, y, cls = '') => {
    const w = Math.round(t.length * 7.3 + 26);
    return [`<g class="lb-p-pill ${cls}"><rect x="${x}" y="${y}" width="${w}" height="30" rx="15" /><text x="${x + 13}" y="${y + 19.5}">${esc(t)}</text></g>`, w];
  };
  let px = 36;
  const pills = P.tags.map((t, i) => {
    const [svg, w] = pill(t, px, 304, i === 2 ? 'is-key' : '');
    px += w + 8;
    return svg;
  });
  const within = P.within.split(', ');
  const p1 = `<svg class="lb-plate" viewBox="0 0 480 360" aria-hidden="true" focusable="false">
                  <text class="lb-p-kicker" x="36" y="50">${esc(P.example)}</text>
                  <rect class="lb-p-line" x="36" y="96" width="196" height="166" rx="16" /><rect class="lb-p-solid" x="70" y="83" width="30" height="13" rx="3" /><rect class="lb-p-solid" x="168" y="83" width="30" height="13" rx="3" />
                  <text class="lb-p-t" x="56" y="134">${esc(P.battery)}</text>
                  <text class="lb-p-big" x="56" y="166">${esc(LC.calc[0])}</text>
                  ${Array.from({ length: 9 }, (_, i) => `<circle class="lb-p-cell" style="--i: ${i}" cx="${62 + i * 18}" cy="220" r="7.5" />`).join('')}
                  <text class="lb-p-mute" x="266" y="118">${esc(P.wh)}</text>
                  <text class="lb-p-t2" x="266" y="152">${esc(LC.calc[1])}</text>
                  <text class="lb-p-xl" x="266" y="196">${esc(LC.calc[2])}</text>
                  <text class="lb-p-mute" x="266" y="226">${esc(LC.cells)}</text>
                  <path class="lb-p-rule" d="M266 244H446" />
                  <text class="lb-p-ok" x="266" y="268">${tspans([`${within[0]},`, within[1]], 266, 19)}</text>
                  ${pills.join('')}
                </svg>`;

  const p2 = `<svg class="lb-plate" viewBox="0 0 480 360" aria-hidden="true" focusable="false">
                  <rect class="lb-p-doc" x="30" y="30" width="276" height="300" rx="6" />
                  <text class="lb-p-doctitle" x="50" y="64">${esc(P.summary)}</text>
                  <path class="lb-p-rule" d="M50 78H286" />
                  ${P.tests.map((t, i) => `<g class="lb-p-row" style="--i: ${i}"><text class="lb-p-t3" x="50" y="${108 + i * 27}">${esc(t)}</text><text class="lb-p-pass" x="286" y="${108 + i * 27}" text-anchor="end">${esc(P.pass)}</text></g>`).join('')}
                  <rect class="lb-p-line" x="338" y="86" width="96" height="214" rx="12" /><rect class="lb-p-solid" x="368" y="72" width="36" height="14" rx="3" />
                  <rect class="lb-p-soc" x="346" y="232" width="80" height="60" rx="6" />
                  <path class="lb-p-mark30" d="M330 232H442" />
                  <text class="lb-p-xl is-s" x="386" y="156" text-anchor="middle">≤30%</text>
                  <text class="lb-p-mute" x="386" y="328" text-anchor="middle">${esc(P.soc)}</text>
                </svg>`;

  const notes = P.pkgNotes.map((n, i) => {
    const lines = wrap(n, 17);
    return `<g class="lb-p-note" style="--i: ${i}">${glyph('check', 300, 96 + i * 72, 20, 2.2, 'lb-p-checkicon')}<text class="lb-p-t3" x="330" y="${112 + i * 72}">${tspans(lines, 330, 18)}</text></g>`;
  });
  const p3 = `<svg class="lb-plate" viewBox="0 0 480 360" aria-hidden="true" focusable="false">
                  <text class="lb-p-kicker" x="36" y="50">${esc(P.pkgTitle)}</text>
                  <svg x="6" y="62" width="284" height="268" viewBox="0 50 470 390">${box({ on: ['class9'], text: P.pkgLines }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
                  ${notes.join('')}
                </svg>`;

  const awb = wrap(P.awbLine, 36);
  const psn = wrap(P.dgdRow[1], 22);
  const p4 = `<svg class="lb-plate" viewBox="0 0 480 360" aria-hidden="true" focusable="false">
                  <g class="lb-p-dgd">
                    <rect class="lb-p-doc" x="28" y="28" width="306" height="232" rx="5" />
                    <rect x="28" y="28" width="12" height="232" fill="url(#lb-hatch)" /><rect x="322" y="28" width="12" height="232" fill="url(#lb-hatch)" />
                    <text class="lb-p-doctitle is-s" x="52" y="58">${esc(P.dgd)}</text>
                    <path class="lb-p-rule" d="M52 72H310M52 96H310M52 150H310" />
                    <path class="lb-p-faint" d="M52 84H180M52 108H240M52 122H200" />
                    <text class="lb-p-t3 is-b" x="52" y="172">${esc(P.dgdRow[0])}</text>
                    <text class="lb-p-t4" x="114" y="172">${tspans(psn, 114, 15)}</text>
                    <text class="lb-p-t3" x="262" y="172">${esc(P.dgdRow[2])}</text>
                    <text class="lb-p-t3" x="282" y="172">${esc(P.dgdRow[3])}</text>
                    <path class="lb-p-faint" d="M52 236H170" />
                    <path class="lb-p-sign" d="M60 230c8-14 14-14 16-4s6 10 12-2 10-10 12 0 8 6 14-4" />
                    <text class="lb-p-mute is-s" x="52" y="252">${esc(P.sign)}</text>
                  </g>
                  <g class="lb-p-awb">
                    <rect class="lb-p-card" x="148" y="210" width="308" height="118" rx="6" />
                    <text class="lb-p-doctitle is-c" x="166" y="238">${esc(P.awb)}</text>
                    <text class="lb-p-awbt" x="166" y="270">${tspans(awb, 166, 22)}</text>
                  </g>
                </svg>`;

  const p5 = `<svg class="lb-plate" viewBox="0 0 480 360" aria-hidden="true" focusable="false">
                  <path class="lb-p-route" d="M40 214C140 92 330 76 440 150" />
                  <g class="lb-p-fly">${glyph('plane', 166, 58, 148, 1.6, 'lb-p-plane')}</g>
                  <g class="lb-p-cao"><rect x="130" y="216" width="220" height="36" rx="4" /><text x="240" y="239" text-anchor="middle">${esc(P.cao)}</text></g>
                  ${P.modes
                    .map((m, i) => {
                      const x = 18 + i * 150;
                      return `<g class="lb-p-mode" style="--i: ${i}"><rect x="${x}" y="280" width="144" height="48" rx="10" />${glyph(['plane', 'truck', 'ship'][i], x + 10, 293, 22, 2, 'lb-p-modeicon')}<text class="lb-p-t4 is-s" x="${x + 38}" y="309">${esc(m)}</text></g>`;
                    })
                    .join('')}
                </svg>`;
  return [p1, p2, p3, p4, p5];
}

/* ── classifier: the rules as a table, and the result card ─────────── */

const aircraftOf = (r, C) => (r.pax ? C.aircraft.both : C.aircraft.cao);
const limitOf = (r, C) => (!r.pax ? C.limit.cao(r.cao) : r.pax === r.cao ? C.limit.same(r.pax) : C.limit.both(r.pax, r.cao));
const lower = (s) => s[0].toLowerCase() + s.slice(1);

function rows(C) {
  return RULES.map((r) => {
    const key = `${r.chem}-${r.pack}`;
    const marks = r.marks.map((m) => `<li>${esc(C.marks[m])}</li>`).join('');
    const docs = [C.docs[r.docs], C.docs.test].map((d) => `<li>${esc(d)}</li>`).join('');
    const art = r.marks.map((m) => (m === 'mark-ex' ? 'mark' : m)).join(' ');
    const size = lower(C.opt[`${r.size}-${r.chem}`][0]);
    return `<tr data-chem="${r.chem}" data-pack="${r.pack}" data-size="${r.size}" data-un="${r.un}" data-marks="${art}" data-what="${esc(C.what[key])}" data-pi="${r.pi}" data-section="${r.section}">
                  <th scope="row" data-label="${esc(C.th[0])}">${esc(C.batteries[r.chem])}, ${esc(C.batteries[r.pack])}, ${esc(size)}</th>
                  <td data-label="${esc(C.th[1])}"><b data-f="un">${r.un}</b> <span data-f="psn">${esc(PSN[key])}</span></td>
                  <td data-label="${esc(C.th[2])}" data-f="pi">PI ${r.pi}, ${C.section} ${r.section}</td>
                  <td data-label="${esc(C.th[3])}"><b data-f="aircraft">${esc(aircraftOf(r, C))}</b> <span data-f="limit">${esc(limitOf(r, C))}</span></td>
                  <td data-label="${esc(C.th[4])}" data-f="pkg">${esc(C.pkg[r.pkg])}</td>
                  <td data-label="${esc(C.th[5])}" data-f="marks"><ul>${marks}</ul></td>
                  <td data-label="${esc(C.th[6])}" data-f="docs"><ul>${docs}</ul></td>
                  <td data-label="${esc(C.th[7])}" data-f="soc">${esc(C.soc[r.soc])}</td>
                </tr>`;
  }).join('\n                ');
}

function classifier(T, LC) {
  const C = T.cls;
  const def = RULES.find((r) => r.chem === 'ion' && r.pack === 'in' && r.size === 'small');
  const key = `${def.chem}-${def.pack}`;
  const opt = (name, value, icon, label, checked) =>
    `<label class="seg-opt"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''} /><span><ec-icon name="${icon}" />${label}</span></label>`;
  const plain = (k) => `<b>${esc(C.opt[k][0])}</b><small>${esc(C.opt[k][1])}</small>`;
  const sized = (s) =>
    `<b><i data-for="ion">${esc(C.opt[`${s}-ion`][0])}</i><i data-for="metal">${esc(C.opt[`${s}-metal`][0])}</i></b><small><i data-for="ion">${esc(C.opt[`${s}-ion`][1])}</i><i data-for="metal">${esc(C.opt[`${s}-metal`][1])}</i></small>`;
  const out = (f, html) => `<div><dt class="chart text-mute">${esc(C.f[f])}</dt><dd data-out="${f}">${html}</dd></div>`;
  const quote = `${LC.contact}?type=quote&amp;mode=air&amp;what=${encodeURIComponent(C.what[key])}&amp;un=${def.un}#enquiry`;
  return `<!-- CLASSIFIER: three questions, the air rules for that battery ─ -->
      <section class="section" id="classifier" aria-labelledby="cls-title">
        <div class="wrap">
          <div class="grid gap-6 lg:grid-cols-12">
            <div class="lg:col-span-7">
              <p class="chart flex items-center gap-2 text-cyan-ink" data-reveal><ec-icon name="search-check" class="!h-[18px] !w-[18px]" /> ${esc(C.kicker)}</p>
              <h2 id="cls-title" class="display display-l mt-4 max-w-[18ch]" data-split>${esc(C.title)}</h2>
            </div>
            <p class="lede self-end lg:col-span-5" data-reveal>${esc(C.lede)}</p>
          </div>

          <div class="lb-cls mt-12" data-lb-cls data-contact="${LC.contact}" hidden>
            <form class="lb-form" data-lb-form data-chem="${def.chem}">
              <fieldset class="lb-q">
                <legend class="chart text-mute">${esc(C.legend.chem)}</legend>
                <div class="seg is-2 mt-3">
                  ${opt('chem', 'ion', 'battery-charging', plain('ion'), true)}
                  ${opt('chem', 'metal', 'battery', plain('metal'), false)}
                </div>
              </fieldset>
              <fieldset class="lb-q">
                <legend class="chart text-mute">${esc(C.legend.pack)}</legend>
                <div class="seg is-stack mt-3">
                  ${opt('pack', 'alone', 'battery-full', plain('alone'), false)}
                  ${opt('pack', 'with', 'package-plus', plain('with'), false)}
                  ${opt('pack', 'in', 'monitor-smartphone', plain('in'), true)}
                </div>
              </fieldset>
              <fieldset class="lb-q">
                <legend class="chart text-mute">${esc(C.legend.size)}</legend>
                <div class="seg is-2 mt-3">
                  ${opt('size', 'small', 'gauge', sized('small'), true)}
                  ${opt('size', 'large', 'weight', sized('large'), false)}
                </div>
              </fieldset>
            </form>

            <div class="lb-result" data-lb-result>
              <div class="lb-result-head">
                <div>
                  <p class="chart text-mute">${esc(C.f.un)}</p>
                  <p class="lb-un" data-out="un">${def.un}</p>
                  <p class="lb-psn" data-out="psn">${esc(PSN[key])}</p>
                </div>
                <div class="lb-result-art">${box({ un: def.un, on: ['mark'], cls: 'lb-mini' })}</div>
              </div>
              <dl class="lb-dl">
                ${out('pi', `PI ${def.pi}, ${C.section} ${def.section}`)}
                ${out('aircraft', esc(aircraftOf(def, C)))}
                ${out('limit', esc(limitOf(def, C)))}
                ${out('pkg', esc(C.pkg[def.pkg]))}
                ${out('marks', `<ul><li>${esc(C.marks['mark-ex'])}</li></ul>`)}
                ${out('docs', `<ul><li>${esc(C.docs[def.docs])}</li><li>${esc(C.docs.test)}</li></ul>`)}
                ${out('soc', esc(C.soc[def.soc]))}
              </dl>
              <p class="sr-only" aria-live="polite" data-lb-live></p>
              <div class="lb-result-foot">
                <p class="text-sm text-ink-2">${esc(C.disclaimer)}</p>
                <a class="btn btn-ink" href="${quote}" data-lb-quote>${esc(C.quote)} <!-- @include arrow --></a>
              </div>
            </div>
          </div>

          <details class="lb-table mt-10" open data-lb-table>
            <summary><ec-icon name="table-2" /> <span>${esc(C.table)}</span><ec-icon name="chevron-down" /></summary>
            <div class="lb-table-scroll">
              <table data-lb-rows>
                <thead><tr>${C.th.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
                <tbody>
                ${rows(C)}
                </tbody>
              </table>
            </div>
          </details>
          <p class="mt-6 max-w-[80ch] text-sm text-ink-2">${esc(T.rules.source)}</p>
        </div>
      </section>`;
}

/* ── the page ──────────────────────────────────────────────────────── */

function page(T, LC) {
  const quoteHref = `${LC.contact}?type=quote&amp;what=${encodeURIComponent(LC.what)}#enquiry`;
  const url = `https://www.express-cargo.nl${LC.path}`;
  const enJourney = lithium.en.journey.items;
  const journey = T.journey.items.map((it, i) => (it.length === 5 ? it : [enJourney[i][0], ...it]));
  const enModes = lithium.en.modes.items;
  const modes = T.modes.items.map((m, i) => ({ slug: m[0], label: m[1], text: m[m.length - 1], icon: enModes[i][2], poster: enModes[i][3] }));
  const plate = plates(T.journey.plates, LC);
  const legend = [
    ['class9', 1, T.art.class9],
    ['mark', 2, T.art.mark],
    ['cao', 3, T.art.cao],
  ];
  return `<!doctype html>
<html lang="${LC.lang}">
  <head>
    <!-- @include head -->
    <title>${esc(T.title)}</title>
    <meta name="description" content="${esc(T.description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${esc(T.nav)} | Express Cargo" />
    <meta property="og:description" content="${esc(T.lede)}" />
    <meta property="og:url" content="${url}" />
    <script type="module" src="/src/lithium.ts"></script>
  </head>
  <body data-dark-hero>
    <!-- @include ${LC.header} -->

    <main id="main">
    ${SPRITE}

      <!-- HERO: the package and its labels ──────────────────────── -->
      <section class="lb-hero on-night" id="top">
        <div class="wrap lb-hero-grid">
          <div class="lb-hero-copy" data-hero-head>
            <p class="chart flex items-center gap-2 text-[#dbe5ee]" data-fade><ec-icon name="battery-charging" class="!h-[18px] !w-[18px] text-cyan" /> ${esc(T.code)}</p>
            <h1 class="display display-xl mt-5 max-w-[14ch]" data-split>${esc(T.h1)}</h1>
            <p class="lede mt-7 !max-w-[54ch]" data-fade>${esc(T.lede)}</p>
            <div class="mt-8 flex flex-wrap gap-3" data-fade>
              <a class="btn btn-cyan" href="${quoteHref}">${esc(T.quote)} <!-- @include arrow --></a>
              <a class="btn btn-line" href="tel:+31203332405"><ec-icon name="phone" /> ${T.call}</a>
            </div>
            <ul class="lb-chips mt-8" data-fade>
              ${T.chips.map((c) => `<li><ec-icon name="check" /> ${esc(c)}</li>`).join('\n              ')}
            </ul>
          </div>
          <figure class="lb-hero-art" data-lb-hero data-state-a="${esc(T.art.stateA)}" data-state-b="${esc(T.art.stateB)}">
            <p class="lb-state chart" data-lb-state><span>${esc(T.art.stateA)}</span></p>
            ${box({ un: 'UN3480', on: ['class9', 'cao', 'mark'], numbered: true, label: T.art.title, cls: 'lb-hero-box' })}
            <figcaption>
              <ol class="lb-legend">
                ${legend.map(([k, n, t]) => `<li data-legend="${k}"><i>${n}</i> ${esc(t)}</li>`).join('\n                ')}
              </ol>
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- RULES: four numbers that catch shippers out ───────────── -->
      <section class="section bg-paper-2" id="rules" aria-labelledby="rules-title">
        <div class="wrap">
          <h2 id="rules-title" class="display display-l max-w-[18ch]" data-split>${esc(T.rules.title)}</h2>
          <dl class="lb-rules mt-12" data-stagger>
            ${T.rules.items.map(([v, t], i) => `<div class="lb-rule"><dt class="lb-rule-v chart-l"${['30%', '5 kg'].includes(v) ? ` data-count="${parseFloat(v)}" data-suffix="${v.replace(/^[\d.]+/, '')}"` : ''}>${esc(v)}</dt><dd class="copy mt-3">${esc(t)}</dd></div>`).join('\n            ')}
          </dl>
          <p class="mt-10 text-sm text-ink-2">${esc(T.rules.source)}</p>
        </div>
      </section>

      ${classifier(T, LC)}

      <!-- JOURNEY: how a lithium shipment is prepared ────────────── -->
      <section class="journey" aria-labelledby="journey-title" data-journey style="--steps: ${journey.length}">
        <div class="journey-sticky">
          <div class="wrap">
            <div class="jt-head">
              <h2 id="journey-title" class="display display-l max-w-[16ch]" data-split>${esc(T.journey.title)}</h2>
              <p class="chart text-mute">${esc(T.journey.steps(journey.length))}</p>
            </div>
            <div class="journey-track" aria-hidden="true">
              <span class="jt-line"><i data-jt-fill></i></span>
              ${journey.map(([icon, code], i) => `<span class="jt-node" style="--at: ${i / (journey.length - 1)}" data-jt-node><b class="chart">${code}</b><i><ec-icon name="${icon}" /></i></span>`).join('\n              ')}
              <span class="jt-vehicle" data-jt-vehicle><ec-icon name="battery-charging" /></span>
            </div>
            <div class="jt-body">
              <ol class="journey-steps" data-jt-steps>
                ${journey
                  .map(([, code, title, text, facts], i) => `<li class="jt-step${i === 0 ? ' is-active' : ''}"><span class="chart text-magenta">${String(i + 1).padStart(2, '0')} / ${String(journey.length).padStart(2, '0')} · ${code}</span><h3 class="mt-3">${esc(title)}</h3><p class="mt-3">${esc(text)}</p><ul class="jt-facts">${facts.map((f) => `<li><ec-icon name="check" />${esc(f)}</li>`).join('')}</ul></li>`)
                  .join('\n                ')}
              </ol>
              <div class="jt-media lb-plates" aria-hidden="true" data-jt-media>
                ${plate.map((p, i) => `<figure class="${i === 0 ? 'is-active' : ''}">${p}<figcaption class="inset-label chart">${esc(T.journey.step)} ${String(i + 1).padStart(2, '0')} · ${journey[i][1]}</figcaption></figure>`).join('\n                ')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- WHAT WE NEED, AND WHAT WE DON'T ACCEPT ──────────────────── -->
      <section class="section" id="need" aria-labelledby="need-title">
        <div class="wrap grid gap-x-10 gap-y-12 lg:grid-cols-12">
          <div class="lg:col-span-7">
            <h2 id="need-title" class="display display-l max-w-[16ch]" data-split>${esc(T.need.title)}</h2>
            <p class="lede mt-6" data-reveal>${esc(T.need.lede)}</p>
            <ol class="lb-need mt-10" data-stagger>
              ${T.need.items.map((t, i) => `<li><span class="lb-need-n chart">${String(i + 1).padStart(2, '0')}</span><ec-icon name="check" /><span>${esc(t)}</span></li>`).join('\n              ')}
            </ol>
            <a class="btn btn-ink mt-10" href="${quoteHref}">${esc(T.need.cta)} <!-- @include arrow --></a>
          </div>
          <aside class="lb-refuse lg:col-span-5 lg:self-start" aria-labelledby="refuse-title" data-reveal>
            <p class="chart flex items-center gap-2 text-magenta"><ec-icon name="battery-warning" class="!h-[20px] !w-[20px]" /> ${esc(T.refuse.kicker)}</p>
            <h3 id="refuse-title" class="display display-m mt-4">${esc(T.refuse.title)}</h3>
            <p class="copy mt-4">${esc(T.refuse.text)}</p>
          </aside>
        </div>
      </section>

      <!-- MEDICAL EQUIPMENT ───────────────────────────────────────── -->
      <section class="section bg-night on-night" id="medical" aria-labelledby="medical-title">
        <div class="wrap grid items-center gap-x-10 gap-y-12 lg:grid-cols-12">
          <figure class="inset aspect-[4/3] lg:col-span-5" data-depth>
            <ec-img name="project-kenya" alt="${esc(T.medical.alt)}" sizes="(min-width: 1024px) 40vw, 92vw" class="h-full w-full object-cover object-[64%_50%]" />
            <figcaption class="inset-label chart">${esc(T.medical.caption)}</figcaption>
          </figure>
          <div class="lg:col-span-6 lg:col-start-7">
            <p class="chart flex items-center gap-2 text-cyan" data-reveal><ec-icon name="heart-pulse" class="!h-[18px] !w-[18px]" /> ${esc(T.medical.kicker)}</p>
            <h2 id="medical-title" class="display display-l mt-4 max-w-[16ch]" data-split>${esc(T.medical.title)}</h2>
            <p class="copy mt-6" data-reveal>${esc(T.medical.text)}</p>
            <ul class="lb-med mt-8" data-stagger>
              ${T.medical.items.map((t) => `<li><ec-icon name="check" /> <span>${esc(t)}</span></li>`).join('\n              ')}
            </ul>
          </div>
        </div>
      </section>

      <!-- MODES ───────────────────────────────────────────────────── -->
      <section class="section bg-paper-2" id="modes" aria-labelledby="modes-title">
        <div class="wrap">
          <div class="grid gap-6 lg:grid-cols-12">
            <h2 id="modes-title" class="display display-l lg:col-span-6" data-split>${esc(T.modes.title)}</h2>
            <p class="lede self-end lg:col-span-6" data-reveal>${esc(T.modes.lede)}</p>
          </div>
          <ul class="more mt-12" data-stagger>
            ${modes.map((m) => `<li><a class="more-card" href="${LC.mode(m.slug)}"><figure class="inset aspect-[16/10]"><ec-img name="poster-${m.poster}" alt="" sizes="(min-width: 1024px) 30vw, 92vw" class="h-full w-full object-cover" /></figure><span class="more-label"><ec-icon name="${m.icon}" /> ${esc(m.label)} <!-- @include arrow --></span><span class="copy mt-2 block text-[0.98rem]">${esc(m.text)}</span></a></li>`).join('\n            ')}
          </ul>
        </div>
      </section>

      <!-- @faq -->

      <!-- CLOSE ─────────────────────────────────────────────────── -->
      <section class="close-section" aria-labelledby="lb-close">
        <div class="wrap">
          <div class="close-panel on-night" data-settle>
            <div class="grid items-end gap-8 lg:grid-cols-12">
              <div class="lg:col-span-8">
                <h2 id="lb-close" class="display display-l max-w-[16ch]" data-split>${esc(T.close.title)}</h2>
                <p class="lede mt-5">${esc(T.close.text)}</p>
              </div>
              <div class="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <a class="btn btn-cyan" href="${quoteHref}">${esc(T.quote)} <!-- @include arrow --></a>
                <a class="btn btn-line" href="mailto:salesams@express-cargo.nl"><ec-icon name="mail" /> ${esc(T.close.email)}</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- @include ${LC.footer} -->
  </body>
</html>
`;
}

for (const [lang, LC] of Object.entries(LOCALES)) {
  const dir = resolve(root, `.${LC.path}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), page(lithium[lang], LC));
}
console.log('wrote the lithium battery page in English and Dutch');
