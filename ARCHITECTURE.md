# HerdFlow Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HERDFLOW APP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  │   WEB CLIENT     │  │   MOBILE CLIENT  │  │   BACKEND API    │
│  │  (React 18)      │  │ (React Native)   │  │  (Express.js)    │
│  │  Port: 4173      │  │   Expo / APK     │  │  Port: 4174      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘
│         ↓                      ↓                       ↓
│    • Vite Build          • React Native          • REST API
│    • TypeScript          • Expo SDK 48           • JSON Storage
│    • Responsive CSS      • Android APK           • TypeScript
│    • Service Worker      • Offline Support       • CORS
│    • localStorage        • Touch Optimized       • Port 4174
│
└─────────────────────────────────────────────────────────────────┘

                              ↑
                    HTTP (REST API)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              SHARED DATA MODELS & STORAGE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Cattle Records │ Camps │ Vaccines │ Count Logs         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         JSON File Store (server/data/)                  │   │
│  │    + localStorage (client offline fallback)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### User on Web

```
Browser (client/src/App.tsx)
    ↓
Make API request
    ↓
Express Server (server/index.ts)
    ↓
Read/Write JSON file (server/data/herdflow.json)
    ↓
Return response
    ↓
Update UI
    ↓
Save to localStorage (offline fallback)
```

### User on Mobile (APK)

```
Android App (expo/App.tsx)
    ↓
Make API request (to 10.0.2.2:4174 or IP:4174)
    ↓
Express Server (server/index.ts)
    ↓
Read/Write JSON file (server/data/herdflow.json)
    ↓
Return response
    ↓
Update React Native UI
    ↓
Cache for offline access
```

## Component Architecture

### Backend (server/)

```
server/
├── index.ts              Main Express server
│   ├── /api/cattle       GET, POST, PUT, DELETE
│   ├── /api/camps        GET, POST, PUT, DELETE
│   ├── /api/vaccines     GET, POST, PUT, DELETE
│   ├── /api/counts       GET, POST, DELETE
│   └── /api/summary      Dashboard stats
├── db.ts                 Data persistence layer
│   ├── loadState()       Read JSON
│   ├── saveState()       Write JSON
│   └── getSeedData()     Initial data
└── types.ts              TypeScript interfaces
```

### Frontend (client/)

```
client/
├── src/
│   ├── App.tsx           Main React component
│   │   ├── Dashboard     Stats & overview
│   │   ├── Cattle        CRUD cattle
│   │   ├── Camps         CRUD camps
│   │   ├── Vaccines      CRUD vaccines
│   │   └── Counts        Add & view counts
│   ├── main.tsx          Entry point
│   └── styles.css        Mobile-responsive CSS
├── index.html            HTML template
└── sw.js                 Service worker (caching)
```

### Mobile (expo/)

```
expo/
├── App.tsx               Main React Native component
│   ├── Dashboard         Stats & overview
│   ├── Cattle
│   │   ├── Add           Modal form
│   │   ├── Edit          Edit existing
│   │   ├── Delete        Remove
│   │   └── List          View all
│   ├── Camps             (same structure)
│   ├── Vaccines          (same structure)
│   └── Counts            (add & view)
├── app.json              Expo config
└── eas.json              Build profiles
```

## Build Pipeline

### For Web

```
Source (client/src/)
    ↓
TypeScript Compilation
    ↓
Vite Build
    ↓
dist/ folder (production)
    ↓
nginx/static server
```

### For APK (Mobile)

```
Source (expo/App.tsx)
    ↓
TypeScript Compilation
    ↓
React Native bundling
    ↓
EAS Build servers (cloud)
    ↓
Android compilation
    ↓
APK generation & signing
    ↓
https://expo.io/builds
    ↓
Download .apk file
    ↓
Android device installation
```

## Technology Stack

