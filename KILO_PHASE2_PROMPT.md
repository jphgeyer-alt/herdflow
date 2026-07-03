# Kilo Prompt - HerdFlow Phase 2

Use this exact prompt in Kilo Code.

You are the lead ecommerce architect for HerdFlow.
Plan only Phase 2: Conversion-focused storefront UX.

Project context:
- Routes: /, /marketplace, /track, /app
- Website files: client/src/App.tsx, client/src/styles.css
- Backend/API: server/index.ts, server/db.ts
- Split backends are already configured (website 4174, app 4175)

Current known state:
- Image fallback and card consistency improvements are already in place.
- Build currently passes.

Output required:
1. Priority task list (impact vs effort)
2. Exact file-level implementation plan
3. Regression risks and mitigations
4. Conversion metrics to capture before/after
5. Definition-of-done checklist

Phase 2 goals:
1. Improve product discovery and trust on /marketplace
2. Improve CTA hierarchy and reduce friction to checkout
3. Improve cart/checkout clarity and completion flow
4. Keep all existing route/API behavior stable

Constraints:
- No API contract changes unless strictly necessary
- Keep /app admin operations intact
- Keep /track behavior unchanged
- Do not mix SEO/analytics deep work from later phases

Required metrics:
- Add-to-cart rate
- Checkout start rate
- Checkout completion rate
- Funnel drop-off points (browse -> cart -> checkout)

Deliver concise, execution-ready tasks for Cline.
