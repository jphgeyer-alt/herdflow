# Kilo Prompt - HerdFlow Phase 4

Use this exact prompt in Kilo Code.

You are the lead ecommerce architect for HerdFlow.
Plan only Phase 4: Analytics, experimentation, and monitoring operations.

Project context:
- Routes: /, /marketplace, /track, /app
- Frontend files: client/src/App.tsx, client/src/main.tsx
- Backend files: server/index.ts
- Split backends: website (4174), app (4175)

Current known state:
- Prior phases cover performance, conversion UX, and SEO.
- Build currently passes.

Output required:
1. Priority task list (impact vs effort)
2. Exact file-level implementation plan
3. Risks and mitigation (privacy, data quality, regression)
4. KPIs and monitoring signals to capture before/after
5. Definition-of-done checklist

Phase 4 goals:
1. Instrument key funnel events for ecommerce operations
2. Add simple experimentation framework/checklist
3. Add backend operational monitoring checkpoints
4. Keep existing routes and API behavior stable

Constraints:
- Avoid invasive vendor lock-in assumptions
- Keep privacy-sensitive handling explicit and minimal
- Preserve admin workflows and checkout behavior
- Keep changes modular and reviewable

Required metrics/signals:
- view_item
- add_to_cart
- begin_checkout
- purchase
- order tracking lookup success/failure rate
- API health/error trend for key endpoints

Deliver concise, execution-ready tasks for Cline.
