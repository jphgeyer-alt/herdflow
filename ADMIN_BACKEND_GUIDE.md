# HerdFlow Admin Backend Guide

This guide explains how to run and use split admin backends for the website and mobile app.

## Backend split model

HerdFlow now supports two independent backend processes with separate data stores:

- Website backend (admin and website changes): port 4174, data file server/data/herdflow-website.json
- App backend (mobile app changes): port 4175, data file server/data/herdflow-app.json

Shared route code is still in server/index.ts, but each process boots with different runtime config:

- server/index-website.ts
- server/index-app.ts

## 1) Backend location and ownership

HerdFlow uses one shared backend for both clients:

- Website frontend uses relative API routes from /api
- Mobile app calls the same backend through API_BASE in expo/App.tsx
- API server and routes: server/index.ts
- Data storage and business logic: server/db.ts
- Shared types: server/types.ts
- JSON data file (default storage): server/data/herdflow.json

## 2) Start the backends (local admin mode)

### Environment setup (recommended)

1. Copy root env template:
  - Copy .env.example to .env
2. Copy Expo env template:
  - Copy expo/.env.example to expo/.env
3. Edit values in those files for local or production targets.

Key root variables:
- WEBSITE_API_PORT
- WEBSITE_DATA_FILE
- APP_API_PORT
- APP_DATA_FILE

Key Expo variables:
- EXPO_PUBLIC_API_BASE
- EXPO_PUBLIC_SITE_URL
- EXPO_PUBLIC_MARKETPLACE_URL

From project root:

1. npm install
2. npm run dev:server:website
3. npm run dev:server:app

Default local website backend URL:
- http://localhost:4174

Default local app backend URL:
- http://localhost:4175

Health check:
- http://localhost:4174/health

You should get:
- {"status":"ok"}

## 3) Admin surfaces (what you manage where)

Website admin UI:
- Open http://localhost:4173/app
- Use tabs for Herd, Camps, Health, Reports, Marketplace Admin

Main admin capabilities:
- Cattle CRUD
- Camp CRUD
- Vaccine CRUD
- Count log create/delete
- Marketplace item CRUD and stock control
- Marketplace partner registration review (Pending, Approved, Rejected)
- Order status updates (Pending, Confirmed, Fulfilled, Cancelled)
- Backup export and import

Mobile app admin usage:
- Expo app writes to the app backend endpoint configured by EXPO_PUBLIC_API_BASE.
- Default behavior points to the configured production API base if EXPO_PUBLIC_API_BASE is not set.
- Marketplace storefront button opens the ecommerce frontend URL (configured via EXPO_PUBLIC_MARKETPLACE_URL or EXPO_PUBLIC_SITE_URL).

## 4) Endpoint map by admin function

Core operations:
- GET /api/cattle
- POST /api/cattle
- PUT /api/cattle/:id
- DELETE /api/cattle/:id

Camp management:
- GET /api/camps
- POST /api/camps
- PUT /api/camps/:id
- DELETE /api/camps/:id

Health and treatment:
- GET /api/vaccines
- POST /api/vaccines
- PUT /api/vaccines/:id
- DELETE /api/vaccines/:id

Counts and reporting:
- GET /api/counts
- POST /api/counts
- DELETE /api/counts/:id
- GET /api/summary

Marketplace catalog:
- GET /api/marketplace/items
- POST /api/marketplace/items
- PUT /api/marketplace/items/:id
- DELETE /api/marketplace/items/:id

Partner onboarding:
- GET /api/marketplace/registrations
- POST /api/marketplace/registrations
- PUT /api/marketplace/registrations/:id/status
- DELETE /api/marketplace/registrations/:id

Leads and customers:
- GET /api/customer-signups
- POST /api/customer-signups

Orders and payments:
- GET /api/orders
- POST /api/orders
- PUT /api/orders/:id/status
- GET /api/orders/track?orderNumber=...&email=...
- POST /api/payments/checkout

Backup administration:
- GET /api/backup/export
- POST /api/backup/import

## 5) Daily admin workflow

Morning checks:
1. Confirm backend health at /health.
2. Open /app and verify latest counts, vaccines, and orders loaded.
3. Review marketplace partner registrations and set statuses.

Catalog management:
1. Open Marketplace Admin.
2. Add or edit items (name, price, unit, description, stock, image).
3. Keep stock accurate so checkout validation prevents overselling.

Order operations:
1. Open Incoming Orders.
2. Confirm new orders.
3. Move to Fulfilled when delivered.
4. Use Cancelled for unserviceable orders.

Backup discipline:
1. Export backup daily from admin UI (Data Backup panel).
2. Keep date-stamped backup files.
3. Use import only for controlled restore.

## 6) Admin API testing from PowerShell

List orders:
Invoke-RestMethod -Method Get -Uri "http://localhost:4174/api/orders"

Update order status:
$body = @{ status = "Fulfilled" } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "http://localhost:4174/api/orders/123/status" -ContentType "application/json" -Body $body

Create marketplace item:
$body = @{
  name = "Hay Bale"
  price = "$12"
  unit = "per bale"
  description = "Dry season reserve"
  stock = 20
  imageUrl = ""
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:4174/api/marketplace/items" -ContentType "application/json" -Body $body

## 7) Production admin notes

- In production, backend is served by server/index.ts and may also serve built frontend static files from dist.
- Keep API and frontend domain/CORS setup aligned.
- For mobile APK builds, set EAS environment values:
  - EXPO_PUBLIC_API_BASE (mobile app backend)
  - EXPO_PUBLIC_MARKETPLACE_URL (preferred)
  - or EXPO_PUBLIC_SITE_URL

## 8) Source references

- server/index.ts
- server/db.ts
- server/types.ts
- client/src/App.tsx
- expo/App.tsx
