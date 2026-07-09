# HerdFlow Phase 1 Baseline Checklist

Use this before running Kilo/Cline implementation so improvements are measurable.

Quick command (automated):

1. npm run phase1:audit
2. Review generated report: PHASE1_AUTOMATED_REPORT.md
3. Sync report values into this checklist: npm run phase1:sync
4. Run all-in-one: npm run phase1:audit:sync

## 1) Build baseline

1. Run: npm run build
2. Record output artifact sizes from dist:

- JS main bundle size
- CSS bundle size

## 2) Runtime baseline (website)

Start local stack:

1. npm run dev:server:website
2. npm run dev:client

Record:

- /marketplace first load feel on mobile viewport
- Any image load failures in product cards
- Any layout jumping while images load

## 3) Lighthouse baseline

Run Lighthouse on:

1. /
2. /marketplace
3. /app

Capture:

- Performance score
- LCP
- CLS
- TBT

## 4) Functional baseline checks

Confirm all still work before optimization:

1. Add product to cart on /marketplace
2. Submit checkout
3. Track order on /track
4. Open /app marketplace admin and verify catalog images

## 5) Success targets for Phase 1

1. Improve mobile performance score on /marketplace
2. Reduce bundle size where practical
3. Keep CLS stable/low in product sections
4. Zero broken product image rendering in key catalog views

## 6) Post-implementation compare table

Fill this after Cline implementation.

| Metric                                |                               Before |                                    After |          Delta |
| ------------------------------------- | -----------------------------------: | ---------------------------------------: | -------------: |
| Lighthouse Performance (/marketplace) |                         Not captured | Blocked (see PHASE1_AUTOMATED_REPORT.md) |            N/A |
| LCP (/marketplace)                    |                         Not captured | Blocked (see PHASE1_AUTOMATED_REPORT.md) |            N/A |
| CLS (/marketplace)                    |                         Not captured | Blocked (see PHASE1_AUTOMATED_REPORT.md) |            N/A |
| TBT (/marketplace)                    |                         Not captured | Blocked (see PHASE1_AUTOMATED_REPORT.md) |            N/A |
| Main JS bundle size                   | 209.80 kB (single bundle, pre-split) |                                204.85 kB | -4.95 kB total |
| Main CSS bundle size                  |                             15.82 kB |                                 15.52 kB |       -0.30 kB |

## 7) Current run notes (2026-06-28)

1. Production build succeeded with split chunks:

- dist/assets/index-C6AhZkme.js 69.31 kB (gzip 14.99 kB)
- dist/assets/vendor-CeSq11q2.js 139.88 kB (gzip 45.35 kB)
- dist/assets/rolldown-runtime-jpDsebLB.js 0.56 kB (gzip 0.36 kB)
- dist/assets/index-Am_jh7vh.css 15.89 kB (gzip 3.82 kB)

2. Lighthouse CLI install succeeded, but audit could not run due to missing Chrome binary in the environment.
3. To complete Lighthouse metrics, run the same command on a machine with Chrome installed:

- npx lighthouse http://127.0.0.1:4173/marketplace --only-categories=performance --chrome-flags="--headless --no-sandbox" --output=json --output-path=phase1-lh-marketplace.json
