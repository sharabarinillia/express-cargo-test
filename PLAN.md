# Express Cargo: website redesign plan

Status: **plan for review**. No implementation yet.
Inputs: the current site (`ANALYSIS.md`), the 19-slide deck (`brand/source/express-cargo-presentation.pdf`), the logo, and the installed skills (impeccable, ui-ux-pro-max, gsap-*). Product facts are in `PRODUCT.md`.

Decisions so far:

| | |
|---|---|
| Scope | **Group**: Amsterdam Schiphol + Serbia (Belgrade) |
| Structure | **Hybrid**: immersive scroll-story home page plus real sub-pages |
| Language | **English** at launch, with content structured for NL later |
| Build path | **Code-first** (no comp round; ambition fixed in the direction contract) |
| Direction | **Logger trace** |
| Stack | Vite · TypeScript · Tailwind CSS v4 · plain CSS · GSAP |

---

## 1. What the source material tells us

**Logo.** Cyan four-engine aircraft (≈ `#12C4DE`) above a white, wide "express cargo" wordmark with squarish letterforms. We only have rasters (288×142 PNG, plus an 831×410 version recovered from the PDF). **A clean SVG redraw is the first asset task.** It is needed for crisp rendering, the favicon and the animated intro. The wide, square wordmark is why the type plan below uses an *expanded* grotesk.

**Deck (19 slides).** It is a stronger, newer story than the website:
- Positioning: "Precision logistics since 2002", "Fast & Safe Transportation", and the close "Your most sensitive shipments, in safe hands."
- Facts not on the current site: 3 offices (Serbia & Netherlands), ISO 9001:2015 (TÜV SÜD), GDP, the Belgrade airport route, the bonded cold-chain warehouse (+15–25 °C, +2–8 °C, −20 °C, twin-screw cooling, PLC control, humidity control, 24/7 CCTV), TT4 data loggers, IMP and ancillary supplies, regulatory consulting.
- New time-critical product line: NFO (Next Flight Out), OBC premium (On-Board Courier), Direct Driver.
- Visual language: navy `#0E2A4A` cards on ink-blue `#1E4473`, cyan accent, white type, photos washed in blue. Fonts are Sora, Inter and Rubik. The new site evolves this rather than copying it.
- About 20 usable photos, extracted to `brand/photos/`: truck in motion, Schiphol/KLM apron, runway lights, container terminals, aerial port, OBC suitcase, sample tubes, specimen box, cold store, Schiphol aerial, Dutch flag, world-map outline.

**Conflicts to resolve with the client** (see §10): email `.nl` vs `.com`, Belgrade address and phone, whether TAPA TSR1 is still valid, and whether "3 offices" means 2 in Serbia.

---

## 2. Design direction: "Logger trace"

> The whole site is one shipment's **temperature-logger trace**, drawn by your scroll. It holds steady inside its safe band from pickup to delivery while the world around it changes: apron, road, sea, cold store.

Every pharma and clinical buyer knows the logger printout: the line that proves the cold chain held. Here it becomes the site's spine. It shows the brand promise ("in safe hands", precision, control) instead of stating it, and it connects air, road, sea and warehouse into the single journey the deck calls "One partner, every mode".

**What it refuses:** the category default of a cinematic hero video, three service cards, stat counters and a map.

**Kept disciplines** (from the challengers the roll dealt):
- Readouts **snap and settle**, like a stepping destination blind. Numbers never fade in.
- **One dominant image per chapter**, composed so it survives any crop.
- **Every claim is traceable**: each certification, temperature and project links to its evidence.

**Honesty rule:** the trace is *illustrative* and labelled as such ("Illustrative logger trace"). We never present it as live data, and there is no tracking portal.

### Visual system

