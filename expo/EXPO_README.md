# HerdFlow - Expo Mobile App Setup Guide

This is the Expo/React Native implementation of HerdFlow that builds to Android APK, iOS IPA, and web apps.

## Project Structure

```
expo/
  ├── app.json              # Expo config with build settings
  ├── eas.json             # EAS Build profiles (preview/production)
  ├── babel.config.js      # Babel configuration
  ├── tsconfig.json        # TypeScript configuration
  ├── package.json         # Dependencies and scripts
  ├── generate-assets.js   # Script to generate app icons/splash
  ├── App.tsx              # Main React Native app with all features
  ├── assets/              # App icons, splash screen, adaptive icon
  └── node_modules/        # Dependencies
```

## Development Setup

### 1. Install Dependencies

From the root `HerdFlow` folder:

```bash
npm run expo:install
# OR from within expo/ folder:
# npm install
```

### 2. Generate App Assets

Generate placeholder icons and splash screens:

```bash
npm run generate:assets
```

This creates:
- `assets/icon.svg` - App icon (1024x1024)
- `assets/splash.svg` - Splash screen
- `assets/adaptive-icon.svg` - Android adaptive icon
- `assets/favicon.svg` - Web favicon

Replace these with your custom images for production.

### 3. Start Development Server

#### Using Expo CLI (Recommended)
```bash
npm run expo:start
# OR: npm start
```

This starts the Expo development server. You'll see a QR code.

To run on:
- **Android Emulator**: Press `a`
- **Physical Android Device**: Scan QR code with Expo Go app
- **Web Browser**: Press `w`
- **iOS Simulator** (macOS only): Press `i`

#### Direct Android Development
```bash
npm run expo:android
# OR: npm run android
```

Requires:
- Android Studio & Android SDK
- Emulator set up
- Environment variables configured

## Configuration

### app.json - Main Configuration

Key settings:
```json
{
  "name": "HerdFlow",           // App name shown to users
  "slug": "herdflow",            // URL slug for Expo
  "version": "1.0.0",            // App version
  "sdkVersion": "48.0.0",        // Expo SDK version
  "platforms": ["android", "ios", "web"],
  "android": {
    "package": "com.herdflow.mobile",    // Unique Android package ID
    "versionCode": 1,                      // Must increment for new releases
    "permissions": ["INTERNET"]            // Android permissions
  }
}
```

### eas.json - Build Configuration

Three build profiles:

- **preview**: Testing build, development-like, installs directly on device
- **production**: Optimized build, ready for Play Store
- **development**: Development client with live reloading

## Building the APK

### Prerequisites

