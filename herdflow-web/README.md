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
