# HerdFlow APK Build & Download Guide

This guide shows you how to build and download the HerdFlow APK using Expo Application Services (EAS Build).

## Prerequisites

1. **Node.js & npm** - Already installed
2. **Expo Account** - Create free account at [expo.io](https://expo.io)
3. **EAS CLI** - Will be installed via npm

## Step 1: Install EAS CLI

Install the Expo Application Services CLI globally:

```bash
npm run eas:install
# OR manually: npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

## Step 2: Login to Expo

Authenticate with your Expo account:

```bash
npm run eas:login
# OR manually: eas login
```

You'll be prompted to enter your Expo credentials. Create a free account at [expo.io](https://expo.io) if you don't have one.

## Step 3: Build the APK

### Option A: Preview Build (Recommended for Testing)
Testing build with development-like environment:

```bash
npm run eas:build:preview
```

This creates an APK that:
- Installs directly on Android device
- Perfect for testing and debugging
- Completes faster (5-10 minutes)

### Option B: Production Build
Production-optimized APK:

```bash
npm run eas:build:production
```

This creates an APK that:
- Optimized and minified
- Ready to publish to Play Store
- Completes in 10-15 minutes

## Step 4: Download Your APK

Once the build completes, you have two options:

### Option A: Direct Download from Expo Dashboard
1. Visit [https://expo.io/builds](https://expo.io/builds)
2. Find your completed build
3. Click the download button
4. APK will download to your computer

### Option B: Scan QR Code
1. After build completes, a QR code is displayed
2. Scan with your Android phone
3. Opens Expo Go app
4. Tap "Install" to test the app

### Option C: Using Expo Go App
1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from Play Store
2. Open the app
3. Scan the QR code from build output
4. App loads and runs inside Expo Go

## Step 5: Install APK on Android Device

### From Computer:
1. Download APK from Expo dashboard
2. Transfer to your Android phone via USB or cloud
3. Open file manager on phone
4. Tap the APK file
5. Tap "Install"
6. Accept permissions
7. Launch HerdFlow app

### Using ADB (Android Debug Bridge):
```bash
adb install herdflow-*.apk
```

## Troubleshooting

### Build Fails
- Check you're logged in: `eas whoami`
- Verify Android config in `expo/app.json`
- Check iOS/Android requirements in app.json

### APK Won't Install
- Enable "Unknown Sources" in Android settings
- Ensure device has enough storage
- Try the preview build instead

### API Connection Issues
- Ensure backend server is running: `npm run dev:server`
- Update API URL in `expo/App.tsx` if needed
- On Android emulator, use `10.0.2.2:4174` instead of `localhost:4174`
- On physical device, use your computer's IP address (e.g., `192.168.x.x:4174`)

## Build Status & Monitoring

Check build progress in real-time:

```bash
eas build --status
```

View build history:

```bash
eas build:list
```

## Additional Resources

- **Expo Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS CLI Docs**: https://docs.expo.dev/build-reference/eas-json/
- **Android requirements**: https://docs.expo.dev/build-reference/android-builds/
- **Troubleshooting**: https://docs.expo.dev/build/troubleshooting/

## Environment Variables (Optional)

If you add environment-specific settings, create `.env.production` in `expo/` folder:

```
REACT_APP_API_URL=https://your-production-api.com
```

Update `expo/app.json` to reference them in build profiles.

## Next Steps After Building

1. **Test on Android**: Install APK and verify all features work
2. **Distribute**: Share APK or upload to Play Store
3. **Updates**: Switch to EAS Update for instant OTA updates without Play Store

---

**Questions?** Check the [README.md](README.md) for development instructions or [expo.dev](https://expo.dev) for comprehensive Expo documentation.
