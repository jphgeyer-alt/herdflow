# 🚀 HerdFlow APK: Quick Reference

Build and download your HerdFlow APK in 5 minutes.

## 🎯 5-Minute Quick Start

### Step 1: Create Expo Account (2 min)
Visit https://expo.io and create a **free account**

### Step 2: Install EAS CLI (1 min)
```bash
npm run eas:install
# Wait for install to complete
```

### Step 3: Login (1 min)
```bash
eas login
# Enter your Expo email and password
```

### Step 4: Generate Assets (30 sec)
```bash
npm run generate:assets
```

### Step 5: Build APK (30 sec to start, ~10 min to complete)
```bash
# For testing/beta:
npm run eas:build:preview

# For release/production:
npm run eas:build:production
```

## 📥 Download Your APK

1. Go to https://expo.io/builds
2. Find your completed build
3. Click **Download**
4. APK saved to your computer

## 📱 Install on Android Device

1. Transfer APK to phone (USB, email, cloud storage)
2. Open file manager on phone
3. Tap APK file
4. Tap **Install**
5. Done! Launch HerdFlow app

## 🔗 Detailed Guides

| Goal | Reference |
|------|-----------|
| Step-by-step instructions | [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md) |
| Expo configuration | [expo/EXPO_README.md](expo/EXPO_README.md) |
| Setup verification | [SETUP_VERIFICATION.md](SETUP_VERIFICATION.md) |

## 🛠️ Common Commands

```bash
# Build commands
npm run eas:build:preview        # Build for testing
npm run eas:build:production     # Build for release

# Check status
npm run eas:status              # View recent builds

# Development
npm run expo:start              # Start dev server
npm run expo:android            # Run on Android emulator

# Assets
npm run generate:assets         # Create app icons
```

## ❓ Troubleshooting

### Build fails after starting
→ Check internet connection, go to https://expo.io/builds to see error

### APK won't install
→ Enable "Unknown sources" in Android Settings → Security

### Can't connect to API
→ Ensure backend running: `npm run dev:server`

## ✨ What's Included

Your downloaded APK includes:
- ✅ Cattle management (add, edit, delete, view)
- ✅ Camp organization and color coding
- ✅ Vaccine scheduling and tracking
- ✅ Inventory counting (bulls, cows, calves)
- ✅ Dashboard with statistics
- ✅ Full offline support (cached data)

## 📝 Notes

- Free Expo account supports unlimited builds
- APK is for Android phones/tablets
- Backend API needed for full functionality
- App works offline with cached data

## 🆘 Need Help?

- **Building issues**: See [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md#troubleshooting)
- **Expo questions**: See [expo/EXPO_README.md](expo/EXPO_README.md)
- **Expo documentation**: https://docs.expo.dev
- **GitHub Issues**: Report bugs if any

---

That's it! Your APK will be ready to download in ~10 minutes. 🎉
