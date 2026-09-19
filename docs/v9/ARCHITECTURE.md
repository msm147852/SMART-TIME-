# SMART TIME V9 Architecture Rules

## App shell
- Layout follows the actual application window, not a physical `isTablet` flag.
- Compact windows keep the existing bottom-navigation phone experience.
- Medium/expanded/large windows transform the same navigation into a vertical rail.
- The app must remain usable in portrait, landscape, split-screen, foldable and desktop-sized windows.
- UI density changes with available space rather than with device-name checks.

## Data
- Existing repositories remain the compatibility layer during the V9 migration.
- New features should go through repository/service boundaries instead of reading `localStorage` directly.
- Offline-first storage, cloud sync and PostgreSQL are staged after the shell migration so existing functionality is not broken in one large rewrite.

## Android
- Capacitor is the native bridge for Android; the React application remains the shared UI/business layer.
- Native-only capabilities belong behind a small platform service boundary.
- Secrets never belong in the frontend bundle, GitHub repository or APK.

## Deployment
- Railway builds with `npm run build` and starts with `npm start` through `railway.json`.
- `.env` and secret values are never committed.

## Current V9 foundation
- Responsive/adaptive shell CSS is isolated in `src/v9-adaptive.css`.
- The viewport meta configuration now supports `viewport-fit=cover` without disabling user zoom.
- Capacitor 8 packages and Android scripts are prepared.
- The Android application id is `com.smarttime.app`.
