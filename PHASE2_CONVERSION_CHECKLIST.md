# HerdFlow Phase 2 Conversion Checklist

Use this before and after Phase 2 implementation.

## 1) Baseline checks

Start local stack:
1. npm run dev:server:website
2. npm run dev:client

Test flows on /marketplace:
1. Find a product via search
2. Filter by category
3. Add item to cart
4. Update quantity
5. Go through checkout fields
6. Submit order
7. Open /track and lookup order

Record friction points:
- Where users pause/confuse
- Unclear labels/messages
- Weak trust cues before purchase

## 2) UX quality targets

1. Product cards are scan-friendly (name, price, stock, CTA)
2. Category/filter/sort are obvious and easy
3. Cart summary and total are always clear
4. Checkout fields have clear intent and validation
5. Trust indicators are visible near buy/checkout actions

## 3) Conversion validation

Perform this after implementation:
1. Time-to-add-cart feels faster
2. Checkout flow requires fewer retries/errors
3. Mobile layout remains clean without overlap or clipped buttons
4. Primary CTAs are visually dominant and consistently placed

## 4) Regression checks

1. /app marketplace admin still edits products normally
2. /track still returns tracking results
3. Build still passes with npm run build

## 5) Before/after scoring table

Score each 1 (poor) to 5 (excellent).

| Check | Before | After | Delta |
|---|---:|---:|---:|
| Product discoverability |  |  |  |
| CTA clarity |  |  |  |
| Cart usability |  |  |  |
| Checkout clarity |  |  |  |
| Mobile polish |  |  |  |
| Purchase confidence/trust |  |  |  |
