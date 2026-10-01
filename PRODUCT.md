# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + TypeScript + Tailwind CSS (plus plain CSS where Tailwind is the wrong tool). No UI framework was requested, so the default is vanilla TS with multi-page Vite entries. GSAP (ScrollTrigger and its plugins) handles scroll-driven motion. The output is static, and the deploy target is still undecided.

## Users

- **Primary:** logistics, supply-chain and clinical-operations buyers at pharma, biotech, CROs, hospitals, labs, oil & gas, and industrial/project-cargo shippers. Most are based in the Netherlands, Serbia and wider Europe. Each has a time-critical or sensitive shipment (clinical trial material, biological specimens, dangerous goods, temperature-controlled freight, oversize cargo) and needs a forwarder they can trust with it, quickly.
- **Secondary:** existing clients checking contacts, and partners or agents in the forwarding network.

## Product Purpose

The site is the marketing and lead-generation website for Express Cargo (Express-Cargo Group). It must make clear within seconds that this is a specialist forwarder for shipments others won't touch. It must prove that with real certifications, real projects and real people, and then turn the visit into a quote request or a direct call or email. Success means more qualified quote requests that already contain the shipment data needed to price them.

## Positioning

Express Cargo is a small, specialised forwarder founded in 2002, with offices at Amsterdam Schiphol and in Serbia (Belgrade airport). It specialises in clinical trials, biological samples, dangerous goods (IATA DGR) and bonded cold-chain warehousing. Each shipment is handled by one dedicated coordinator from start to finish. Premium time-critical options: NFO (Next Flight Out), OBC (On-Board Courier, hand-carried as cabin luggage) and Direct Driver. Tagline from the deck: *"Your most sensitive shipments, in safe hands."*

## Operating Context

- Modes: air freight (customs-cleared, door-to-door, via Amsterdam Schiphol and Belgrade airport), ocean freight (FCL/LCL), and road (national, EU-wide, container and oversize, groupage, TAPA TSR1, art, hanging fashion, medical samples).
- Air freight process: 01 Pickup at your location, 02 Import/export customs clearance, 03 Transport to and from Amsterdam airport, 04 Door-to-door delivery.
- Specialist: worldwide specimen transport via the partner-agent network; clinical drug substance, IMP, drug product and ancillary supplies; temperature-controlled vehicles monitored live by TT4 data loggers; regulatory and foreign-trade consulting; full import/export documentation; lithium; bonded warehousing.
- Cold-chain warehouse zones: +15 to +25 °C (ambient controlled), +2 to +8 °C (refrigerated), −20 °C (frozen). Twin-screw double cooling, PLC automatic temperature control, humidity control, 24/7 CCTV.
- Visitors arrive from search, LinkedIn and the printed or PDF presentation. Conversion happens through the quote form, phone or email.

## Capabilities and Constraints

- Hybrid information architecture: an immersive scroll-story home page plus real sub-pages for each service, projects, team, quote, contact and blog post. Existing `/en/...` URLs must keep working, via redirects or the same slugs.
- English only at launch. Content must be structured so NL can be added later.
- The quote form must capture shipment data (mode, origin, destination, pieces/weight/dimensions, DG yes/no, temperature range, ready date). The form backend is still undecided.
- Undecided: deploy target, form backend, analytics and consent tool, and whether the Belgrade office's address and phone get published (they are not in the source material).

## Brand Commitments

- **Logo:** cyan four-engine aircraft above a white "express cargo" wordmark (`brand/source/logo-white-cyan.png`, plus a larger derived version at `brand/source/logo-831-transparent.png`). It must be preserved. A vector redraw (SVG) is needed.
- **Brand colours used consistently in the logo and deck:** cyan (logo plane ≈ #12C4DE), deep navy (#0E2A4A), ink blue (#1E4473) and white.
- **Name:** "Express Cargo" (group: "Express-Cargo Group"; NL entity sometimes "Express-Cargo Amsterdam").
- **Voice:** calm, precise and reassuring, with no hype. Deck lines to keep: "Precision logistics since 2002", "Fast & Safe Transportation", "One partner, every mode", "When it absolutely cannot wait", "A partner you can rely on", "Placing your shipment in our hands is placing it in safe and reliable hands."

- **User decisions (October 2026):** the dark "Logger trace" design was not approved. The site must be **semi-light** and use a completely new design. It should be immersive and modern, with scroll-based animation and icons, and it should use Magnific stock photos and video for imagery. The chosen direction is "Flight chart" (aeronautical chart).

## Evidence on Hand

- The deck: `brand/source/express-cargo-presentation.pdf` (19 slides).
- Photos extracted from the deck: `brand/photos/` (truck in motion, Schiphol/KLM apron, runway approach lights, container terminals, aerial port, OBC suitcase, lab tubes, specimen box, cold store, Schiphol aerial, Dutch flag, Amsterdam canal, world-map outline). `canal-ship-truck-tulips-ai.jpg` appears to be AI-generated already.
- Current site content and audit: `ANALYSIS.md`. It covers 6 real project case studies (trucks to Brunei, >3 t to Perth, crate to Mexico, Envirotainers to Australia, medical equipment to Madiany Sub County Hospital in Kenya, and white-glove delivery), 5 named team members with roles and emails, and the Dangerous Goods blog post.
- Certifications claimed in the deck: IATA member, IATA DGR, ISO 9001:2015 (TÜV SÜD), GDP. The current site also claims TAPA TSR1. Badge artwork is in the deck.
- Contact: Breguetlaan 21, 1438 BA Oude Meer (Schiphol), +31 20 333 2405. Email is inconsistent: the deck uses `salesams@express-cargo.nl` and the site uses `salesams@express-cargo.com`. **The canonical email needs confirming.**
- **Must not be fabricated:** client names or logos, testimonials, shipment volumes, on-time percentages, transit times, prices, tracking capability (there is no tracking portal), and Belgrade address details.

## Product Principles

1. Sensitive cargo, calm hands. Every surface should feel controlled and certain, never frantic, even when the message is speed.
2. Prove, don't claim. Lead with real projects, real certifications, real people and real temperature ranges.
3. One partner, every mode. The site should read as one continuous journey across air, road and sea, not as a catalogue of disconnected services.
4. A quote is one step away from anywhere, and it asks for the data needed to price the shipment.

## Accessibility & Inclusion

Target WCAG 2.2 AA. All scroll-driven motion must respect `prefers-reduced-motion`, keep content readable without JS, and never trap keyboard focus or hijack native scrolling.
