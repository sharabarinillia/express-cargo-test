/**
 * Generates the service pages (services/<slug>/index.html) from one template.
 * Content follows www.express-cargo.nl (Luchtvracht, Zeevracht, Weg transport,
 * Speciale Projecten en Service), in English. Run: node scripts/services.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { servicesNl } from './content/services-nl.mjs';

const root = resolve(import.meta.dirname, '..');

const pages = [
  {
    slug: 'air-freight',
    nav: 'Air freight',
    icon: 'plane',
    video: 'air-loading',
    code: 'AIR · AMS → WORLDWIDE',
    title: 'Air freight from Schiphol | IATA DGR certified | Express Cargo',
    description:
      'Import and export air freight from Amsterdam Schiphol: dangerous goods, lithium batteries, biological and pharmaceutical shipments, temperature control, customs formalities and bonded warehousing. IATA registered, IATA DGR certified.',
    h1: 'Air freight, door to door.',
    lede: 'The fastest way to move goods around the world: within a few days your shipment can be on the other side of the globe. Express Cargo is IATA registered and IATA DGR certified.',
    quoteMode: 'air',
    journeyTitle: 'How an air shipment moves.',
    journey: [
      ['plane-takeoff', 'PICKUP', 'Collection', 'We collect at your door, or at your supplier anywhere in our network of local agents.'],
      ['file-check', 'DOCS', 'Documents & DGR check', 'Export customs filed, dangerous goods declared and packed to IATA DGR. Every document in order before the cargo moves.'],
      ['plane', 'AMS', 'Uplift at Schiphol', 'Booked on the flight that fits the cargo and the deadline, built up and loaded.'],
      ['plane-landing', 'ARR', 'Arrival & clearance', 'Our agent at destination handles import formalities, so the shipment does not wait in a shed.'],
      ['map-pin-check', 'POD', 'Delivered', 'Signed for at the door. You get the proof of delivery and one coordinator answered every question on the way.'],
    ],
    capsTitle: 'What we fly.',
    capsLede: 'Shipments that need more than a booking: the right packing, the right paperwork and someone who follows up.',
    caps: [
      ['triangle-alert', 'Dangerous goods', 'Declared, packed and labelled to IATA DGR by certified staff.'],
      ['battery-charging', 'Lithium batteries', 'UN3480, UN3481 and UN3090/3091, in or with equipment.'],
      ['flask-conical', 'Biological & pharmaceutical', 'Clinical samples, UN3373 specimens and pharma, on dry ice when needed.'],
      ['thermometer-snowflake', 'Temperature-controlled', '+2–8 °C, +15–25 °C and frozen, from packaging to active containers.'],
      ['file-text', 'Customs documents', 'Export and import formalities handled, documents prepared and checked.'],
      ['warehouse', 'Bonded warehousing', 'Storage under customs control at Schiphol until the goods move on.'],
    ],
    quote: 'Speed, communication and service come first.',
    media: { img: 'poster-tc-cargojet', alt: 'A cargo jet on the runway' },
    stats: [['IATA', 'registered agent'], ['DGR', 'certified staff'], ['2002', 'at Schiphol since']],
    tool: { href: '/tools/#chargeable', label: 'Air is charged on volume or weight, whichever is greater. Check yours before you ask.' },
  },
  {
    slug: 'sea-freight',
    nav: 'Sea freight',
    icon: 'ship',
    video: 'sea-river',
    code: 'SEA · RTM → WORLDWIDE',
    title: 'Sea freight FCL & LCL | Worldwide ocean transport | Express Cargo',
    description:
      'Worldwide sea freight with Express Cargo: full container loads (FCL) and shared containers (LCL) with our partners, all documents arranged, personal service from Schiphol.',
    h1: 'Sea freight, full or shared.',
    lede: 'Shipments collected or delivered anywhere in the world over water. Full containers (FCL) or smaller loads that share a container (LCL), with all the documents arranged for you.',
    quoteMode: 'ocean',
    journeyTitle: 'How a sea shipment moves.',
    journey: [
      ['package', 'PICKUP', 'Collection', 'Collected at the supplier, by low-loader if it has to be, and brought to the port.'],
      ['container', 'STUFF', 'Into the container', 'Your own container (FCL), or consolidated with other cargo in one container (LCL). Sealed, secured, documented.'],
      ['anchor', 'POL', 'Port of loading', 'Export customs cleared and loaded on the carrier that fits the route and the date.'],
      ['ship', 'OCEAN', 'At sea', 'We follow the vessel and tell you when anything changes, not after.'],
      ['map-pin-check', 'POD', 'Port to door', 'Our partner at destination clears the cargo and delivers it to your door.'],
    ],
    capsTitle: 'What we ship.',
    capsLede: 'Personal service is just as high on the list at sea, and every document is taken care of.',
    caps: [
      ['container', 'Full container (FCL)', '20′, 40′ and 40′ high cube, door to door.'],
      ['boxes', 'Shared container (LCL)', 'Pay for the space you use, consolidated with other cargo.'],
      ['move-horizontal', 'Flat racks & out of gauge', 'Vehicles and machinery on 40′ high-cube flat racks.'],
      ['file-text', 'All documents', 'Bills of lading, customs and certificates prepared for you.'],
      ['handshake', 'Trusted partners', 'Forwarders and agents we have worked with for years.'],
      ['user-check', 'One coordinator', 'Someone who knows your shipment, from booking to delivery.'],
    ],
    quote: 'Two trucks, two 40′ flat racks, one shipment to Brunei. We pulled it off together.',
    media: { img: 'project-trucks-brunei', alt: 'Two trucks secured on flat-rack containers for shipment to Brunei' },
    stats: [['FCL', 'full containers'], ['LCL', 'shared containers'], ['RTM', 'via Rotterdam']],
    tool: { href: '/tools/#chargeable', label: 'LCL is charged per revenue tonne: cubic metres or tonnes, whichever is greater.' },
  },
  {
    slug: 'road-transport',
    nav: 'Road transport',
    icon: 'truck',
    video: 'road-highway',
    code: 'ROAD · EUROPE & BEYOND',
    title: 'Road transport Europe | Groupage, dedicated, TAPA TSR1 | Express Cargo',
    description:
      'National and international road transport with Express Cargo: from 1 to 10,000 kg and from 1 to 200 pallets. Dedicated transport, white glove, TAPA TSR1, art, hanging garments, groupage and medical samples.',
    h1: 'Road transport, one box to a full trailer.',
    lede: 'National and international road transport, whether your shipment weighs 1 or 10,000 kg, to destinations across Europe and beyond. One pallet or 200: for every destination there is a specialist in our network.',
    quoteMode: 'road',
    journeyTitle: 'How a road shipment moves.',
    journey: [
      ['clipboard-check', 'BOOK', 'Booking', 'Groupage or dedicated, with or without a security escort: we pick the right solution for the cargo.'],
      ['forklift', 'PICKUP', 'Collection', 'Loaded at your dock in the agreed slot, checked and secured.'],
      ['truck', 'LINEHAUL', 'On the road', 'Direct with a dedicated vehicle, or through the groupage network of our long-standing partners.'],
      ['radar', 'TRACK', 'Tracking link', 'High-value loads travel with a tracking link, so you can see where your goods are.'],
      ['map-pin-check', 'POD', 'Delivered', 'Safe from A to B, and signed for at the door.'],
    ],
    capsTitle: 'What we drive.',
    capsLede: 'A selection of what we arrange by road, each with a partner we have worked with for years.',
    caps: [
      ['truck', 'Dedicated transport', 'A vehicle for your cargo only, direct to the address.'],
      ['hand-heart', 'White glove', 'Careful handling, inside delivery and set-up.'],
      ['shield-check', 'TAPA TSR1', 'The highest security level for high-value freight.'],
      ['palette', 'Art transport', 'Climate-aware, soft or crated, handled with care.'],
      ['shirt', 'Hanging garments', 'Fashion transported on rails, ready for the shop floor.'],
      ['layers', 'Groupage', 'Shared trailers for 1 to 200 pallets, high-quality networks.'],
      ['microscope', 'Medical samples', 'Clinical and lab samples by road, on time and in range.'],
    ],
    quote: 'Valuable goods across Europe with a security escort and a tracking link? No problem at all.',
    media: { img: 'truck-motion', alt: 'A truck on the motorway' },
    stats: [['1–10,000', 'kilograms'], ['1–200', 'pallets'], ['TSR1', 'TAPA security']],
    tool: { href: '/tools/#loading', label: 'Groupage is charged on floor space. Work out your loading metres.' },
  },
  {
    slug: 'special-projects',
    nav: 'Projects & white glove',
    icon: 'gem',
    video: 'close-wing',
    code: 'PROJECTS · WHITE GLOVE',
    title: 'Special projects & white glove service | Express Cargo',
    description:
      'White glove delivery, tailor-made crates, Envirotainer shipments, oversized and high-value cargo with Express Cargo: real-time tracking, inside delivery and a transport manager along if needed.',
    h1: 'Projects that don’t fit a form.',
    lede: 'High-value, fragile, large or complex shipments: packed as you wish, inspected and labelled, and moved by courier, air or sea freight to any country, with all local handling at destination.',
    quoteMode: '',
    journeyTitle: 'How a project moves.',
    journey: [
      ['scan-search', 'SURVEY', 'Survey', 'We look at size, value, fragility, perishability and the route before anything is packed.'],
      ['package-open', 'PACK', 'Tailor-made packing', 'Hard or soft pack. For international transport a wooden crate is the usual and recommended choice.'],
      ['route', 'MODE', 'The right mode', 'Courier, air freight or sea freight, chosen with you for the deadline and the budget.'],
      ['user-check', 'ESCORT', 'A manager along', 'If needed, a transport manager travels with the shipment for the whole journey.'],
      ['door-open', 'INSIDE', 'Inside delivery', 'Trained people bring it into the building and place it in the room where it belongs.'],
    ],
    capsTitle: 'White glove, in detail.',
    capsLede: 'Detail is our middle name: labelling, inspection before delivery and delicate handling through the whole process.',
    caps: [
      ['radar', 'Real-time tracking', 'GPS on delivery vehicles, status updates and driver location.'],
      ['package-open', 'Tailor-made packaging', 'Thicker boxes, wooden crates, foam: chosen for the item.'],
      ['door-open', 'Inside delivery', 'Placed in the right room, assembled where needed.'],
      ['thermometer-snowflake', 'Envirotainer', 'Active containers that hold pharma at a constant temperature.'],
      ['hard-hat', 'Heavy & oversized', 'Construction materials above 3,000 kg, crates almost 3 m long.'],
      ['handshake', 'Premium service', 'Direct answers and regular updates until it is delivered.'],
    ],
    cases: [
      ['project-crate-mexico', 'Mexico', 'A crate almost three metres long and two and a half metres high, flown all the way to Mexico.', 'Air · tailor-made crate'],
      ['project-envirotainer', 'Australia', 'Two Envirotainers filled with pharmaceuticals, held at a constant temperature all the way.', 'Air · active containers'],
      ['project-trucks-brunei', 'Brunei', 'Two trucks with a high-value vacuum tank on two 40′ high-cube flat racks.', 'Sea · out of gauge'],
      ['project-perth', 'Perth', 'Construction materials above 3,000 kg, collected, sealed and on their way to Perth.', 'Air · heavy cargo'],
      ['project-kenya', 'South Uyoma, Kenya', 'Medical equipment delivered to the Madiany Sub County Hospital, a Ministry of Health primary-care hospital.', 'Air · remote delivery'],
      ['project-white-glove', 'Europe', 'White glove delivery: packed, inspected, tracked in real time and placed inside.', 'Road · white glove'],
    ],
    quote: 'Whether it is a sample on dry ice, a fragile artwork or a (model) car: we arrange it.',
    media: { img: 'project-crate-mexico', alt: 'A large wooden crate prepared for air freight to Mexico' },
    stats: [['3 m', 'crate to Mexico'], ['3,000 kg+', 'to Perth'], ['2', 'Envirotainers to Australia']],
    tool: { href: '/resources/', label: 'Who pays for what, and where the risk passes: the Incoterms® 2020 chart.' },
  },
];


/** per step: three concrete facts and a photo for the journey stage */
const journeyMore = {
  'air-freight': [
    [['Pickup from your door or your supplier', 'Packed and labelled for the route', 'Collection confirmed by your coordinator'], 'truck-motion'],
    [['Air waybill and commercial invoice', 'Shipper’s Declaration for Dangerous Goods when needed', 'Export declaration filed with customs'], 'specimen-box'],
    [['Booked on the flight that fits cargo and deadline', 'Built up and loaded at Schiphol', 'Flight details sent to you'], 'poster-air-loading'],
    [['Received by our agent at destination', 'Import clearance and duties handled', 'Temperature and DG requirements checked again'], 'poster-tc-cargojet'],
    [['Delivered to the named address', 'Proof of delivery shared with you', 'One coordinator from start to finish'], 'project-kenya'],
  ],
  'sea-freight': [
    [['Collected at the supplier', 'Low-loader for heavy or oversize cargo', 'Brought to the port or the consolidation warehouse'], 'truck-motion'],
    [['FCL: your own 20′, 40′ or 40′ high cube', 'LCL: consolidated with other cargo', 'Sealed, secured and documented'], 'project-trucks-brunei'],
    [['Export customs cleared', 'Bill of lading issued', 'Loaded on the carrier that fits route and date'], 'containership'],
    [['The vessel followed throughout', 'Changes reported as they happen', 'Arrival notice prepared'], 'poster-sea-river'],
    [['Import clearance at destination', 'Container delivered or unloaded', 'Delivered to your door'], 'poster-road-highway'],
  ],
  'road-transport': [
    [['Groupage or a dedicated vehicle', 'Security escort and TAPA TSR1 on request', 'Collection slot agreed with you'], 'cold-doors'],
    [['Loaded at your dock', 'Checked and secured', 'CMR consignment note'], 'truck-motion'],
    [['Direct, or through a groupage hub', 'Rails for hanging garments, care for art', 'A specialist partner per destination'], 'poster-road-highway'],
    [['Tracking link for high-value loads', 'GPS on the vehicle', 'Updates from your coordinator'], 'poster-close-wing'],
    [['Signed for at the door', 'White glove and inside delivery on request', 'Proof of delivery shared'], 'project-white-glove'],
  ],
  'special-projects': [
    [['Size, value and fragility', 'Perishability and the route', 'Packing and mode advised'], 'project-perth'],
    [['Hard or soft pack', 'Wooden crates for international transport', 'Labelled and inspected'], 'project-crate-mexico'],
    [['Courier, air or sea freight', 'Chosen for deadline and budget', 'Local handling at destination arranged'], 'project-envirotainer'],
    [['A transport manager can travel along', 'Real-time tracking', 'Regular updates until delivery'], 'obc-case'],
    [['Brought into the building', 'Placed in the right room', 'Assembled where needed'], 'project-kenya'],
  ],
};

