# PWA (Progressive Web App) Implementation for GrooveVie

## Overview
The GrooveVie customer app has been enhanced as a Progressive Web App (PWA) to allow users to install it on their Android devices directly, eliminating the need to scan QR codes every time they want to access the app.

## Files Created

### 1. **public/manifest.json**
- Web app manifest file that defines app metadata
- Specifies app name, icons, colors, display mode, and shortcuts
- Required for PWA installation on Android

### 2. **public/sw.js**
- Service Worker implementation for offline functionality
- Handles caching strategies (Network-First for API calls, Cache-First for assets)
- Enables offline access to previously viewed content
- Automatically updates cache periodically

### 3. **src/components/PWAInstallPrompt.tsx**
- React component that displays the install prompt to users
- Shows a beautiful banner prompting users to install the app
- Uses the `beforeinstallprompt` event to trigger native installation
- **Key Feature**: Displays on every page visit for non-installed apps
- Uses `sessionStorage` to track dismissal (resets when user closes/refreshes the app)
- Automatically hides if app is already installed or user dismisses within current session
- Prompt reappears on next visit if app is not installed

### 4. **src/components/PWAServiceWorkerRegister.tsx**
- Registers the service worker when app loads
- Checks for service worker updates every 6 hours
- Provides console logs for debugging

## Updated Files

### **src/app/layout.tsx**
- Added PWA service worker registration
- Added PWA install prompt component
- Updated metadata with manifest.json reference
- Added Apple-specific PWA metadata for iOS compatibility

## How It Works

### Installation Flow (Android)
1. User visits the GrooveVie app in their browser
2. After 3 seconds, a beautiful install prompt appears at the bottom
3. User can click "Install Now" to install the app
4. App gets installed as a standalone app on the device home screen
5. User can launch directly from home screen without scanning QR codes
6. Prompt **always reappears** on next visit if user hasn't installed the app (persistent nudging)
7. Once app is installed, prompt is never shown again

### Prompt Behavior
- **On Non-Installed Devices**: Prompt displays after 3 seconds on every visit
- **Session Dismissal**: If user clicks X button, prompt hides for the current session only
- **Across Sessions**: Prompt reappears when user reopens the browser (encouraging installation)
- **On Installed Devices**: Prompt never shows (app is running in standalone mode)

### Features
- **Offline Support**: Service Worker caches app assets and API responses
- **Fast Loading**: Subsequent visits load from cache for faster experience
- **Standalone Mode**: App runs without browser UI when installed
- **Push Notifications Ready**: Can be extended to support notifications
- **Update Checking**: Checks for updates every 6 hours

## Installation Icons Needed
To fully enable the PWA, you'll need to add these icon files to the `public/` folder:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)
- `icon-192-maskable.png` (192x192 pixels, for adaptive icons)
- `icon-512-maskable.png` (512x512 pixels, for adaptive icons)
- `screenshot-1.png` (540x720 pixels)
- `screenshot-2.png` (540x720 pixels)

Use your existing GrooveVie logo to create these icons with proper padding and backgrounds.

## Browser Compatibility
- **Android Chrome/Edge**: Full support for installation prompt
- **iOS Safari**: Limited support (use "Add to Home Screen" manually)
- **Desktop**: Can be installed on supportable browsers (Chrome, Edge)

## Testing the PWA

### Desktop Chrome
1. Open DevTools (F12)
2. Go to Application → Manifest
3. Click "Add to shelf" to test installation

### Android Device
1. Open Chrome
2. Visit the app URL
3. Wait for install prompt or tap menu → "Install app"

## User Benefits
✓ No more QR code scanning needed
✓ Faster app launch from home screen
✓ Works offline (with cached data)
✓ Uses less data than opening in browser
✓ Native app-like experience
✓ Takes up minimal space on device

## Security Considerations
- HTTPS is required for PWA (should be enforced in production)
- Service Worker only caches necessary data
- API responses are cached but network requests are prioritized
- Old cache versions are automatically cleaned up

## Future Enhancements
- Push notifications for order updates
- Background sync for offline orders
- App shortcuts for quick actions
- Periodic updates of app shell
