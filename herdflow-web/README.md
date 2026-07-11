# HerdFlow Web

Standalone website project for HerdFlow with two business domains:

- Ecommerce storefront
- Live auction marketplace

This project intentionally excludes cattle management and farm operations app modules.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- PayFast (South African gateway) integration placeholders

## Domain Separation Rule

Store inventory and auction inventory are fully separate by design:

- Store domain models: `StoreProduct`, `StoreInventory`, `StoreOrder`, `StoreOrderItem`
- Auction domain models: `Auction`, `AuctionLot`, `AuctionBid`

No shared stock pool exists between these domains.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment template and update values:

```bash
cp .env.example .env
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run local dev server:

```bash
npm run dev
```

## Important Paths

- `src/app/(store)` - customer storefront routes
- `src/app/(auction)` - auction routes
- `src/app/(admin)` - website admin routes
- `src/app/api/store` - store API handlers
- `src/app/api/auction` - auction API handlers
- `src/app/api/payfast` - PayFast integration handlers
- `prisma/schema.prisma` - database schema

## Deployment

Deployed on Render (`render.yaml` at the repo root, `rootDir: herdflow-web`), with managed PostgreSQL on Render. Auto-deploys on push to `main`.

## Cron Jobs

Vendor payout fund-release runs on a schedule via a Render Cron Job (configured in the Render dashboard, not in `render.yaml`):

- **Command**: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.herdflow.co.za/api/cron/release-funds`
- **Schedule**: daily (e.g. `0 2 * * *`)
- **Env**: requires `CRON_SECRET` to match the value set on the web service.

This marks `OrderItem`s eligible for payout (order DELIVERED/COMPLETED, or PAID for 7+ days) and credits the seller's `balance`. Admins then use **Payouts → Create Payout Batch** to turn accumulated balances into an EFT batch (CSV) and mark them paid once processed.

A second Render Cron Job sends day-ahead reminder emails:

- **Command**: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://www.herdflow.co.za/api/cron/reminders`
- **Schedule**: daily (e.g. `0 8 * * *`)
- **Env**: requires `CRON_SECRET` to match the value set on the web service.

This emails sellers whose listing expires in 3 days, and subscribers whose 30-day trial ends in 7 days (day 23). See `src/lib/reminders.ts`.
