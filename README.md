# HerdFlow

Professional cattle record keeping application with offline support. Track cattle profiles, health records, vaccine schedules, camp management, and inventory counts.

## Features

- **Cattle Records**: Track individual animals with breed, color ID, gender, birth date, weight, status, and camp assignment
- **Camp Management**: Organize cattle into different camps/pastures with color coding
- **Vaccine Schedules**: Schedule and track vaccine administration with due dates
- **Inventory Counts**: Record periodic counts of bulls, cows, and calves per camp
- **Offline Support**: Works without internet connection, syncs when online
- **Mobile Friendly**: Responsive design for farm use on tablets and phones

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone or download the project
cd HerdFlow

# Install dependencies
npm install

# Start development server
npm run dev
```

### Stable Local Startup Order

Use these commands to avoid stale port/process conflicts during daily development:

```bash
# 1) Stop stale node listeners on dev ports
npm run dev:preflight

# 2) Start web + both backends together
npm run dev
```

Or use one-shot startup commands:

```bash
npm run dev:clean-start   # preflight + npm run dev
npm run expo:clean-start  # preflight + Expo Metro
```

The app will be available at:
- Frontend: http://localhost:4173
- Backend API: http://localhost:4174

### Production Build

```bash
# Build for production
npm run build

# Serve the built app
npm run preview
```

## Usage

### Dashboard
- View summary statistics and recent activity
- See upcoming vaccine schedules
- Check latest camp counts

### Cattle Management
- Add new cattle with tag ID, breed, color, gender, birth date, weight
- Assign cattle to camps
- Update status (Active, Sold, Quarantined, Veterinary)
- Edit or delete records

### Camp Management
- Create camps with names, colors, and descriptions
- Assign cattle to camps for organization
- Track inventory by camp

### Vaccine Records
- Schedule vaccines for individual cattle
- Mark vaccines as completed with dates
- Track upcoming and overdue vaccinations

### Count Logs
- Record periodic inventory counts per camp
- Track bulls, cows, and calves separately
- Add notes for each count

## Offline Usage

The app works offline using browser localStorage:
- All data is saved locally when offline
- Changes sync to server when connection is restored
- Service worker caches app assets for offline access

## Data Storage

- Server: JSON file storage (`server/data/herdflow.json`)
- Client: localStorage fallback for offline mode

## API Endpoints

- `GET/POST/PUT/DELETE /api/cattle` - Cattle records
- `GET/POST/PUT/DELETE /api/camps` - Camp management
- `GET/POST/PUT/DELETE /api/vaccines` - Vaccine schedules
- `GET/POST/DELETE /api/counts` - Count logs
- `GET /api/summary` - Dashboard statistics

## Development

### Project Structure

```
HerdFlow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main application
│   │   ├── main.tsx       # App entry point
│   │   └── styles.css     # Styling
│   ├── index.html         # HTML template
│   └── sw.js              # Service worker
├── expo/                   # Expo wrapper for mobile APK packaging
│   ├── App.tsx             # Expo mobile wrapper app
│   ├── app.json            # Expo config
│   ├── babel.config.js     # Babel config for Expo
│   ├── package.json        # Expo dependencies and scripts
│   └── tsconfig.json       # TypeScript config for Expo
├── server/                 # Express backend
│   ├── index.ts           # API server
│   ├── db.ts              # Data persistence
│   └── types.ts           # TypeScript types
└── package.json           # Dependencies and scripts
```

### Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Styling**: CSS with modern responsive design
- **Storage**: JSON file (server) + localStorage (client)

### Development Run Order

1. Web + split backends: run `npm run dev:clean-start`
2. Expo mobile: run `npm run expo:clean-start` in a separate terminal
3. Optional single services:
	- `npm run dev:client`
	- `npm run dev:server:website`
	- `npm run dev:server:app`

### Kilo Code + Cline Delivery Workflow

Use [KILO_CLINE_EXECUTION_PLAYBOOK.md](KILO_CLINE_EXECUTION_PLAYBOOK.md) to run Kilo Code and Cline in coordinated phases with validation gates and handoff discipline.
Set up Anthropic Claude provider first using [KILO_ANTHROPIC_SETUP.md](KILO_ANTHROPIC_SETUP.md).

## Expo Mobile Packaging

A native Expo app is included in the `expo/` folder. It uses React Native components to display the HerdFlow experience and talks to the backend API directly.

### Expo Setup

```bash
cd HerdFlow
npm run expo:install
npm run expo:start
```

### Run on Android

```bash
npm run expo:android
```

### Run on Web

```bash
npm run expo:web
```

> Note: The Expo mobile app uses the backend API on port `4174`.
> Start the server with `npm run dev` or run the backend separately before launching the mobile app.

## Building & Downloading APK

You can build a native Android APK using Expo Application Services (EAS) and download it to install on any Android device.

### Quick Steps

1. **Install EAS CLI**: `npm run eas:install`
2. **Login to Expo**: `eas login` (create free account at https://expo.io)
3. **Generate Assets**: `npm run generate:assets`
4. **Build APK**: `npm run eas:build:preview` (testing) or `npm run eas:build:production` (release)
5. **Download**: Visit https://expo.io/builds when build completes

### Detailed Guide

👉 **[See APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md)** for complete step-by-step instructions including:
- Prerequisites and setup
- Build options (preview vs production)
- Downloading and installing on Android devices
- Troubleshooting common issues

## Publishing To Play Store

Use [PLAYSTORE_RELEASE_GUIDE.md](PLAYSTORE_RELEASE_GUIDE.md) for the full production release process, including AAB build, Play Console submission, and staged rollout checks.

### Expo Setup Guide

👉 **[See expo/EXPO_README.md](expo/EXPO_README.md)** for detailed Expo configuration including:
- Development workflow
- Configuration options
- Building from scratch
- Advanced features (EAS Updates, code signing, etc.)

## Deploy To Render (GitHub)

This repository is configured for Render using `render.yaml`.

### 1. Push Project To GitHub

```bash
git init
git add .
git commit -m "Prepare HerdFlow for Render"
git branch -M main
git remote add origin https://github.com/<your-username>/herdflow.git
git push -u origin main
```

### 2. Create Render Web Service

1. Sign in to Render.
2. Click **New** -> **Blueprint**.
3. Connect your GitHub account and select this repository.
4. Render will detect `render.yaml` and create the `herdflow` web service.

### 3. Verify Build Settings

Render should use these values from `render.yaml`:

- Build command: `npm install --legacy-peer-deps && npm run build`
- Start command: `npm start`
- Health check path: `/health`

### 4. Environment Variables

Configured in `render.yaml`:

- `NODE_ENV=production`
- `STATIC_DIR=dist`

Optional database values (only if using PostgreSQL):

- `DATABASE_URL`
- `DATABASE_SSL=true`

### 5. First Deploy Check

After deploy completes, verify:

- `https://<your-render-url>/health` returns `{ "status": "ok" }`
- `https://<your-render-url>/` loads the web app
- `https://<your-render-url>/api/summary` returns JSON summary data

### Notes

- The server uses `PORT` provided by Render automatically.
- Frontend build output is served from `dist`.
- Every push to `main` triggers automatic deploys.

### Custom Domain On Render

1. Open your Render service dashboard.
2. Go to **Settings** -> **Custom Domains**.
3. Click **Add Custom Domain** and enter your domain (for example `app.yourdomain.com`).
4. Render will show the DNS record to create at your domain registrar.

Typical DNS options:

- Subdomain (`app.yourdomain.com`): create a **CNAME** to your `onrender.com` service hostname.
- Apex/root (`yourdomain.com`): use **ALIAS/ANAME** if your DNS provider supports it, or use provider-specific flattening.

5. Wait for DNS propagation.
6. Back in Render, verify the domain status becomes **Verified** and **TLS Active**.

After verification, HerdFlow will be available at your custom domain and HTTPS will be managed by Render.

## License

This project is open source and available under the MIT License.
