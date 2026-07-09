# HerdFlow Kilo + Cline Ecommerce Execution Playbook

This playbook gives you a practical workflow to use Kilo Code and Cline together to improve HerdFlow into a highly professional ecommerce website.

## 1) Operating model

Use Kilo Code as planner and reviewer:

- Architecture decisions
- Prioritization and phasing
- Risk review and regression checks
- KPI definitions

Use Cline as implementer:

- Scoped code changes per phase
- UI refactors and performance tasks
- QA fixes and test/build validation

Rule:

- Kilo plans one phase at a time.
- Cline implements only that phase.
- Do not mix multi-phase changes in one run.

## 2) HerdFlow baseline (current)

Core website paths:

- / (marketing + lead capture)
- /marketplace (customer storefront)
- /track (order tracking)
- /app (operations/admin)

Key code files:

- client/src/App.tsx
- client/src/styles.css
- server/index.ts
- server/db.ts
- vite.config.ts

Backend split:

- Website backend: port 4174, data file server/data/herdflow-website.json
- App backend: port 4175, data file server/data/herdflow-app.json

## 3) North-star KPIs

Set these as target outcomes:

1. Mobile Lighthouse performance >= 90 on /marketplace
2. Core Web Vitals pass in production
3. Product image failures = 0 in storefront cards
4. Add-to-cart rate up week-over-week
5. Checkout completion rate up week-over-week
6. Admin catalog update time under 2 minutes per item

## 4) 4-phase execution roadmap

### Phase 1: Performance and image pipeline hardening

Goals:

- Faster first load for /marketplace and /app
- Stable and consistent product media rendering

Tasks:

1. Audit bundle and remove dead/duplicate render paths.
2. Improve product image handling policy (source validation, fallbacks, consistent ratios).
3. Tighten caching strategy for static assets and media.
4. Verify lazy loading and avoid layout shifts in product grids.

Definition of done:

- Production build passes.
- No broken image icons in catalog/storefront.
- Measured speed improvement from baseline.

### Phase 2: Conversion-focused storefront UX

Goals:

- Strong product discovery and purchase confidence

Tasks:

1. Improve product card hierarchy (title, price, stock, CTA).
2. Improve category/filter/sort UX for faster finding.
3. Strengthen trust modules (delivery, payment, support, return policy).
4. Tighten checkout form clarity and error handling.

Definition of done:

- Cleaner scan path on mobile and desktop.
- Fewer clicks from browse to checkout.

### Phase 3: SEO and growth foundation

Goals:

- Better search visibility and richer social previews

Tasks:

1. Add robust per-route metadata strategy.
2. Add structured data for organization and product pages.
3. Add sitemap and robots strategy.
4. Improve semantic markup and heading structure.

Definition of done:

- Indexed pages have valid metadata and schema.
- Social share previews look professional.

### Phase 4: Analytics, experimentation, and trust operations

Goals:

- Measurable conversion optimization loop

Tasks:

1. Instrument funnel events: view_item, add_to_cart, begin_checkout, purchase.
2. Add admin-ready KPI reporting checkpoints.
3. Add experiment checklist for CTA/layout tests.
4. Add error monitoring and alert strategy for checkout/order endpoints.

Definition of done:

- Weekly performance + conversion review possible from data.
- Operational regressions are detected quickly.

## 5) Prompt templates

## Kilo prompt template (phase planning)

Paste this into Kilo:

You are the lead ecommerce architect for HerdFlow.
Plan only Phase [X] from the execution roadmap.

Project context:

- Routes: /, /marketplace, /track, /app
- Key files: client/src/App.tsx, client/src/styles.css, server/index.ts, server/db.ts, vite.config.ts
- Backends are split (website on 4174, app on 4175).

Output required:

1. Priority task list (impact vs effort)
2. Exact file-level change plan
3. Regression risks and mitigation
4. Metrics to capture before/after
5. Definition of done checklist

Constraints:

- Keep existing business logic and routes unless explicitly required.
- Prefer incremental, reviewable changes.

## Cline prompt template (phase implementation)

Paste this into Cline:

Implement only Phase [X] for HerdFlow.

Scope:

- Follow this file set unless needed: client/src/App.tsx, client/src/styles.css, server/index.ts, vite.config.ts

Requirements:

1. Complete all tasks listed in the approved Kilo plan for this phase.
2. Do not include tasks from later phases.
3. Keep existing routes and API behavior stable.
4. Validate with production build.

Deliverables:

1. Code changes
2. Short changelog
3. Validation notes (build/test)
4. Any follow-up items for next phase

## 6) Weekly execution rhythm

1. Monday: Kilo plans current phase.
2. Tuesday-Wednesday: Cline implements and validates.
3. Thursday: Review KPIs and QA results.
4. Friday: Kilo prepares next-phase adjustments.

## 7) Governance checklist for every phase

Before merge:

1. Build passes.
2. No route regressions on /, /marketplace, /track, /app.
3. Product images load and fit consistently.
4. Mobile layout verified.
5. Admin actions still work for catalog/orders/registrations.

After merge:

1. Capture KPI deltas.
2. Record what improved and what did not.
3. Feed findings into next Kilo planning run.

## 8) Suggested first run (copy and execute)

1. Run Kilo with the planning template for Phase 1.
2. Approve Kilo plan and hand it to Cline with the implementation template.
3. Execute changes and run build.
4. Log results in a short note file with:

- What changed
- Metrics before/after
- Remaining bottlenecks

This keeps your optimization work disciplined, measurable, and professional.
