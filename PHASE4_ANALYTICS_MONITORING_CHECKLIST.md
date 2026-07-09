# HerdFlow Phase 4 Analytics and Monitoring Checklist

Use this before and after Phase 4 implementation.

## 1) Funnel instrumentation baseline

Confirm whether these are currently tracked:

1. view_item
2. add_to_cart
3. begin_checkout
4. purchase

Record current gap per event:

- Not tracked
- Partially tracked
- Fully tracked

## 2) Operational monitoring baseline

Check current signals:

1. /health availability checks
2. Error visibility for key API actions
3. Status update visibility for orders
4. Backup import/export success visibility

Record what is missing.

## 3) Post-implementation validation

After implementation verify:

1. view_item fires on product view/list interactions
2. add_to_cart fires when cart action happens
3. begin_checkout fires when checkout starts
4. purchase fires on successful order submit
5. tracking lookup success/failure is observable

## 4) Backend reliability checks

1. /health still returns ok
2. Key endpoints remain functional:

- /api/orders
- /api/orders/:id/status
- /api/orders/track
- /api/marketplace/items

3. Build still passes:

- npm run build

## 5) Experiment readiness checks

1. At least one measurable hypothesis template exists
2. KPI owner and review cadence are documented
3. Rollback strategy is clear for risky UI tests

## 6) Before/after score table

Score each 1 (poor) to 5 (excellent).

| Check                     | Before | After | Delta |
| ------------------------- | -----: | ----: | ----: |
| Funnel visibility         |        |       |       |
| Checkout observability    |        |       |       |
| Tracking error visibility |        |       |       |
| API health monitoring     |        |       |       |
| Experiment readiness      |        |       |       |
