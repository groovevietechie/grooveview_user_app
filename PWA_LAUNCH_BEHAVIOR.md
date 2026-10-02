# PWA Launch Behavior Documentation

## Overview
The GrooveVie PWA is now configured to always launch directly into the menu page, providing users with immediate access to food ordering without requiring navigation.

## Launch Configuration

### Start URL
```
/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929
```

This URL is configured in two places:

### 1. Manifest Configuration (`public/manifest.json`)
```json
{
  "start_url": "/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929",
  "display": "standalone",
  ...
}
```

The manifest tells the browser/OS where to launch the app when the user taps the home screen icon.

### 2. Runtime Redirect (`src/components/PWARedirect.tsx`)
A client-side redirect component ensures that:
- If the PWA app is running in standalone mode (`display-mode: standalone`)
- AND the user is on the root path (`/`)
- The app automatically redirects to the menu page

This provides a fallback in case the manifest's `start_url` isn't honored or if the user navigates to root.

## Implementation Details

### PWARedirect Component
```typescript
export default function PWARedirect() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if app is running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true

    // Redirect to menu if on home page
    if (isStandalone && pathname === "/") {
      router.replace("/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929")
    }
  }, [pathname, router])

  return null
}
```

### Integration
The component is integrated in the root layout:
```typescript
<ThemeProvider>
  <PWAServiceWorkerRegister />
  <PWARedirect />  // <-- Redirect handler
  <Suspense fallback={null}>
    <NavigationHandler />
    <MobileBackHandler />
    <PWAInstallPrompt />
  </Suspense>
  {children}
</ThemeProvider>
```

## Launch Flow

### Browser/QR Code Visit
1. User visits `https://app.groovevie.com` via browser or QR code
2. App loads normally
3. Home page (`/`) is displayed
4. PWA install prompt appears (after 3-5 seconds)

### First PWA Installation
1. User sees PWA install prompt
2. Clicks "Install Now"
3. Native install dialog appears
4. User confirms installation
5. App is installed on home screen

### PWA App Launch (After Installation)
1. User taps GrooveVie icon on home screen
2. OS launches app at manifest's `start_url`
3. App loads directly to: `/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929`
4. **Menu page displays immediately** with tab pre-selected
5. User can start ordering without any navigation

### Alternative: Manual Root Navigation
If a user somehow navigates to `/` while the PWA is running:
1. PWARedirect component detects standalone mode
2. Automatically redirects to menu page
3. Seamless experience without user action

## Benefits

✅ **Instant Access**: Users get the menu immediately upon app launch
✅ **Frictionless Experience**: No need to navigate after opening app
✅ **Tab Pre-selection**: Specific menu category loads automatically
✅ **Native App Feel**: Behaves like a native app with direct access
✅ **Fallback Safety**: Multiple layers ensure correct destination

## Testing the PWA Launch

### Desktop Chrome
1. `npm run build`
2. `npm run start`
3. Open `http://localhost:3000/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929`
4. DevTools → Application → "Add to shelf" (simulates Android)
5. Click "App" at top of browser (launches in app mode)
6. Verify menu page displays

### Android Device
1. Deploy to HTTPS
2. Open in Chrome on Android
3. Wait for install prompt
4. Tap "Install Now"
5. Confirm installation
6. Tap GrooveVie icon on home screen
7. **Verify**: Menu page loads immediately with correct tab

### iOS Device
1. Open in Safari
2. Tap Share → Add to Home Screen
3. Tap GrooveVie icon
4. **Note**: iOS doesn't use manifest `start_url`, manual redirect handles it

## Configuration Details

### Manifest Entry
- **start_url**: Specific menu page with tab parameter
- **scope**: `/` (entire app scope)
- **display**: `standalone` (hides browser UI)
- **theme_color**: `#fbbf24` (gold, matches app theme)
- **background_color**: `#ffffff` (white, for initial load)

### Runtime Detection
The PWARedirect component checks:
- `window.matchMedia("(display-mode: standalone)")` - CSS media query
- `window.navigator.standalone` - iOS property
- Both ensure reliable detection across all platforms

## Customization

### To Change Launch URL
Update both:
1. `public/manifest.json` → `start_url`
2. `src/components/PWARedirect.tsx` → router.replace() URL

### To Add Additional Parameters
Keep parameters in URL:
```
/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929&sort=name
```

Parameters are preserved through PWA launches.

## Browser Support

| Browser | Manifest URL | Runtime Redirect |
|---------|--------------|-----------------|
| Chrome Android | ✅ Honored | ✅ Fallback |
| Edge Android | ✅ Honored | ✅ Fallback |
| Firefox Android | ⚠️ Limited | ✅ Fallback |
| Safari iOS | ⚠️ Limited | ✅ Fallback |
| Chrome Desktop | ✅ Honored | ✅ Fallback |
| Edge Desktop | ✅ Honored | ✅ Fallback |

## Debugging

### Check Manifest
```bash
curl https://app.groovevie.com/manifest.json | jq .start_url
```
Expected: `/b/groovevie-serviced-lounge?tab=a03564a6-344e-471e-86c6-1581ba9ff929`

### Monitor Redirect in Console
Look for log message:
```
[PWA] Standalone app detected on root, redirecting to menu page
```

### Verify in DevTools
1. DevTools → Application → Manifest
2. Check "start_url" field shows correct path
3. Launch app and check Network tab for redirect

## Known Behaviors

✅ **First Launch**: Goes to menu page
✅ **Subsequent Launches**: Goes to menu page
✅ **Browser Back Button**: May go to home, redirect handles it
✅ **Manual Root Navigation**: Redirect catches it
✅ **Deep Links**: Other URLs work normally (only root redirects)

## Production Checklist

- [x] Manifest.json updated with correct start_url
- [x] PWARedirect component implemented
- [x] PWARedirect imported in layout
- [x] Tested on desktop (Chrome DevTools)
- [ ] Tested on real Android device
- [ ] Tested on real iOS device
- [ ] Verified manifest is accessible via `/manifest.json`
- [ ] HTTPS enabled (required for PWA)

## Support & Troubleshooting

### App doesn't launch to menu
1. Check manifest.json is valid
2. Verify start_url in manifest
3. Clear app cache and reinstall
4. Check browser console for redirect logs

### Tab parameter not working
1. Verify tab ID is correct: `a03564a6-344e-471e-86c6-1581ba9ff929`
2. Check menu component handles query param
3. Inspect Network tab for URL

### App launches to home instead
1. Browser may not honor manifest (rare)
2. Runtime redirect should catch it
3. Verify PWARedirect is mounted in layout
4. Check console for redirect message