| Token | Value | Role |
|---|---|---|
| `--ink-900` | `#071A30` | deepest ground (night chapters, footer) |
| `--ink-800` | `#0B2140` | main instrument ground |
| `--ink-700` | `#123A66` | raised panels, graticule fields |
| `--brand-blue` | `#1E4473` | deck blue, used for photo duotone |
| `--signal-cyan` | `#12C4DE` | **only** the live trace, in-band channel, live readouts and the logo |
| `--signal-cyan-dim` | `#12C4DE` at 18% | the band fill |
| `--alert-amber` | `#FFB23F` | **only** time-critical items, excursions and the "Request a quote" action |
| `--ice-50` | `#E9F6FA` | the one pale chapter (cold store) and form surfaces |
| `--paper` | `#F4F7FA` | body text on dark |
| `--muted` | `#9DB3CC` | secondary text on dark (≥ 4.5:1 on `--ink-800`) |

- **Colour strategy: Committed.** Navy owns 70% or more of the surface. Cyan is scarce, so when it appears it means "in control". Amber is rarer still and means "act now". One ice-white chapter breaks the rhythm at the cold store.
- **Typography: one family, Archivo** (variable width and weight, self-hosted via Fontsource):
  - Display: Archivo **Expanded** 700–800, echoing the wide logo wordmark. Headlines run 6–8vw on desktop.
  - Text: Archivo normal width, 400/500, 17–18 px body, line height 1.55, measure 60–70ch.
  - Readouts: Archivo **semi-condensed** 500 with tabular numerals, uppercase and tracked, e.g. `PICKUP · AMS · +4.1 °C · 04:12`.
  - No second family. Hierarchy comes from width, weight and case.
- **Graphic grammar:** hairline graticule grids, tick rails, bracketed readouts `[ +4.1 °C ]`, timestamp rails along chapter edges, and leader lines from trace events to labels. No glassmorphism, no gradient blobs, no icon tiles.
- **Icons:** Lucide line icons at a 1.5 px stroke, used sparingly. No emoji. The current blog and projects use emoji; they will be removed in migration.
- **Photography:** cool-graded photos with a blue/cyan duotone overlay from CSS blend modes, so stock, deck and AI images read as one set.

### Motion grammar (GSAP)

- **Signature: the Trace.** One SVG path runs the length of the home page. A ScrollTrigger scrub draws it, using DrawSVG or `stroke-dashoffset`. A fixed **readout** (bottom-right on desktop, a slim top bar on mobile) shows the current chapter's logged values: mode, location, temperature and time. They snap to new values with a small overshoot using a ScrambleText-style digit roll.
- **Chapter transitions:** pinned sections with scrubbed image push-in (scale 1.08 → 1) and headline line reveals (SplitText, masked lines, y 100% → 0).
- **The cold-chain moment:** at the warehouse chapter the single trace **splits into three bands**: −20 °C, +2–8 °C and +15–25 °C.
- **The time-critical moment:** the time rail accelerates and the trace steepens. NFO, OBC and Direct Driver appear in amber.
- **Smooth scroll:** Lenis synced to the GSAP ticker. It is disabled under `prefers-reduced-motion`.
- **Reduced motion:** no pinning or scrub. The trace renders fully drawn and every section shows its final state. Content is never hidden behind animation.
- **Budget:** at most 1–2 animated focal elements per viewport. Transforms and opacity only. Animations are created lazily per chapter and killed off-screen.

---

## 3. Information architecture and URLs

English-only, with clean English slugs. **Every old `/en/...` URL gets a 301 redirect**, and the old NL root URLs redirect to the matching EN page until NL launches.

| New page | URL | Replaces (301 from) | Source |
|---|---|---|---|
| Home (scroll story) | `/` | `/en`, `/` | site + deck |
| Services hub | `/services` | `/en/diensten`, `/diensten` | site + deck slide 5 |
| Air freight | `/services/air-freight` | `/en/luchtvracht`, `/luchtvracht` | site + deck 6–7 |
| Ocean freight | `/services/ocean-freight` | `/en/zeevracht`, `/zeevracht` | site + deck 8–9 |
| Road transport | `/services/road-transport` | `/en/weg-transport`, `/weg-transport` | site + deck 8–9 |
| Time-critical (NFO · OBC · Direct Driver) | `/services/time-critical` | (new) | deck 10–11 |
| Clinical trials & biological / DG | `/services/clinical-and-dangerous-goods` | (new) | deck 12–13, site |
| Bonded cold-chain warehouse | `/services/cold-chain-warehouse` | (new) | deck 14–15 |
| Projects (index) | `/projects` | `/en/s-projects-basic`, `/s-projects-basic` | site |
| Project detail ×6 | `/projects/<slug>` | (new) | site |
| About (+ certifications, footprint) | `/about` | `/en/over`, `/over` | site + deck 2–3, 16–18 |
| Team | `/team` | `/en/meet-the-team`, `/meet-the-team` | site |
| Request a quote | `/quote` | `/en/vraag-een-offerte-aan`, `/vraag-een-offerte-aan` | site, extended |
| Contact | `/contact` | `/en/contact`, `/contact` | site + deck 18 |
| Insights (blog) | `/insights` | `/en/blog`, `/blog` | site |
| Dangerous goods article | `/insights/dangerous-goods` | `/en/post/dangerous-goods` | site |
| Privacy policy | `/privacy` | (new, GDPR) | to be written |
| 404 | `/404` | | |

