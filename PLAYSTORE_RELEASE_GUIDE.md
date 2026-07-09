# HerdFlow Play Store Release Guide

This guide is the direct path to publish HerdFlow so anyone can download it from Google Play.

## 1) One-time requirements

1. Google Play Console developer account.
2. App record created for package name com.herdflow.mobile.
3. Expo account with access to this project.
4. Android app signing configured in EAS.

## 2) Verify production config

1. Production Android build type is app-bundle (AAB) in [expo/eas.json](expo/eas.json).
2. Production profile is configured in [eas.json](eas.json).
3. App identity is set in [expo/app.json](expo/app.json):

- package: com.herdflow.mobile
- version and versionCode managed by EAS auto increment

## 3) Build Play Store bundle

From repo root:

```bash
npm run eas:build:playstore
```

From expo folder:

```bash
npm run eas:build:playstore
```

Expected output:

- EAS creates an Android App Bundle (.aab) for Play Store upload.

## 4) Submit to Google Play

From repo root:

```bash
npm run eas:submit:playstore
```

From expo folder:

```bash
npm run eas:submit:playstore
```

## 5) Play Console checklist

1. Upload complete AAB build.
2. Fill app listing (title, short description, full description, screenshots, icon, feature graphic).
3. Complete content rating and data safety.
4. Complete privacy policy URL.
5. Resolve policy warnings.
6. Promote release to production track.

## 6) Pre-release quality checklist

1. Run [npm run build] from repo root.
2. Verify app backend and website backend health endpoints.
3. Smoke test app flows:

- Dashboard load
- Marketplace open and item render
- Cattle create and edit
- Camp create and edit
- Vaccine schedule and reminder
- Count create and delete

4. Confirm offline queue behavior in app health panel.

## 7) Recommended release cadence

1. Internal testing track first.
2. Closed testing track next.
3. Production rollout with staged percentage.
4. Monitor crashes and ANR metrics before 100 percent rollout.

## 8) Troubleshooting

- If submission fails due to credentials, re-run EAS login and Play service account setup.
- If package conflict appears, ensure com.herdflow.mobile matches the Play app record exactly.
- If policy rejection occurs, fix Play Console warnings and resubmit a new build.
