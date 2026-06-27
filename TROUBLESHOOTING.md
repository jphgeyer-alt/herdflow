# HerdFlow APK: Troubleshooting FAQ

Solutions to common issues when building and running HerdFlow APK.

## Building Issues

### Q: "eas command not found"
**A:** EAS CLI is not installed globally.

```bash
npm run eas:install
# OR
npm install -g eas-cli
```

### Q: "Not authenticated" or authentication error
**A:** You need to login to Expo.

```bash
eas login
# Enter your Expo account credentials (create account at https://expo.io if needed)
```

Verify: `eas whoami`

### Q: Build succeeds but I can't find it to download
**A:** Check multiple places:

1. **Expo Dashboard**: https://expo.io/builds (most common)
2. **Terminal output**: Look for download link in build completion message
3. **Email**: Expo may send build completion notification
4. **eas build:list**: List recent builds
   ```bash
   eas build:list --limit 10
   ```

### Q: Build fails immediately with error message
**A:** Check the error:

1. **JSON syntax error**: Check `expo/app.json` is valid JSON
   ```bash
   npm install -g jsonlint
   jsonlint expo/app.json
   ```

2. **Package name conflict**: Ensure `com.herdflow.mobile` is unique or change it

3. **SDK mismatch**: Verify Expo SDK version in `expo/app.json` matches your setup

4. **Network issue**: Check internet connection, try again

### Q: Build takes too long (>30 min)
**A:** This is normal for first-time builds. EAS is compiling Android APK which takes 10-15 minutes. If >30 min:
- Check https://expo.io/builds for progress
- Builds sometimes queue; refresh page
- Try again if service is overloaded