```
┌─────────────────────────────────────┐
│      Frontend (Web & Mobile)        │
├─────────────────────────────────────┤
│ React 18                 (web)      │
│ React Native 0.71.8      (mobile)   │
│ TypeScript 5.5.4                    │
│ Expo SDK 48.0.0          (mobile)   │
│ Vite 5.4.1               (web)      │
│ CSS with media queries   (web)      │
└─────────────────────────────────────┘
          ↓          ↓
    HTTP API    (REST)
          ↓          ↓
┌─────────────────────────────────────┐
│         Backend (API Server)        │
├─────────────────────────────────────┤
│ Express.js 4.18.4                   │
│ Node.js 18+                         │
│ TypeScript 5.5.4                    │
│ CORS support                        │
└─────────────────────────────────────┘
          ↓
    JSON File I/O
          ↓
┌─────────────────────────────────────┐
│       Data Storage Layer            │
├─────────────────────────────────────┤
│ JSON files (server-side)            │
│ localStorage (client-side)          │
│ Service Worker cache (offline)      │
└─────────────────────────────────────┘
```

## Deployment & Distribution

### Web

```
npm run build              Build files
    ↓
dist/ folder
    ↓
Deploy to:
  - Vercel
  - Netlify
  - GitHub Pages
  - Any static host
```

### Mobile (APK)

```
npm run eas:build:preview/production
    ↓
EAS Build service (cloud)
    ↓
https://expo.io/builds
    ↓
Download APK
    ↓
Send to users
    ↓
Install on Android
```

## Features Matrix

| Feature            | Web | Mobile | Backend |
| ------------------ | --- | ------ | ------- |
| Cattle CRUD        | ✅  | ✅     | ✅      |
| Camp Management    | ✅  | ✅     | ✅      |
| Vaccine Scheduling | ✅  | ✅     | ✅      |
| Count Logging      | ✅  | ✅     | ✅      |
| Dashboard          | ✅  | ✅     | -       |
| Offline Support    | ✅  | ✅     | -       |
| Color Coding       | ✅  | ✅     | ✅      |
| Status Tracking    | ✅  | ✅     | ✅      |
| Real-time Sync     | ✅  | ✅     | -       |

## API Endpoints

```
GET    /api/cattle          → All cattle
GET    /api/cattle/:id      → Single cattle
POST   /api/cattle          → Create cattle
PUT    /api/cattle/:id      → Update cattle
DELETE /api/cattle/:id      → Delete cattle

GET    /api/camps           → All camps
POST   /api/camps           → Create camp
(same pattern for DELETE, PUT, etc.)

GET    /api/vaccines        → All vaccines
POST   /api/vaccines        → Create vaccine
(same pattern)

GET    /api/counts          → All counts
POST   /api/counts          → Add count
(same pattern)

GET    /api/summary         → Dashboard stats
```

## Ports & URLs

| Service        | Port  | URL                   |
| -------------- | ----- | --------------------- |
| Frontend (Web) | 4173  | http://localhost:4173 |
| Backend (API)  | 4174  | http://localhost:4174 |
| Expo Dev       | 19000 | (automatic)           |
| Expo Web       | 19006 | (automatic)           |

## Build Tools & Commands

```
npm run dev               Start everything locally
npm run build            Build web for production
npm run preview          Preview production build

npm run eas:install      Install EAS CLI
npm run eas:build:preview   Build APK (testing)
npm run eas:build:production Build APK (release)
npm run eas:status       Check builds

npm run expo:start       Start Expo dev
npm run expo:android     Run on Android
```

## Data Model

```
Cattle
├── id
├── tagId (unique identifier)
├── breed
├── colorId (0-6)
├── gender (Female/Male/Other)
├── dateOfBirth
├── weight
├── status (Active/Sold/Quarantined/Veterinary)
├── campId (assigned camp)
├── createdAt
└── updatedAt

Camp
├── id
├── name
├── colorId (0-6)
├── description
├── createdAt
└── updatedAt

VaccineRecord
├── id
├── cattleId
├── vaccineType
├── dateAdministered
├── dueDate
├── notes
├── createdAt
└── updatedAt

CountLog
├── id
├── campId
├── countDate
├── bulls
├── cows
├── calves
├── notes
├── createdAt
└── updatedAt
```

---

**Architecture Status**: ✅ Production-Ready  
**All components**: ✅ Integrated & Tested  
**Ready for**: ✅ Building APK & Deployment
