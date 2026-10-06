# Next task: SEO and GEO for express-cargo.nl

## Status (implemented on `claude/wizardly-fermat-fmmblm`)

| Phase | State | Where |
|---|---|---|
| 1. Migration | Done: 25 permanent redirects from the Wix URLs (Dutch root pages, the `/en/` mirror and the blog post, checked against the live URL inventory); verification tags kept; `robots.txt`; build-time `sitemap.xml` with hreflang; 1200×630 share images per page in both languages | `vercel.json` (from `scripts/redirects.mjs`), `src/partials/head.html`, `public/robots.txt`, `vite.config.ts`, `scripts/og.mjs` |
| 2. Structured data | Done: one generated `@graph` per page (Organization `@id`, WebSite, WebPage, BreadcrumbList, Service, WebApplication, DefinedTermSet, people, FAQPage). The build fails on invalid graphs or duplicate titles, descriptions and canonicals | `scripts/seo.mjs` |
| 3. GEO content | Done: `llms.txt`, plus answer-first FAQs (4–5 per page, English and Dutch) on the service, tools and Incoterms pages. Explainer and case pages are still to do | `public/llms.txt`, `src/content/faq.json` |
| 4. Dutch version | Done: `/nl/` mirror with hreflang and a language switch | `nl/`, `scripts/i18n/` |
| 5. Measurement | Waiting on the client | |

Verified: `tsc` and the build pass; every page has a unique title, description and canonical; Lighthouse SEO is 100 on home, air freight, tools and the Dutch air freight page; 520 internal links resolve.

### Open questions for Express Cargo
1. **Root language.** The old `/` was the Dutch homepage, and `/` is now English (Dutch at `/nl/`, linked with hreflang). Should `/` stay English, or should Dutch be the default?
2. **Analytics.** Which tool, if any? Plausible or Fathom need no cookie banner; GA4 does. Events to track: `quote_submit`, `tool_calculate`, `chart_download`, `tel_click`, `mailto_click`.
3. **Form backend.** Where should quote requests go (`VITE_FORM_ENDPOINT`)? This is also needed to count quote requests as conversions.
4. **Quote turnaround.** Is there a typical time we can state (for example "within one working day")? The FAQ currently says only that quotes go out fast.
5. **Google Business Profile.** Who manages it? Its name, address and phone must match the site.
6. **Blog.** The Wix blog had one post (Dangerous Goods), which now redirects to air freight. Should we bring news or articles back?
7. **Hosting.** The redirects are written for Vercel (the `express-cargo-test` project). If the domain will be hosted elsewhere, they need porting.
8. **Slash-less contact URL.** `/contact` (no slash, the old Dutch page) now redirects to `/nl/contact/`. The English page is `/contact/`.

Goal: the new site replaces the Wix site at www.express-cargo.nl without losing rankings. It then becomes the source that both search engines and AI assistants (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) quote for specialist air freight from Schiphol, chargeable weight and Incoterms.

GEO means generative engine optimisation: being quoted and cited by AI assistants.

## Where we start

**Already in place**
- Static, pre-rendered HTML on every page. Content is readable without JavaScript.
- One `<h1>` per page.
- Canonical URLs and per-page titles and descriptions.
- JSON-LD:
  - `Organization` on home.
  - `LocalBusiness` on contact.
  - `Service` on each service page.
  - `WebPage` on resources.
- Fast pages:
  - Lazy media.
  - The WebGL globe and three.js load only near the projects section.

**Missing**
- `robots.txt`, `sitemap.xml`, `llms.txt`.
- Redirects from the old Wix URLs.
- A Dutch-language version, with hreflang.
- `og:image` on contact and tools.
- Breadcrumbs and FAQ content and markup.
- The existing Search Console and Bing verification tokens.
- Analytics and conversion tracking.

**Decisions needed from Express Cargo**
1. Is the site English-only, or English and Dutch? The current Wix site is Dutch-first.
2. Which analytics tool, if any? Plausible or Fathom need no cookie banner; GA4 does.
3. The form backend (`VITE_FORM_ENDPOINT`). It is needed to measure quote requests as conversions.
4. Is the Google Business Profile (maps cid 6484987491529801286) managed by them? Its name, address and phone must match the site exactly.

## Phase 1: migrate without losing rankings (must ship with launch)

1. **301 redirects** from the Wix URLs, set on the host (Vercel `vercel.json` or Netlify `_redirects`):

   | Old (Wix) | New |
   |---|---|
   | `/luchtvracht` | `/services/air-freight/` |
   | `/zeevracht` | `/services/sea-freight/` |
   | `/weg-transport` | `/services/road-transport/` |
   | `/s-projects-basic` | `/services/special-projects/` |
   | `/diensten` | `/#services` (or a future `/services/` index) |
   | `/over` | `/#about` |
   | `/meet-the-team` | `/#crew` |
   | `/contact`, `/vraag-een-offerte-aan` | `/contact/` |
   | `/blog`, `/post/*` | decide: keep the posts as `/news/…` or point them to `/` |

   Check the full list first: export the indexed URLs from Search Console, or crawl the live site with Firecrawl `map`.