### Q: "No Android keystore provided"
**A:** Optional for preview builds. For production, generate keystore:
- See [Build & Release APK](APK_BUILD_GUIDE.md#build-for-production)
- Or contact Expo support for help

## Download Issues

### Q: Download button doesn't appear or link is broken
**A:** 

1. Refresh page at https://expo.io/builds
2. Build may still be in progress (check progress bar)
3. If build failed, error will show instead of download button
4. Try accessing with logged-in browser

### Q: Downloaded file is not an APK
**A:** Ensure you're downloading from buildpage, not another resource. 
- Correct file ends in `.apk` 
- Check file type: `file herdflow-*.apk` 
- Size should be 50-100 MB (reasonable for Android app)

### Q: "Failed to download" from Expo
**A:** 

1. Check internet speed/stability
2. Try different browser
3. Try downloading to different location
4. Use QR code to test on device instead:
   - Scan with Expo Go app
   - Verify app works
   - Then download if needed

## Installation Issues

### Q: "Cannot install" or "Package appeared to be corrupt"
**A:** 

1. **APK is incomplete**: Re-download from Expo
2. **Storage is full**: Free up space on device (need ~100 MB)
3. **Wrong Android version**: Device OS version may not match
4. **Corrupted transfer**: Re-transfer APK via USB or cloud

Steps to fix:
```bash
# On Windows, verify APK:
certutil -hashfile herdflow.apk SHA256

# Delete previous version from device:
# Settings > Apps > HerdFlow > Uninstall

# Try installing again
```

### Q: "Unknown sources" permission error
**A:** Enable installing from unknown sources:

1. Go to **Settings** → **Security** or **Settings** → **Apps**
2. Enable "Unknown sources" or "Install from unknown sources"
3. Try installing APK again

Note: This is normal for apps not from Play Store.

### Q: "Blocked by Play Protect"
**A:** This is a safety warning:

1. Tap **Install anyway** (if available)
2. Or go to **Settings** → **Google Play Protect** → disable temporarily
3. Install the APK
4. Re-enable Play Protect after

### Q: Installation starts but fails halfway
**A:** 

1. Ensure device storage has 100+ MB free
2. Uninstall previous HerdFlow version
3. Restart phone and try again
4. Try different APK (preview vs production)

## Runtime Issues

### Q: App crashes on startup
**A:** Check these in order:

1. **Backend not running**: Start server first
   ```bash
   npm run dev:server
   ```

2. **Wrong API URL**: Check `expo/App.tsx` line ~30:
   ```typescript
   const API_BASE_URL = 'http://10.0.2.2:4174';  // Android emulator
   // OR on physical device:
   const API_BASE_URL = 'http://YOUR_IP:4174';   // Your computer IP
   ```

3. **App permissions**: 
   - Go to **Settings** → **Apps** → **HerdFlow** → **Permissions**
   - Ensure **INTERNET** permission is granted

4. **Clear app cache**:
   - **Settings** → **Apps** → **HerdFlow** → **Clear cache**
   - Try again

### Q: App loads but can't fetch data
**A:** API connection issue:

1. **Is backend running?** 
   ```bash
   npm run dev:server
   # Should show "Server running on port 4174"
   ```

2. **Check API URL** (depends on device):
   - **Android emulator**: `http://10.0.2.2:4174`
   - **Physical Android device**: `http://YOUR_COMPUTER_IP:4174`
   
   To find your IP:
   ```bash
   ipconfig  # Windows
   # Look for IPv4 Address (usually 192.168.x.x or 10.0.x.x)
   ```

3. **Check firewall**: Ensure port 4174 is not blocked
   ```bash
   # Windows Defender Firewall: Allow app access
   # Or temporarily disable firewall for testing
   ```

4. **Network connectivity**:
   - Verify device and computer on same WiFi
   - Or use USB debugging with ADB

### Q: App is very slow
**A:** 

1. **Backend overloaded**: Restart server
   ```bash
   npm run dev:server
   ```

2. **Device storage full**: Free up space
3. **Too much data**: Clear app cache (see above)
4. **CPU usage high**: Close other apps on device

### Q: Can't add/edit cattle or other records
**A:** 

1. Check API is working (can you see dashboard?)
2. Check network connection
3. Try a different form field
4. Restart app
5. Check backend logs for errors

### Q: Vaccine dates not showing correctly
**A:** Timezone issue - expected behavior:

- Dates are stored in UTC
- Display adjusts for device timezone
- Should be fine across timezones

## API Connection

### Q: How do I know API is connected?
**A:** In the app:

1. Look at **Dashboard** tab
2. If you see summary statistics: API is working ✅
3. If you see empty states: API not connected ❌

### Q: "localhost:4174" doesn't work
**A:** Use specific IP based on device:

```
Android Emulator:  http://10.0.2.2:4174
Physical device:   http://YOUR_IP:4174
```

Find your IP:
```bash
Windows:   ipconfig | findstr "IPv4"
macOS/Linux: ifconfig | grep inet
```

### Q: Still can't connect after trying everything
**A:** Debug step-by-step:

1. Backend running?
   ```bash
   npm run dev:server
   ```

2. API responding?
   ```bash
   # From backend computer:
   curl http://localhost:4174/api/summary
   # Should return JSON
   ```

3. Network path open?
   ```bash
   # From device/emulator:
   ping YOUR_IP
   # Should show responses
   ```

4. Port open?
   - Firewall may be blocking port 4174
   - Windows: Check Windows Defender Firewall
   - Add exception for Node.js/backend

## Testing Solutions

### Q: Want to test without full build?
**A:** Two options:

1. **Expo Go app** (fastest):
   ```bash
   npm run expo:start
   # Scan QR code with Expo Go
   # App runs in Expo Go (not native)
   ```

2. **Android Emulator**:
   ```bash
   npm run expo:android
   # Runs in emulator (requires Android Studio)
   ```

### Q: Want to rebuild without starting over?
**A:** 

```bash
# For preview build again:
npm run eas:build:preview

# For production build again:
npm run eas:build:production

# Check all builds:
npm run eas:status
```

## Resources

| Resource | Purpose |
|----------|---------|
| [APK_BUILD_GUIDE.md](APK_BUILD_GUIDE.md) | Step-by-step APK building |
| [expo/EXPO_README.md](expo/EXPO_README.md) | Expo development guide |
| https://docs.expo.dev | Official Expo documentation |
| https://expo.io/builds | Build status dashboard |
| https://devtalk.expo.dev | Expo community forum |

## Still Stuck?

Try these in order:

1. ✅ Check relevant section above
2. ✅ Google the exact error message
3. ✅ Search [Expo documentation](https://docs.expo.dev)
4. ✅ Search [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)
5. ✅ Ask on [Expo forum](https://devtalk.expo.dev)

---

**Remember**: Most issues are either:
- Backend not running
- Wrong API URL
- Firewall/network blocking
- Missing permissions

Start by checking those first! 🚀
