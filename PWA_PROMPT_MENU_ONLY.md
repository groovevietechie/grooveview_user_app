# PWA Installation Prompt - Menu Page Only

## Changes Made

The PWA installation prompt has been modified to **only display on the menu page** for devices that haven't installed the app via the prompt.

### Files Modified

#### 1. `/src/app/layout.tsx`
**Change:** Removed PWAInstallPrompt from root layout
- **Before:** PWAInstallPrompt rendered globally on all pages
- **After:** No global PWA prompt
- **Effect:** Prompt no longer appears on other pages like Order Tracking, Checkout, Tips, etc.

#### 2. `/src/components/MenuPage.tsx`
**Changes:**
- Added import for new `MenuPagePWAPrompt` component
- Added `<MenuPagePWAPrompt />` to the JSX render (just before closing tag)
- **Effect:** Prompt now only renders when user is on the menu page

#### 3. `/src/components/MenuPagePWAPrompt.tsx` (NEW)
**Purpose:** Specialized PWA prompt for menu page only
**Key Differences from original PWAInstallPrompt:**
- **Removed:** `pwa-prompt-dismissed` sessionStorage check
- **Removed:** One-time prompt logic 
- **Added:** Shows on every menu page visit (no dismissal persistence)
- **Behavior:** 
  - Shows after 1.8 seconds on menu page load
  - Shows every time user returns to menu page (until they install)
  - Once app is installed, prompt never shows again
  - Dismiss button hides prompt temporarily (but it shows again on next menu page visit)

#### 4. `/public/sw.js`
**Change:** Updated cache version from `v4` to `v5-pwa-menu-only`
- **Effect:** Forces cache invalidation and ensures new code is used

## How It Works

### Behavior Flow:

```
1. User opens app → Lands on Menu Page
   ↓
2. After 1.8 seconds → PWA Install Prompt appears
   ↓
3. User can:
   a) Click "Install now" → App installs → Prompt disappears forever
   b) Click "Not now" → Prompt hides temporarily
   ↓
4. If user navigated to other pages:
   - Order Tracking page → NO prompt
   - Checkout page → NO prompt
   - Tips page → NO prompt
   ↓
5. User returns to Menu Page → Prompt appears again (if not installed)
```

## Technical Details

### Session vs Persistent Storage
- **Old behavior:** Used `sessionStorage.getItem("pwa-prompt-dismissed")` to hide prompt once per session
- **New behavior:** No session storage - prompt shows every menu page visit
- **Standalone detection:** App installation is detected via `navigator.standalone` and display-mode

### File Structure
```
src/
├── app/
│   └── layout.tsx (PWAInstallPrompt REMOVED)
├── components/
│   ├── MenuPage.tsx (MenuPagePWAPrompt ADDED)
│   ├── PWAInstallPrompt.tsx (Still exists, no longer used)
│   └── MenuPagePWAPrompt.tsx (NEW - Menu page only)
```

## Testing the Changes

### To Verify Menu Page Only Behavior:

1. **Open Menu Page:**
   - Wait 1.8 seconds
   - PWA prompt should appear ✅

2. **Navigate to Order Tracking:**
   - No prompt should appear ✅

3. **Return to Menu Page:**
   - Wait 1.8 seconds
   - Prompt appears again ✅

4. **Click "Not Now":**
   - Prompt hides
   - Navigate away and back to menu
   - Prompt appears again ✅

5. **Click "Install Now":**
   - Follow browser/device install flow
   - Prompt disappears permanently ✅

### Browser DevTools Check:
1. Open DevTools → Application tab
2. Check **Service Workers** → verify v5 is registered
3. Check **Cache Storage** → should see `groovevie-v5-pwa-menu-only`
4. Old cache versions should be deleted

## Rollback (If Needed)

To restore the old behavior (prompt on all pages):

1. Delete `MenuPagePWAPrompt.tsx`
2. In `MenuPage.tsx`:
   - Remove `import MenuPagePWAPrompt`
   - Remove `<MenuPagePWAPrompt />` from JSX
3. In `layout.tsx`:
   - Restore `import PWAInstallPrompt from "@/components/PWAInstallPrompt"`
   - Restore `<PWAInstallPrompt />` in JSX

## Cache Clearing

If users see old behavior:

Visit: `https://your-domain.com/cache-clear`

Or manually:
1. DevTools → Application
2. Service Workers → Unregister all
3. Cache Storage → Delete all
4. Hard refresh (Ctrl+Shift+R)

## Summary

✅ **PWA Prompt now:**
- Only shows on Menu Page
- Shows every time user visits menu (until installed)
- Does NOT show on other pages
- Respects installed app status (doesn't show if app is installed)
- Has proper service worker cache invalidation

---
**Last Updated:** October 6, 2026
