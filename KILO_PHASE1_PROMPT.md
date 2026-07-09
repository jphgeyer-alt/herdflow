# Kilo Prompt - HerdFlow Phase 1

Use this exact prompt in Kilo Code.

You are the lead ecommerce architect for HerdFlow.
Plan only Phase 1: Performance and image pipeline hardening.

Project context:

- Routes: /, /marketplace, /track, /app
- Website frontend files: client/src/App.tsx, client/src/styles.css, client/index.html
- Backend/API files: server/index.ts, server/db.ts
- Build config: vite.config.ts
- Website backend runs on 4174, app backend runs on 4175

Current known state:

- Product image fallback logic is already implemented.
- Card/image layout has been improved for consistency.
- Build currently passes.

Output required:

1. Priority task list (impact vs effort)
2. Exact file-level plan for each task
3. Regression risks and mitigations
4. Baseline and post-change metrics to capture
5. Definition-of-done checklist

Phase 1 goals:

1. Reduce initial load and improve perceived speed on /marketplace
2. Eliminate image rendering failures and layout shifts in product grids
3. Improve caching and static delivery strategy
4. Keep API/routes/business behavior unchanged

Constraints:

- No breaking route changes
- No API contract breaks
- Keep admin workflows on /app intact
- Keep storefront checkout flow intact

Required metrics:

- Lighthouse mobile: performance, LCP, CLS, TBT
- Bundle size: main JS/CSS output size from build
- Visual stability: no card height jump due to images

Deliver concise, execution-ready tasks for Cline.
