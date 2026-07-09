# Cline Prompt - HerdFlow Phase 1

Use this exact prompt in Cline after Kilo Code provides the approved Phase 1 plan.

Implement only HerdFlow Phase 1: Performance and image pipeline hardening.

Scope:

- Primary files: client/src/App.tsx, client/src/styles.css, client/index.html, vite.config.ts
- Optional only if required: server/index.ts

Requirements:

1. Apply only tasks from the approved Kilo Code Phase 1 plan.
2. Do not include changes from later phases (SEO schema, analytics events, major UX restructuring).
3. Keep existing routes and API behavior stable.
4. Preserve all admin operations in /app and storefront operations in /marketplace.
5. Maintain robust product image behavior (fallbacks, consistent sizing, no broken icon rendering).

Definition of done:

1. Production build passes.
2. No TypeScript errors in modified files.
3. No visual regressions in product cards/admin catalog image rendering.
4. Performance metrics captured before and after.

Deliverables format:

1. Changed files list
2. Summary of what was optimized
3. Validation output (build/lint/errors)
4. Before/after metric table
5. Follow-up recommendations for Phase 2
