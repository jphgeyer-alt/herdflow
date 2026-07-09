# HerdFlow Admin Quick Actions

Use this as the fast daily runbook for admin operations.

## Start in 60 seconds

1. Start website backend: npm run dev:server:website
2. Start app backend: npm run dev:server:app
3. Start website admin UI: npm run dev:client
4. Open admin page: http://localhost:4173/app
5. Verify website backend health: http://localhost:4174/health
6. Verify app backend health: http://localhost:4175/health

Expected health response:

- {"status":"ok"}

## Top 10 daily actions

1. Check server is alive

- Open: /health
- If not ok, restart backend and check terminal errors.

2. Review new orders

- Open /app, go to Marketplace Admin section.
- Confirm new orders and move status from Pending to Confirmed.

3. Mark delivered orders

- For completed deliveries, set status to Fulfilled.
- Use Cancelled for failed/unserviceable orders.

4. Check low stock items

- In Marketplace Admin, review stock badges.
- Increase stock on low/out-of-stock items to keep checkout active.

5. Add or edit catalog items

- Required fields: name, price, unit, description.
- Optional: image URL or upload image.

6. Review partner registrations

- Open Submitted Registrations panel.
- Set each to Approved, Rejected, or Pending.

7. Check herd operations data

- Verify cattle, camp, vaccine, and count logs are updating.
- Fix missing or stale records from their respective tabs.

8. Export backup

- In Data Backup panel, click Export Backup.
- Save file with date in your secure backup folder.

9. Validate customer lead flow

- Submit a test signup from homepage if needed.
- Confirm it appears under Recent website signups.

10. Verify storefront and tracking links

- Storefront route: /marketplace
- Order tracking route: /track
- Confirm both open and return expected data.

## Exact admin API actions (PowerShell)

Get orders:
Invoke-RestMethod -Method Get -Uri "http://localhost:4174/api/orders"

Update order to Fulfilled:
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

## Fast troubleshooting

Backend down:

1. Restart website API: npm run dev:server:website
2. Restart app API: npm run dev:server:app
3. Re-check: http://localhost:4174/health

Admin page loads but no data:

1. Confirm backend is running on 4174.
2. Confirm frontend is running on 4173.
3. Check browser console/network for failing /api calls.

Orders fail with stock error:

1. Open Marketplace Admin.
2. Increase item stock.
3. Retry checkout.

## Important file references

- API routes: server/index.ts
- Data logic: server/db.ts
- Data store: server/data/herdflow.json
- Website admin UI: client/src/App.tsx
- Mobile admin API client: expo/App.tsx
- Full admin guide: ADMIN_BACKEND_GUIDE.md