**Primary nav:** Services ▾ · Projects · About · Team · Insights · Contact · **[Request a quote]**, plus the phone number visible on desktop.

---

## 4. Home page: chapter by chapter

Each chapter adds a segment to the trace and shows a readout. The values are illustrative.

| # | Chapter | Readout | Content (kept from site/deck) | Key image | Motion |
|---|---|---|---|---|---|
| 0 | **Hero** | `PICKUP · AMS · +4.1 °C · 04:12` | "Your most sensitive shipments, in safe hands." Kicker: "Precision logistics since 2002 · Schiphol & Belgrade". CTAs: Request a quote / +31 20 333 2405 | AI: dusk apron, temperature-controlled container being loaded | Trace draws in on load; slow image push-in |
| 1 | **One partner, every mode** | `MODE · AIR / ROAD / SEA` | The 6 services (Air, Road & Marine, Critical Express, Biological & DGR, Cold-chain warehouse, Clinical trials) as **events on the trace**, each linking to its page | Graticule only, no photo (a quiet chapter) | Horizontal pinned run on desktop; events tick on as the trace passes them |
| 2 | **Air freight** | `CUSTOMS · AMS · +4.3 °C · 06:40` | The 4-step process (pickup → customs → Schiphol → door-to-door), IATA DGR registered | Deck: Schiphol KLM apron | Pinned; steps advance with the readout |
| 3 | **When it absolutely cannot wait** | `NFO · OBC · DIRECT · T−00:00` | NFO, **OBC premium**, Direct Driver | AI: courier at gate with hard case (deck OBC suitcase as fallback) | Time rail accelerates; amber accents |
| 4 | **The specialist difference** | `SPECIMEN · UN3373 · +3.9 °C` | Specimens worldwide, IMP and ancillary supplies, TT4-monitored vehicles, regulatory consulting, DG, lithium | Deck: lab tubes / specimen box | Macro image reveal; four notes appear along leader lines |
| 5 | **Bonded cold-chain warehouse** (ice chapter) | `ZONES · −20 / +2–8 / +15–25 °C` | Three zones, twin-screw cooling, PLC, humidity, 24/7 CCTV | Deck: cold store | **The trace splits into three bands**; light theme |
| 6 | **Proof: logged journeys** | `DELIVERED · PERTH · OK` | 6 projects (Brunei trucks, Perth >3 t, Mexico crate, Envirotainers to Australia, Kenya hospital, white glove) on a world map, with routes drawn from AMS | Deck world-map outline + project photos from the current site | Routes draw one by one; cards link to case pages |
| 7 | **A partner you can rely on** | `CERT · IATA · ISO 9001 · GDP` | Dedicated coordinator, one point of contact; IATA, ISO 9001:2015 TÜV SÜD, GDP, DGR (TAPA TSR1 if confirmed); the deck's quote "Placing your shipment in our hands…" | Badges on white tags | Badges snap into a rail; each links to its evidence |
| 8 | **Where to reach us** | `AMS 52.30N · BEG 44.82N` | Amsterdam Schiphol + Belgrade footprint; team preview (5 people) | Deck: Schiphol aerial | Two pins pulse once; no loops |
| 9 | **Close** | `DELIVERED · WITHIN RANGE ✓` | "Ready when your shipment is." Inline quote starter (mode + from/to) → `/quote` | AI or deck: Dutch flag sky / runway at dawn | The trace lands; the band closes; the readout turns to its final state |