/** fixed wording and paths per language */
const LOCALES = {
  en: {
    lang: 'en', header: 'header', footer: 'footer', contact: '/contact/',
    path: (p) => `/services/${p.slug}/`,
    href: (h) => h,
    quote: 'Request a quote', fast: 'Fast quotes from a real coordinator', steps: (n) => `${n} steps · one coordinator`, step: 'Step',
    inPractice: 'In practice', recent: 'Recent projects.', freeTool: 'Free tool', resource: 'Resource', other: 'Other services',
    closeH: 'Tell us what’s moving.', closeP: 'Quotes go out fast. One sentence is enough to start: what, from where, to where.', email: 'Email us',
    area: 'Worldwide',
  },
  nl: {
    lang: 'nl', header: 'header-nl', footer: 'footer-nl', contact: '/nl/contact/',
    path: (p) => `/nl/diensten/${p.nlSlug}/`,
    href: (h) => h.replace('/tools/', '/nl/tools/').replace(/^\/resources\//, '/nl/incoterms/'),
    quote: 'Offerte aanvragen', fast: 'Snelle offertes van een echte coördinator', steps: (n) => `${n} stappen · één coördinator`, step: 'Stap',
    inPractice: 'In de praktijk', recent: 'Recente projecten.', freeTool: 'Gratis tool', resource: 'Kennis', other: 'Andere diensten',
    closeH: 'Vertel wat er verzonden moet worden.', closeP: 'Offertes gaan snel de deur uit. Eén zin is genoeg om te beginnen: wat, van waar, naar waar.', email: 'Mail ons',
    area: 'Wereldwijd',
  },
};

/** English page objects get their journey facts and photos; Dutch ones are the English with Dutch text */
for (const p of pages) {
  p.facts = journeyMore[p.slug].map(([f]) => f);
  p.photos = journeyMore[p.slug].map(([, img]) => img);
}
const pagesNl = pages.map((p) => {
  const n = servicesNl[p.slug];
  return {
    ...p,
    ...n,
    journey: p.journey.map(([icon], i) => [icon, ...n.journey[i]]),
    caps: p.caps.map(([icon], i) => [icon, ...n.caps[i]]),
    media: { img: p.media.img, alt: n.mediaAlt },
    tool: { href: p.tool.href, label: n.tool },
    cases: p.cases?.map(([img], i) => [img, ...n.cases[i]]),
  };
});

const esc = (s) => s.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function page(p, all, L) {
  const others = all.filter((o) => o.slug !== p.slug);
  const quoteHref = `${L.contact}?type=quote${p.quoteMode ? `&amp;mode=${p.quoteMode}` : ''}#enquiry`;
  const url = `https://www.express-cargo.nl${L.path(p)}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: p.nav,
    serviceType: p.nav,
    description: p.description,
    url,
    areaServed: L.area,
    provider: { '@type': 'Organization', name: 'Express Cargo', url: 'https://www.express-cargo.nl/', telephone: '+31 20 333 2405', email: 'salesams@express-cargo.nl' },
  };
  return `<!doctype html>
<html lang="${L.lang}">
  <head>
    <!-- @include head -->
    <title>${esc(p.title)}</title>
    <meta name="description" content="${esc(p.description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${esc(p.nav)} | Express Cargo" />
    <meta property="og:description" content="${esc(p.lede)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="https://www.express-cargo.nl/img/poster-${p.video}-1600.webp" />
    <script type="application/ld+json">
      ${JSON.stringify(ld)}
    </script>
    <script type="module" src="/src/service.ts"></script>
  </head>
  <body data-dark-hero>
    <!-- @include ${L.header} -->

    <main id="main">
      <!-- HERO: full-bleed, the mode in motion ─────────────────── -->
      <section class="svc-hero on-night" data-svc-hero>
        <div class="svc-hero-media" aria-hidden="true" data-hero-media>
          <ec-img name="poster-${p.video}" alt="" sizes="100vw" loading="eager" class="h-full w-full object-cover" picture-class="absolute inset-0" />
          <ec-video name="${p.video}" class="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div class="svc-hero-veil" aria-hidden="true"></div>
        <div class="wrap svc-hero-inner" data-hero-head>
          <p class="chart flex items-center gap-2 text-[#dbe5ee]" data-fade><ec-icon name="${p.icon}" class="!h-[18px] !w-[18px] text-cyan" /> ${p.code}</p>
          <h1 class="display display-hero mt-5 max-w-[15ch]" data-split>${esc(p.h1)}</h1>
          <div class="mt-8 grid items-end gap-8 lg:grid-cols-12">
            <p class="lede lg:col-span-6" data-fade>${esc(p.lede)}</p>
            <div class="flex flex-wrap gap-3 lg:col-span-6 lg:justify-end" data-fade>
              <a class="btn btn-cyan" href="${quoteHref}">${L.quote} <!-- @include arrow --></a>
              <a class="btn btn-line" href="tel:+31203332405"><ec-icon name="phone" /> +31 20 333 2405</a>
            </div>
          </div>
          <p class="chart mt-8 flex items-center gap-2 text-[#dbe5ee]" data-fade><ec-icon name="zap" class="!h-[18px] !w-[18px] text-cyan" /> ${L.fast}</p>
        </div>
      </section>

      <!-- JOURNEY: the shipment travels as you scroll ──────────── -->
      <section class="journey" aria-labelledby="journey-title" data-journey style="--steps: ${p.journey.length}">
        <div class="journey-sticky">
          <div class="wrap">
            <div class="jt-head">
              <h2 id="journey-title" class="display display-l max-w-[16ch]" data-split>${esc(p.journeyTitle)}</h2>
              <p class="chart text-mute">${L.steps(p.journey.length)}</p>
            </div>
            <div class="journey-track" aria-hidden="true">
              <span class="jt-line"><i data-jt-fill></i></span>
              ${p.journey.map(([icon, code], i) => `<span class="jt-node" style="--at: ${i / (p.journey.length - 1)}" data-jt-node><b class="chart">${code}</b><i><ec-icon name="${icon}" /></i></span>`).join('\n              ')}
              <span class="jt-vehicle" data-jt-vehicle><ec-icon name="${p.icon}" /></span>
            </div>
            <div class="jt-body">
              <ol class="journey-steps" data-jt-steps>
                ${p.journey
                  .map(([, code, title, text], i) => {
                    const facts = p.facts[i];
                    return `<li class="jt-step${i === 0 ? ' is-active' : ''}"><span class="chart text-magenta">${String(i + 1).padStart(2, '0')} / ${String(p.journey.length).padStart(2, '0')} · ${code}</span><h3 class="mt-3">${esc(title)}</h3><p class="mt-3">${esc(text)}</p><ul class="jt-facts">${facts.map((f) => `<li><ec-icon name="check" />${esc(f)}</li>`).join('')}</ul></li>`;
                  })
                  .join('\n                ')}
              </ol>
              <div class="jt-media" aria-hidden="true" data-jt-media>
                ${p.journey
                  .map(([, code], i) => `<figure class="${i === 0 ? 'is-active' : ''}"><ec-img name="${p.photos[i]}" alt="" sizes="(min-width: 1024px) 40vw, 92vw" class="h-full w-full object-cover" /><figcaption class="inset-label chart">${L.step} ${String(i + 1).padStart(2, '0')} · ${code}</figcaption></figure>`)
                  .join('\n                ')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CAPABILITIES ──────────────────────────────────────────── -->
      <section class="section" aria-labelledby="caps-title">
        <div class="wrap">
          <div class="grid gap-6 lg:grid-cols-12">
            <h2 id="caps-title" class="display display-l lg:col-span-6" data-split>${esc(p.capsTitle)}</h2>
            <p class="lede self-end lg:col-span-6" data-reveal>${esc(p.capsLede)}</p>
          </div>
          <ul class="caps mt-14" data-stagger>
            ${p.caps.map(([icon, t, d]) => `<li class="cap"><span class="cap-icon"><ec-icon name="${icon}" /></span><h3 class="cap-title">${esc(t)}</h3><p class="copy mt-2 text-[0.98rem]">${esc(d)}</p></li>`).join('\n            ')}
          </ul>
        </div>
      </section>

      <!-- FEATURE: one image, one sentence ──────────────────────── -->
      <section class="section !pt-0" aria-label="${L.inPractice}">
        <div class="wrap">
          <figure class="svc-feature inset" data-depth>
            <ec-img name="${p.media.img}" alt="${esc(p.media.alt)}" sizes="(min-width: 1440px) 1320px, 100vw" class="h-full w-full object-cover" />
            <figcaption class="svc-feature-cap on-night">
              <p class="display display-m max-w-[26ch]" data-reveal>“${esc(p.quote)}”</p>
              <dl class="svc-stats mt-8" data-stagger>
                ${p.stats.map(([v, k]) => `<div><dt class="chart text-[#c9d6e3]">${esc(k)}</dt><dd class="chart-l">${esc(v)}</dd></div>`).join('\n                ')}
              </dl>
            </figcaption>
          </figure>
        </div>
      </section>
${
  p.cases
    ? `
      <!-- CASES ─────────────────────────────────────────────────── -->
      <section class="section bg-paper-2" aria-labelledby="cases-title">
        <div class="wrap">
          <h2 id="cases-title" class="display display-l max-w-[18ch]" data-split>${L.recent}</h2>
          <ul class="cases mt-14" data-stagger>
            ${p.cases.map(([img, place, text, mode]) => `<li class="case"><figure class="inset aspect-[4/3]"><ec-img name="${img}" alt="${esc(text)}" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw" class="h-full w-full object-cover" /></figure><p class="chart mt-4 text-cyan-ink">${esc(mode)}</p><h3 class="display-m mt-1 !text-[1.3rem]">${esc(place)}</h3><p class="copy mt-2 text-[0.98rem]">${esc(text)}</p></li>`).join('\n            ')}
          </ul>
        </div>
      </section>
`
    : ''
}
      <!-- TOOL + OTHER SERVICES ─────────────────────────────────── -->
      <section class="section${p.cases ? '' : ' bg-paper-2'}" aria-labelledby="more-title">
        <div class="wrap">
          <a class="tool-strip" href="${L.href(p.tool.href)}" data-reveal>
            <span class="nav-card-icon"><ec-icon name="${p.tool.href.startsWith('/tools') ? 'calculator' : 'scroll-text'}" /></span>
            <span><span class="chart text-cyan-ink">${p.tool.href.startsWith('/tools') ? L.freeTool : L.resource}</span><b class="mt-1 block">${esc(p.tool.label)}</b></span>
            <!-- @include arrow -->
          </a>
          <h2 id="more-title" class="display display-m mt-20">${L.other}</h2>
          <ul class="more mt-6" data-stagger>
            ${others.map((o) => `<li><a class="more-card" href="${L.path(o)}"><figure class="inset aspect-[16/10]"><ec-img name="poster-${o.video}" alt="" sizes="(min-width: 1024px) 30vw, 92vw" class="h-full w-full object-cover" /></figure><span class="more-label"><ec-icon name="${o.icon}" /> ${esc(o.nav)} <!-- @include arrow --></span></a></li>`).join('\n            ')}
          </ul>
        </div>
      </section>

      <!-- CLOSE ─────────────────────────────────────────────────── -->
      <section class="pb-24" aria-labelledby="svc-close">
        <div class="wrap">
          <div class="close-panel on-night" data-settle>
            <div class="grid items-end gap-8 lg:grid-cols-12">
              <div class="lg:col-span-8">
                <h2 id="svc-close" class="display display-l max-w-[16ch]" data-split>${L.closeH}</h2>
                <p class="lede mt-5">${L.closeP}</p>
              </div>
              <div class="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <a class="btn btn-cyan" href="${quoteHref}">${L.quote} <!-- @include arrow --></a>
                <a class="btn btn-line" href="mailto:salesams@express-cargo.nl"><ec-icon name="mail" /> ${L.email}</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- @include ${L.footer} -->
  </body>
</html>
`;
}

for (const [list, L] of [[pages, LOCALES.en], [pagesNl, LOCALES.nl]]) {
  for (const p of list) {
    const dir = resolve(root, `.${L.path(p)}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'index.html'), page(p, list, L));
  }
}
console.log(`wrote ${pages.length} service pages in English and Dutch`);
