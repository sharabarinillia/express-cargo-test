# Website analysis — express-cargo.nl/en

Crawled **2026-10-01**. Covers all 12 English URLs listed in the site's sitemaps (`/en_en-sitemap.xml`, `/pages-sitemap.xml`). Each page was fetched as raw HTML and parsed, and also loaded in headless Chromium (desktop 1440×900 and iPhone 13 emulation) to measure timings and take screenshots.

## 1. Overview

| | |
|---|---|
| Company | Express Cargo (Amsterdam), part of the "Express-Cargo Group". Founded 2002 |
| Business | Freight forwarder for air, ocean and road transport. Specialises in dangerous goods (IATA DGR certified), clinical trials, samples on dry ice, pharma/temperature-controlled shipments, oil & gas and healthcare |
| Location | Breguetlaan 21, 1438 BA Oude Meer (Schiphol Airport), NL. Tel +31 (0)20 333 2405. Email salesams@express-cargo.com |
| Platform | **Wix** (served via Cloudflare and Fastly). Bilingual: NL is the default at `/` and EN is under `/en/` |
| Pages | 12 EN URLs: 10 static pages, 1 blog index and 1 blog post |
| Last content update | Pages: 2026-03-26 (sitemap lastmod). Blog: only 1 post, dated 2025-02-14 |

### Sitemap / structure

```
/en                         Home ("Meet Express Cargo")
├── /en/over                About
├── /en/meet-the-team       Team  (menu label: "Nieuwe pagina")
├── /en/diensten            Services
│   ├── /en/luchtvracht     Air freight
│   ├── /en/zeevracht       Ocean freight
│   └── /en/weg-transport   Road transport
├── /en/s-projects-basic    Projects ("Projecten")
├── /en/vraag-een-offerte-aan  Request a quote (form)
├── /en/contact             Contact (form)
└── /en/blog                Blog (1 post)
    └── /en/post/dangerous-goods
```

## 2. Page-by-page

| Page | Title tag | H1 | Words* | Notes |
|---|---|---|---|---|
| Home | Express Cargo \| Wereldwijde Luchtvracht En Zeevracht \| Schiphol (NL) | MEET EXPRESS CARGO | 164 | Meta description is in Dutch. Has a contact form. Address typo "Brequetlaan" |
| About (`/over`) | Over \| Express Cargo (NL) | ABOUT US | 149 | One paragraph. Best summary of what the company specialises in |
| Team | Ons team \| Express Cargo (NL) | **none** (only H2 "Team") | 110 | Intro text is in Dutch. 5 staff listed. LinkedIn icons point to **Wix's** LinkedIn page |
| Services | Diensten \| Express Cargo (NL) | SERVICES | 130 | 3 service cards. The CTA links are inconsistent and one is broken (see §3) |
| Air freight | Luchtvracht \| Express Cargo (NL) | AIR CARGO | 207 | IATA/DGR claim. Lists DG, lithium, bio/pharma, temp-controlled, customs, bonded warehousing |
| Ocean freight | Zeevracht \| Express Cargo (NL) | OCEAN FREIGHT | 142 | FCL/LCL. Thin content |
| Road transport | Weg transport \| Express Cargo (NL) | ROAD TRANSPORT | 206 | TAPA TSR1, art, hanging fashion, groupage, medical samples |
| Projects | Speciale Projecten en Service \| Express Cargo (NL) | Projecten en Service (NL) | 877 | Richest page: 6 case studies (white glove, 2 trucks to Brunei, >3 t to Perth, crate to Mexico, Envirotainers to Australia, medical equipment to Kenya). Reads like reposted LinkedIn posts. No meta description |
| Request a quote | Vraag een offerte aan \| Express Cargo (NL) | REQUEST A QUOTE | 74 | The form only asks for name, email, phone and comments. It collects no shipment data |
| Contact | Contact \| Express Cargo | CONTACT US | 112 | Form: name, email, phone, address, subject, message |
| Blog | Blog \| Express Cargo | All Posts | 94 | 1 post. No meta description |
| Blog post | Dangerous Goods | Dangerous Goods | 358 | Author shown as "roy6685" (a Wix username). One image has empty alt text. No hreflang |

\*Visible words, including the repeated header and footer (~45 words).

## 3. Issues found (by priority)

### High — broken or wrong links
1. **Typo in a mailto link**: on `/en/diensten`, the Air Cargo "request a quote immediately" button points to `mailto:salesams@`**`exppress`**`-cargo.com`. Quote requests sent through it are lost.
2. **Inconsistent "request a quote" CTAs**. On Services, Air goes to the broken mailto, Ocean goes to `/en/zeevracht` (an info page, not the quote form), and Road goes to a mailto. On Home, About and the service pages the "Request a quote immediately" buttons open a mailto instead of the existing quote form.
3. **Team page LinkedIn icons** link to `linkedin.com/company/wix-com` (5×). This is template content that was never replaced.
4. **Two email domains** are in use: `@express-cargo.com` (sales) and `@express-cargo.nl` (team). Check that both are monitored.

### High — language / localisation (the EN site is half Dutch)
- The menu shows **"Nieuwe pagina"** (Dutch for "New page", the default Wix name) for the Team page, plus "Projecten" and "Meer".
- 10 of 12 `<title>` tags are Dutch (Diensten, Luchtvracht, Zeevracht, Weg transport, Over, Ons team, Vraag een offerte aan, Speciale Projecten…).
- Every meta description that exists is Dutch ("Voor al uw Import en export luchtvracht…"). These are what show up in English Google results.
- The team intro paragraph and the Projects H1 are Dutch. The Services page has a stray Wix label, "Diensten: Services".
- URL slugs are Dutch on the EN site (`/en/luchtvracht`, `/en/over`…). This is acceptable but weaker for English search queries.