---

## 5. Sub-page template

Every sub-page inherits the shell and a short version of the grammar:
- **Header band:** a chapter photo with a duotone, an expanded H1, a readout strip naming the service ("AIR · DGR · +2–8 °C capable"), and a **short trace segment** that draws once.
- **Body:** a two-column "spec sheet" layout with facts in readout rows (e.g. temperature ranges, modes) on the left and prose on the right. Then "What we can move" lists, a process strip, a related project, a related service, and a quote CTA prefilled with this mode.
- **Project pages:** a route line from origin to destination, the challenge, what we did, modes used, and photos. The facts come from the existing posts, rewritten without emoji.
- **Quote page:** styled as a consignment form (air-waybill grammar: numbered boxes). Fields: contact; mode (Air / Road / Ocean / Time-critical / Not sure); origin; destination; pieces, weight and dimensions; commodity; DG Y/N with UN number; temperature range (ambient / 15–25 / 2–8 / frozen / dry ice); ready date; notes; privacy consent. Multi-step on mobile, with validation and visible error states.

---

## 6. Imagery plan (deck photos + AI-generated)

The deck photos are already extracted to `brand/photos/`. The current site's project photos will be downloaded during migration. AI images fill the gaps and set the hero mood. All are graded to the same cool duotone.

| Slot | Source | Notes |
|---|---|---|
| Hero | **AI** | Dusk on an airport apron, an active temperature-controlled air-cargo container being loaded, cool blue light, no airline logos, room for the headline on the left |
| Time-critical | **AI** (fallback: deck suitcase) | Courier with a hard-shell case walking through a terminal, motion blur, face not identifiable |
| Road | Deck truck-in-motion | Already strong |
| Ocean | Deck aerial containership / AI | |
| Specialist | Deck lab tubes + specimen box | Possibly an AI macro of a sealed UN3373 shipper as an alternative |
| Cold store | Deck cold-store photos | **Ask the client** whether these are their own facility. If not, label them as illustrative |
| Projects | Current-site photos | Real; keep |
| Close | Deck runway lights / AI dawn runway | |
| Belgrade | **AI** or client-supplied | Generic airport cargo apron. **Not** presented as a specific facility |

**AI rules:** no real airline, carrier or competitor branding; no fake text on signage; no identifiable faces; never captioned as "our facility" or "our team". Every generated raster stores its prompt in its metadata, per impeccable's provenance rule. AI images go in `public/img/generated/`. We need the client's OK before AI images stand in for real operations.

---

## 7. Technical architecture

```
/
├── index.html                     # home (Vite MPA entries)
├── services/…/index.html, projects/…, about/, team/, quote/, contact/, insights/, privacy/, 404.html
├── src/
│   ├── styles/ tokens.css · base.css · components.css   (Tailwind v4 @theme maps tokens)
│   ├── content/ site.ts · services.ts · projects.ts · team.ts · certs.ts · posts.ts   (typed, i18n-ready)
│   ├── partials/ header.html · footer.html · quote-cta.html   (build-time includes)
│   ├── motion/ smooth.ts (Lenis) · trace.ts · readout.ts · chapters.ts · reveal.ts · reduced.ts
│   ├── components/ nav.ts · quote-form.ts · map-routes.ts
│   └── main.ts                    # per-page bootstrap, motion code lazy-loaded per chapter
├── public/ fonts/ · img/ · logo.svg · favicon · og images · robots.txt · _redirects / vercel.json
└── vite.config.ts                 # multi-page input, imagetools (AVIF/WebP srcset), html partial plugin
```

