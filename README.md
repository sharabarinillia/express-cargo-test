# Express Cargo website

Redesign of express-cargo.nl. Vite + TypeScript + Tailwind CSS v4 + GSAP (ScrollTrigger, SplitText, ScrambleText) + Lenis.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run preview
node scripts/images.mjs   # rebuild responsive AVIF/WebP sets from brand/ into public/img
node scripts/services.mjs # service pages, English and Dutch
node scripts/lithium.mjs  # lithium battery page and classifier (rules and text: scripts/content/lithium.mjs)
```

- Pages: `index.html` (scroll story), `contact/index.html`. Shared markup lives in `src/partials/` and is included with `<!-- @include name -->`.
- Images: write `<ec-img name="…" alt="…" sizes="…">`; the Vite plugin in `vite.config.ts` expands it to a responsive `<picture>`.
- The trace (`src/lib/trace.ts`) is an illustrative logger line drawn by scroll; chapter readouts come from `data-stage/loc/temp/time` on each `[data-chapter]`.
- Contact form: set `VITE_FORM_ENDPOINT` to POST JSON to a form backend; without it, submitting opens the visitor's email app pre-filled.
- Plan and product context: `PLAN.md`, `PRODUCT.md`, `ANALYSIS.md`.
