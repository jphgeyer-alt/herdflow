# HerdFlow APK: One-Page Summary

Everything you need in **one page**.

## Build APK in 3 Steps

### 1️⃣ Setup (One-time, 5 min)

```bash
npm run eas:install          # Install EAS
eas login                     # Create account at https://expo.io, then login
npm run generate:assets       # Create app icons
```

### 2️⃣ Build (10 min - mostly waiting)

```bash
npm run eas:build:preview     # For testing
# OR
npm run eas:build:production  # For release
```

### 3️⃣ Download & Install (5 min)

1. Go to https://expo.io/builds
2. Download APK
3. Transfer to phone
4. Install & launch

## What's Inside

✅ Cattle management (add/edit/delete)  
✅ Camp organization  
✅ Vaccine scheduling  
✅ Inventory counting  
✅ Dashboard stats  
✅ Works on Android phones

## File Structure

```
HerdFlow/
├── client/           → Web app (React)
├── server/           → Backend API (Express)
├── expo/             → Mobile app (React Native)
└── Documentation/    → All guides
```

## Development

```bash
npm run dev           # Start everything
npm run dev:server    # Just API server
npm run dev:client    # Just web app
npm run expo:start    # Mobile dev
npm run build         # Production web build
```

## Documentation

| Doc                                              | Purpose           |
| ------------------------------------------------ | ----------------- |
| [README.md](README.md)                           | Project overview  |
| [QUICK_START_APK.md](QUICK_START_APK.md)         | 5-min quick start |
| [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md)         | Full APK guide    |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)         | FAQ & fixes       |
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | All docs map      |

## Commands Cheat Sheet

```bash
# Setup (one-time)
npm run eas:install
npm install -g eas-cli
eas login

# Build APK
npm run eas:build:preview          # Testing
npm run eas:build:production       # Release
npm run eas:status                 # Check builds
npm run generate:assets            # Regenerate icons

# Development
npm run dev                        # Everything
npm run dev:server                 # API only
npm run dev:client                 # Web only
npm run expo:start                 # Mobile dev
npm run expo:android               # Android emulator

# Build for production
npm run build                      # Web
npm run eas:build:production       # APK
```

## Common Issues

| Issue                  | Fix                                  |
| ---------------------- | ------------------------------------ |
| "eas not found"        | `npm run eas:install`                |
| "Not authenticated"    | `eas login`                          |
| App crashes on startup | Start backend: `npm run dev:server`  |
| Can't connect to API   | Check firewall allows port 4174      |
| Won't install on phone | Enable "Unknown sources" in Settings |

## API Connection

- **Android emulator**: `http://10.0.2.2:4174`
- **Physical device**: `http://YOUR_IP:4174` (find IP with `ipconfig`)

## Key Files

| File                 | Changes Here For...           |
| -------------------- | ----------------------------- |
| `expo/app.json`      | App name, version, package ID |
| `expo/App.tsx`       | Mobile UI & features          |
| `server/index.ts`    | API endpoints                 |
| `client/src/App.tsx` | Web UI & features             |

## Quick Facts

- **Tech**: React (web) + React Native (mobile) + Express (backend)
- **Storage**: JSON files (server) + localStorage (client)
- **Offline**: Works offline with cached data
- **Free**: No costs to build APKs with Expo Go

## Next Actions

1. **First-time?** → [QUICK_START_APK.md](QUICK_START_APK.md)
2. **Want details?** → [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md)
3. **Have issues?** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. **Overwhelmed?** → [WHAT_YOU_CAN_DO_NOW.md](WHAT_YOU_CAN_DO_NOW.md)

---

**Ready to build?** `npm run eas:install` then follow [QUICK_START_APK.md](QUICK_START_APK.md) ✨