- **Stack:** Vite 6, TypeScript strict, Tailwind CSS v4 (`@tailwindcss/vite`), `gsap` (ScrollTrigger, SplitText, DrawSVG, ScrambleText; all free), `lenis`, `@fontsource-variable/archivo`, `lucide` (tree-shaken), and `vite-imagetools`.
- **Rendering:** static HTML per page, so content is in the HTML and readable without JS. JS enhances it with motion only.
- **SEO:** a unique title and description per page; Organization and LocalBusiness JSON-LD (both offices); `BreadcrumbList`; `Service` on service pages; `Article` on insights; sitemap.xml; canonical URLs; OG images; descriptive alt text.
- **Forms:** a provider-agnostic submit (e.g. Formspree, Netlify Forms or a serverless function) chosen once hosting is decided. It sends to the confirmed sales inbox and includes honeypot spam protection.
- **Performance budget:** LCP under 2.0 s on 4G; home JS under 120 KB gz; home page weight under 1.8 MB; CLS under 0.05; hero image AVIF under 180 KB. That compares with about 3 MB and 160 requests today.
- **Accessibility:** WCAG 2.2 AA. Semantic landmarks, a skip link, visible focus, a keyboard-operable nav and form, 4.5:1 contrast, reduced-motion support, no scroll-jacking (Lenis only smooths native scroll), and `aria-live` disabled on the decorative readout.
- **Quality gates:** `tsc --noEmit`, ESLint and Prettier, a Playwright smoke test of every route at 390 and 1440 px, Lighthouse CI (Perf ≥ 90, A11y ≥ 95, SEO = 100), and `impeccable detect` on the built HTML and CSS.

---

## 8. Content migration (preserve everything)

Everything on the current site carries over. It is corrected (typos, Dutch remnants, broken links per `ANALYSIS.md`) and merged with the deck:
- Home, About, and the Services / Air / Ocean / Road copy, rewritten for clarity while keeping every fact.
- All 6 project stories, split into individual case pages without emoji.
- The team: 5 people, roles and emails, with **real LinkedIn links** replacing the Wix placeholder.
- The Dangerous Goods blog post.
- Contact details and the address (fixing "Brequetlaan").
- **New from the deck:** time-critical, the cold-chain warehouse, clinical and biological, certifications, the Belgrade footprint, and the tagline.

---

## 9. Work phases

| Phase | Deliverable | Skills used |
|---|---|---|
| 0. Setup | Vite + TS + Tailwind + GSAP scaffold, MPA config, lint, Playwright, `DESIGN-TOKENS` in CSS | gsap-core, ui-styling |
| 1. Content model | Typed content files with all migrated and new copy; redirects map | |
| 2. Assets | Logo SVG redraw, favicon set, AI images, photo grading pipeline, OG images | design, banner-design |
| 3. Shell | Header/nav (mobile menu), footer, quote CTA, readout component, base typography | impeccable, ui-ux-pro-max |
| 4. Home | Chapters 0–9 with static layout first, then the Trace system and chapter motion | gsap-scrolltrigger, gsap-timeline, gsap-plugins |
| 5. Sub-pages | Service template ×6, projects index + 6, about, team, quote (multi-step form), contact, insights, privacy, 404 | impeccable |
| 6. Motion and perf pass | Reduced-motion path, lazy chapter init, image budgets | gsap-performance |
| 7. QA and finish | Screenshot round at 390/1440, `impeccable detect`, finish review, fixes, **DESIGN.md** | impeccable (audit, polish) |
| 8. Launch prep | Redirects, sitemap, JSON-LD, Lighthouse CI, deploy config | |

Suggested order of review checkpoints: **(a)** shell + hero + first two chapters in the browser, **(b)** the full home page, **(c)** all sub-pages, **(d)** the final QA report.

---

## 10. Open questions for the client

1. **Canonical sales email:** `salesams@express-cargo.nl` (deck) or `.com` (site)?
2. **Belgrade office:** the address, phone and what should be published. Does "3 offices" mean 2 in Serbia plus Schiphol?
3. **Cold-chain warehouse:** where is it (Belgrade?), and are the deck photos of the actual facility?
4. **Certifications:** confirm ISO 9001 certificate scope (which entity), GDP, and whether TAPA TSR1 is still current. Do we have permission to show the TÜV SÜD / GDP / IATA marks?
5. **Hosting and form backend** (Vercel, Netlify or other), plus who receives quote submissions.
6. **AI imagery:** is it OK to use AI-generated scene images (clearly not presented as their own facilities)?
7. **Team:** current team list, photos and LinkedIn URLs, and whether to add the Belgrade team.
8. **Analytics and cookie consent** preference.