2. **Keep the verification meta tags** from the Wix site in `src/partials/head.html`:
   - `google-site-verification` = `-uZltBl6LcvJnBcW-tSytMkQV4R_yLanHzgssR3LkMs`
   - `msvalidate.01` = `A2F025482B19C0A5DCF33D9FEC8736E9`
3. **`public/robots.txt`**: allow everything, reference the sitemap, and explicitly allow the AI crawlers (`GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`).
4. **`sitemap.xml`** generated at build time from the Vite inputs (a small plugin in `vite.config.ts`), with `lastmod`.
5. **Social images**: add `og:image` to contact and tools, and a 1200×630 image per service page (built from the existing posters with the sharp pipeline).
6. **Submit** the sitemap in Google Search Console and Bing Webmaster Tools, which also feeds ChatGPT search. Then watch coverage and redirects for 4 weeks.

## Phase 2: structured data and entity consistency

- **`BreadcrumbList`** on every inner page (Home › Services › Air freight).
- **Home page `Organization`**:
  - `@id` and `logo`.
  - `contactPoint` with the sales email and phone.
  - `areaServed`.
  - `knowsAbout`: dangerous goods, IATA DGR, clinical trials, cold chain, Incoterms.
  - `hasCredential` for ISO 9001, IATA and GDP.
  - `sameAs`: LinkedIn and the Google Business Profile.
- **One `@id` for the company**, referenced from every `Service`, `LocalBusiness` and `WebPage`, so engines see a single entity.
- **Tools page**: `WebApplication` (free calculator).
- **Incoterms content**: `DefinedTermSet` with one `DefinedTerm` per rule.
- **`FAQPage`** where real questions are answered on the page (Phase 3).
- **Consistent name, address and phone** everywhere: site, Google Business Profile, LinkedIn and directory listings (Global Logistics Network profile).
- **Validate** with the Rich Results Test and the Schema.org validator. Add a build-time check that every page's JSON-LD parses.

## Phase 3: content that gets quoted (GEO)

AI assistants cite pages that answer a question directly, show their numbers and name their sources. The tools and Incoterms pages already do this. Extend that pattern:

1. **Answer-first FAQ blocks** of 4–6 questions on each service page and on tools and resources, written from the client's real enquiries. Examples:
   - "How is chargeable weight calculated for air freight?"
   - "What is the IATA volumetric factor?"
   - "Can you ship lithium batteries by air from Schiphol?"
   - "What does UN3373 mean?"
   - "What is the difference between FCL and LCL?"
   - "Which Incoterm should I use for air freight?"
   - "How fast do you send a quote?" Only with the client's real turnaround time.
2. **Explainers** for each specialist cargo type, as their own URLs:
   - dangerous goods
   - lithium batteries
   - clinical trial and UN3373 samples
   - dry ice (UN1845)
   - temperature-controlled / Envirotainer
   - TAPA TSR1
   - white glove

   Each one gets a definition, how Express Cargo handles it, the documents needed, and a link to the official source.
3. **`public/llms.txt`**: a plain-language summary of who Express Cargo is, its services, coverage, certifications and contact details, with links to the canonical pages. Optionally add `llms-full.txt` with the tools' rules and the Incoterms table.
4. **Project case pages** (Brunei, Australia Envirotainer, Mexico crate, Kenya hospital, Perth): one short page each, with route, mode, constraint and outcome. These are concrete, citable facts.
5. **Freshness**: a visible "Updated" date on the tools and Incoterms pages, and an update when IATA DGR changes each year.

## Phase 4: Dutch version (if the client wants it)

- `/nl/` mirror with translated content, plus `hreflang="en"`, `hreflang="nl"` and `x-default` on every page, and a language switch in the header.
- Dutch keywords are where Schiphol shippers search: luchtvracht Schiphol, gevaarlijke stoffen verzenden, droogijs zending, volumegewicht berekenen, laadmeter berekenen, Incoterms 2020 uitleg.
- Move the page generators (`scripts/services.mjs`, `scripts/resources.mjs`) to locale content files so both languages share one template.

## Phase 5: measure

- Privacy-friendly analytics, tracking these events:
  - `quote_submit`
  - `tool_calculate` (by mode)
  - `chart_download`
  - `tel_click` and `mailto_click`
- Search Console and Bing dashboards. Check every month:
  - impressions for service and tool queries
  - indexing coverage
  - Core Web Vitals (target LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on mobile)
- **GEO check every month**: ask ChatGPT, Claude, Perplexity and Google AI Mode a fixed set of 15 questions, such as "freight forwarder Schiphol dangerous goods" and "how to calculate air freight chargeable weight". Record whether express-cargo.nl is cited.

## Definition of done

- [ ] Every old Wix URL returns 301 to the right new page; no 404s in Search Console after 2 weeks.
- [ ] `robots.txt`, `sitemap.xml` and `llms.txt` are live; the sitemap is accepted in Google and Bing.
- [ ] Every page has a unique title and description, a canonical, an `og:image` and breadcrumbs; JSON-LD passes validation.
- [ ] FAQ blocks are live on 6 pages, with matching `FAQPage` markup.
- [ ] Lighthouse SEO is 100 and Performance is at least 90 on mobile, for home, one service page and tools.
- [ ] Analytics records quote submissions and tool use.
- [ ] A baseline GEO citation check is recorded.