1. **Expo Account**: Create free account at [expo.io](https://expo.io)
2. **EAS CLI**: 
   ```bash
   npm run eas:install
   # OR: npm install -g eas-cli
   ```
3. **Authentication**:
   ```bash
   eas login
   # Enter your Expo credentials
   ```

### Build Commands

#### Option A: Preview Build (Recommended for Testing)
```bash
npm run eas:build:preview
```

Results in:
- APK optimized for testing
- Direct installation on Android device
- Faster build time (5-10 min)
- Perfect for QA and beta testing

#### Option B: Production Build
```bash
npm run eas:build:production
```

Results in:
- Fully optimized & minified APK
- Ready for Google Play Store
- Slower build time (10-15 min)
- Better performance on end-user devices

### Monitor Build Status

Check build progress:
```bash
npm run eas:status
# OR: eas build:list --limit 10
```

View online: [https://expo.io/builds](https://expo.io/builds)

## Downloading the APK

### Option 1: Expo Dashboard (Recommended)
1. Visit [https://expo.io/builds](https://expo.io/builds)
2. Find your completed build
3. Click the download button
4. APK downloads to your computer

### Option 2: Direct Link from Terminal
After build completes, terminal shows download URL. Copy and paste into browser.

### Option 3: Expose Go App
1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) on Android
2. Scan QR code shown after build
3. Build runs inside Expo Go (no installation needed, good for testing)

## Installing APK on Device

### From Computer
1. Connect Android phone via USB
2. Enable "Unknown sources" in Settings → Security
3. Transfer APK to phone via:
   - USB file transfer
   - Cloud storage (Drive, OneDrive, etc.)
   - Email / messaging app
4. Open file manager on phone
5. Tap APK file
6. Tap "Install"
7. Tap "Open" to launch

### Using Android Debug Bridge (ADB)
```bash
# Ensure ADB is in your PATH or use full path
adb install expo-app-release.apk

# If you have multiple devices:
adb devices  # List all attached devices
adb -s <device_id> install expo-app-release.apk
```

### Using Expo CLI (Android Physical Device)
```bash
npm run android
# OR if in expo folder: npm run android
```

## API Connection

The React Native app connects to the backend API running on your development machine.

### Local Development
- **On Emulator**: Use `10.0.2.2:4174` (special alias for host localhost)
- **On Physical Device**: Use your computer's IP address, e.g., `192.168.1.100:4174`

To find your IP:
```bash
# Windows
ipconfig
# Look for IPv4 Address under your network adapter

# macOS/Linux
ifconfig
# Look for inet address
```

### Update API URL
Edit `expo/App.tsx` if needed. The app uses:
```typescript
const API_BASE_URL = process.env.API_URL || 'http://10.0.2.2:4174';
```

## Troubleshooting

### Build Fails
- ✅ Verify you're logged in: `eas whoami`
- ✅ Check app.json syntax with `jsonlint expo/app.json`
- ✅ Ensure all required fields in app.json
- ✅ Check EAS docs for platform-specific requirements

### APK Won't Install
- ✅ Enable "Unknown Sources" in Android Settings
- ✅ Check device has enough storage space (50+ MB free)
- ✅ Verify APK matches target Android version
- ✅ Try adb: `adb uninstall com.herdflow.mobile` then reinstall

### App Won't Connect to API
- ✅ Backend server running: `npm run dev:server`
- ✅ Check firewall allows port 4174
- ✅ Verify API URL is correct (use `10.0.2.2` on emulator)
- ✅ On physical device, use computer IP not localhost

### Expo Go App Not Loading
- ✅ Restart Expo development server
- ✅ Update Expo Go from Play Store
- ✅ Ensure phone and computer on same WiFi
- ✅ Rebuild with `npm run generate:assets` first

## First-Time Production Build

1. **Prepare Assets**
   ```bash
   npm run generate:assets
   # Then replace with custom images for branding
   ```

2. **Verify Configuration**
   ```bash
   # Check app.json and eas.json
   # Ensure package name is unique
   ```

3. **Build Preview First**
   ```bash
   npm run eas:build:preview
   ```

4. **Test on Device**
   - Download and install preview APK
   - Test all features thoroughly
   - Verify API connectivity

5. **Build Production**
   ```bash
   npm run eas:build:production
   ```

6. **Ready for Distribution**
   - Download production APK
   - Share directly with users
   - Or upload to Google Play Store

## Advanced

### Environment Variables
Create `.env` (or `.env.production`) in `expo/` folder:
```
EXPO_PUBLIC_SITE_URL=https://your-website-domain.com
EXPO_PUBLIC_MARKETPLACE_URL=https://your-website-domain.com/marketplace
```

Notes:
- `EXPO_PUBLIC_MARKETPLACE_URL` takes highest priority for the marketplace button in the mobile app.
- If `EXPO_PUBLIC_MARKETPLACE_URL` is not set, the app uses `EXPO_PUBLIC_SITE_URL + /marketplace`.
- If neither is set, it falls back to the default production domain.

Reference in `expo/app.json`:
```json
{
  "extra": {
    "apiUrl": "$API_URL"
  }
}
```

### Code Signing (For Play Store)
[See Play Store Publishing Guide](https://docs.expo.dev/build-reference/android-builds/#google-play-store-credentials)

### EAS Updates (Push Updates Without Rebuilding)
Enable instant app updates:
```json
{
  "updates": {
    "enabled": true,
    "url": "https://u.expo.dev/<your-project-id>"
  }
}
```

Then deploy updates:
```bash
eas update --platform android
```

## Resources

- 📚 **Expo Docs**: https://docs.expo.dev/
- 🏗️ **EAS Build**: https://docs.expo.dev/build/introduction/
- 📱 **React Native**: https://reactnative.dev/
- 🤖 **Android Development**: https://developer.android.com/
- 🦺 **EAS CLI Reference**: https://docs.expo.dev/build-reference/eas-json/

## Quick Commands Reference

| Goal | Command |
|------|---------|
| Start dev | `npm run expo:start` |
| Run on Android | `npm run expo:android` |
| Generate assets | `npm run generate:assets` |
| Build preview APK | `npm run eas:build:preview` |
| Build production APK | `npm run eas:build:production` |
| Check build status | `npm run eas:status` |
| Login to Expo | `eas login` |
| Check login status | `eas whoami` |

---

**Next Steps**: See [APK_BUILD_GUIDE.md](../APK_BUILD_GUIDE.md) for step-by-step APK building and downloading instructions.
