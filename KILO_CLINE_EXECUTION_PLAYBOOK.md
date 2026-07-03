# HerdFlow Kilo + Cline Execution Playbook

Use this to run Kilo Code and Cline as a coordinated delivery pipeline for HerdFlow.

## Goal

Ship enterprise-grade improvements continuously without breaking existing business flows on:

- `/` website
- `/marketplace` storefront
- `/track` order tracking
- `/app` admin operations

## Agent Roles

- Kilo Code: planning, architecture, risk analysis, acceptance criteria.
- Cline: implementation, edits, command execution, validation.

## Run Order Per Phase

1. Open Kilo Code and paste the matching `KILO_PHASEX_PROMPT.md`.
2. Review Kilo output and approve the plan.
3. Open Cline and paste the matching `CLINE_PHASEX_PROMPT.md`.
4. Require Cline to report:
   - changed files
   - build/errors status
   - regression risks
   - metrics deltas

## Phase Mapping

- Phase 1: performance and image pipeline hardening
- Phase 2: conversion and trust optimization
- Phase 3: analytics and funnel instrumentation
- Phase 4: scale, operations, and release readiness

## Mandatory Validation After Each Phase

Run from project root:

```bash
npm run build
npm run dev:preflight
```

Then launch and smoke test:

```bash
npm run dev
npm run expo:start
```

## Business-Critical Smoke Tests

1. Add item to cart on `/marketplace` and submit order.
2. Track order on `/track`.
3. Verify admin operations still work on `/app`.
4. Verify mobile app marketplace and dashboard load from API.

## Guardrails

- Do not change route contracts or API payload shapes without explicit migration.
- Keep split backend model intact (website + app backend).
- Keep fallback behavior for product images and offline resilience.
- Prefer additive changes over large rewrites.

## Completion Standard

A phase is done only when:

1. Production build passes.
2. No new TypeScript/runtime errors in edited files.
3. Core smoke tests pass on web and app.
4. Results are documented in a short release note.
