# Kilo Prompt - HerdFlow Phase 3

Use this exact prompt in Kilo Code.

You are the lead ecommerce architect for HerdFlow.
Plan only Phase 3: SEO and discoverability foundation.

Project context:
- Routes: /, /marketplace, /track, /app
- Frontend files: client/src/App.tsx, client/src/main.tsx, client/index.html
- Styling: client/src/styles.css
- Server: server/index.ts
- Build config: vite.config.ts

Current known state:
- Performance/image hardening and conversion UX work are handled in earlier phases.
- Build currently passes.

Output required:
1. Priority task list (impact vs effort)
2. Exact file-level implementation plan
3. Regression risks and mitigations
4. SEO metrics to capture before/after
5. Definition-of-done checklist

Phase 3 goals:
1. Improve technical SEO for primary routes
2. Improve rich results readiness (structured metadata)
3. Improve social sharing previews
4. Keep user flow and admin behavior unchanged

Constraints:
- Do not break routes /, /marketplace, /track, /app
- Do not alter backend contracts unless strictly required
- Keep app/admin behavior stable
- Keep work scoped to SEO/discoverability (no major conversion redesign)

Required metrics:
- Lighthouse SEO score
- Indexability checks (title/meta/canonical consistency)
- Social preview quality (Open Graph/Twitter metadata)
- Structured data validation pass/fail

Deliver concise, execution-ready tasks for Cline.
