# HerdFlow Kilo + Cline Master Run Order

This is the single-file execution sequence for your team.

## 0) Preparation

1. Confirm environment setup:

- .env from .env.example
- expo/.env from expo/.env.example

2. Confirm local services if needed:

- Website backend: npm run dev:server:website
- App backend: npm run dev:server:app
- Website frontend: npm run dev:client

3. Keep this operating rule:

- Kilo plans one phase.
- Cline implements that phase only.

## 1) Global strategy and workflow

Read first:

- KILO_CLINE_ECOMMERCE_PLAYBOOK.md

## 2) Phase 1 - Performance and image pipeline

1. Baseline and metrics:

- PHASE1_BASELINE_CHECKLIST.md

2. Plan in Kilo:

- KILO_PHASE1_PROMPT.md

3. Implement in Cline:

- CLINE_PHASE1_PROMPT.md

4. Re-run checklist and capture before/after table.

## 3) Phase 2 - Conversion UX

1. Baseline and conversion checks:

- PHASE2_CONVERSION_CHECKLIST.md

2. Plan in Kilo:

- KILO_PHASE2_PROMPT.md

3. Implement in Cline:

- CLINE_PHASE2_PROMPT.md

4. Re-run checklist and capture before/after scores.

## 4) Phase 3 - SEO and discoverability

1. Baseline SEO checks:

- PHASE3_SEO_CHECKLIST.md

2. Plan in Kilo:

- KILO_PHASE3_PROMPT.md

3. Implement in Cline:

- CLINE_PHASE3_PROMPT.md

4. Re-run checklist and capture before/after scores.

## 5) Phase 4 - Analytics and monitoring

1. Baseline observability checks:

- PHASE4_ANALYTICS_MONITORING_CHECKLIST.md

2. Plan in Kilo:

- KILO_PHASE4_PROMPT.md

3. Implement in Cline:

- CLINE_PHASE4_PROMPT.md

4. Re-run checklist and capture before/after scores.

## 6) Governance for every phase

Before merge:

1. npm run build passes
2. No route regressions on /, /marketplace, /track, /app
3. Admin workflows remain operational

After merge:

1. Record KPI deltas from phase checklist
2. Log wins, regressions, and follow-up actions
3. Move to next phase only after sign-off

## 7) Team handoff template

For each phase handoff, include:

1. Kilo plan summary
2. Cline implementation summary
3. Build/validation output
4. Before/after table from checklist
5. Go/no-go recommendation for next phase

## 8) Quick links

- Strategy: KILO_CLINE_ECOMMERCE_PLAYBOOK.md
- P1: KILO_PHASE1_PROMPT.md, CLINE_PHASE1_PROMPT.md, PHASE1_BASELINE_CHECKLIST.md
- P2: KILO_PHASE2_PROMPT.md, CLINE_PHASE2_PROMPT.md, PHASE2_CONVERSION_CHECKLIST.md
- P3: KILO_PHASE3_PROMPT.md, CLINE_PHASE3_PROMPT.md, PHASE3_SEO_CHECKLIST.md
- P4: KILO_PHASE4_PROMPT.md, CLINE_PHASE4_PROMPT.md, PHASE4_ANALYTICS_MONITORING_CHECKLIST.md
