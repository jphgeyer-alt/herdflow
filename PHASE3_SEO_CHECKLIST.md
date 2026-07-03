# HerdFlow Phase 3 SEO Checklist

Use this before and after Phase 3 implementation.

## 1) Baseline checks

Start local stack:
1. npm run dev:server:website
2. npm run dev:client

Baseline pages:
1. /
2. /marketplace
3. /track
4. /app

Record for each page:
- Title tag quality
- Meta description quality
- Canonical consistency
- Open Graph/Twitter preview fields

## 2) Technical SEO targets

1. Every major route has clear, unique title/description intent
2. Canonical strategy is consistent
3. Social preview metadata is complete and brand-safe
4. Structured data exists for organization and commerce context where applicable
5. No accidental noindex behavior in production intent

## 3) Validation checks

After implementation:
1. Lighthouse SEO run for / and /marketplace
2. Manual check of generated head metadata
3. Structured data validator check for key pages
4. Social preview test for shared URLs

## 4) Regression checks

1. /marketplace storefront still functions
2. /app admin flows unchanged
3. /track lookup still works
4. Build passes: npm run build

## 5) Before/after scoring table

Score each 1 (poor) to 5 (excellent).

| Check | Before | After | Delta |
|---|---:|---:|---:|
| Title/meta quality |  |  |  |
| Canonical consistency |  |  |  |
| Structured data readiness |  |  |  |
| Social preview quality |  |  |  |
| Lighthouse SEO score |  |  |  |