### Medium — SEO
- Meta descriptions are **missing** on Team, Projects and Blog, and **duplicated** across most other pages (the same generic sentence).
- The Team page has no H1. The Home page uses H3 for its service cards under an H1/H2 mix.
- Image alt texts are mostly filenames or stock-photo credits ("express-cargo.png", "Image by Vidar Nordli-Mathisen", "1711368170462.jpg", "IMG_4046.JPG", "Vliegend vliegtuig" in Dutch). None are descriptive.
- LocalBusiness JSON-LD exists only on Home. It has no `email`, `openingHours`, `geo` or `sameAs`, and the phone number isn't in international format. A more specific type (e.g. `MovingCompany`/`Organization` + `FreightForwarder`-style description) would help.
- Thin content: Ocean freight, Quote, Blog and Contact each have fewer than 120 unique words. Service pages have no FAQs, no transit-time and coverage details, and no certification badges with explanation (the footer shows "sgs.png" and "global.png" logos without context).
- The blog post has no `hreflang` and its author is "roy6685". There has been one post in 1.5 years, so the blog looks abandoned.
- Positive: canonicals, `hreflang` pairs (en-gb / nl-nl / x-default), HTTPS + HSTS, a sitemap index and a sensible robots.txt are all present (Wix defaults).

### Medium — conversion / UX
- The quote form gathers no freight data (origin, destination, mode, weight/dimensions, DG yes/no, incoterms, ready date). Every request needs a follow-up email before it can be quoted.
- There is no track-and-trace, no client login, no opening hours and no embedded map (only a Google Places icon).
- Trust signals are underused. IATA DGR, TAPA TSR1, the SGS logo and 20+ years in business are mentioned in passing or shown as unlabeled logos. There are no testimonials, client logos or figures.
- At desktop width the Home page has large empty dark blocks below the hero and below the contact form (visible in the screenshots). This looks like section heights set for content that was removed.
- Header phone number wraps awkwardly ("T.: +31 (0) 20 333 / 2405") at 1440 px.
- Typos: "Brequetlaan" (Home), "happy te help", "savely delivered", "where specially sealed", "under150 ton", "gains his popularity", "Express Cargo . can offer".

### Low — performance (Wix overhead)
Measured in headless Chromium from a US datacenter (Fastly IAD edge), so real NL users will see a lower TTFB:

| Metric | Typical value |
|---|---|
| HTML size | 500–730 KB per page (inlined Wix JSON) |
| Requests per page | ~155–195 |
| Transfer per page | ~2.6–3.9 MB |
| FCP | 0.25–0.6 s (desktop), 0.33–1.2 s (mobile) |
| Load event | 1.6–3.4 s |
| Console errors | 0 |
| Horizontal overflow on mobile | none |

Page weight is high for pages with this little content, mostly from Wix runtime scripts and full-bleed stock photography. Options within Wix are limited: compress hero images, cut down below-the-fold sections, and drop unused apps.

### Privacy / compliance
- No Google Analytics or Tag Manager was detected, only Wix's built-in analytics. Wix consent/cookie scripts are present. Check that the cookie banner is actually enabled for EU visitors.
- The forms have no visible privacy notice or consent text, and there is no privacy-policy page in the sitemap or footer. GDPR expects one wherever personal data is collected.

## 4. Content summary (what the site says)

- **Positioning**: "the entire package of logistics solutions since 2002". Uses a worldwide agent network, "even in the most remote areas", and is based at Schiphol.
- **Specialisms**: dangerous goods (IATA DGR certified), lithium batteries, clinical trials and samples on dry ice, pharma and temperature-controlled freight (Envirotainer), customs and bonded warehousing, white-glove delivery, art and fashion transport, TAPA TSR1 secured road freight.
- **Sectors**: oil & gas, healthcare, pharma.
- **Team**: Marcel Sannes (Director), Roy van Zwieten (Operations Manager), Niels Meijaard (Export), Josette van Kaam (Import), Kim Sannes (Accounting).
- **Case studies**: 2 trucks with vacuum tanks on 40' HC flatracks from Rotterdam to Brunei, construction materials over 3 t to Perth, a 3 m × 2.5 m crate to Mexico, 2 pharma Envirotainers to Australia, medical equipment to Madiany Sub County Hospital (Kenya).

## 5. Recommended quick wins (in order)

1. Fix the `exppress` mailto and point every "request a quote" CTA to `/en/vraag-een-offerte-aan`.
2. Rename the menu item "Nieuwe pagina" to "Team" and translate "Projecten" and "Meer". Replace the Wix LinkedIn links with each person's real profile.
3. Write unique English title tags and meta descriptions for all 12 pages, and add an H1 to Team.
4. Extend the quote form with shipment fields (mode, origin, destination, pieces/weight/dims, DG Y/N, ready date) and add a privacy notice and privacy-policy page.
5. Replace filename alt texts with descriptive ones, fix the typos, and remove the empty sections on Home.
6. Expand the service pages (FAQ, certifications explained, typical lanes and transit times), and turn the Projects case studies into individual blog posts with English slugs.
