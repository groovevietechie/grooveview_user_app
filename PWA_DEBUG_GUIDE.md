# PWA Debug Guide

## Quick Verification

### 1. Check if PWA Icons Are Present
```bash
ls -la public/icon-*.png
ls -la public/screenshot-*.png
```

Expected output:
- `icon-192.png` (~5-6 KB)
- `icon-512.png` (~20-22 KB)
- `icon-192-maskable.png` (~2-3 KB)
- `icon-512-maskable.png` (~10-12 KB)
- `screenshot-1.png` (~16 KB)
- `screenshot-2.png` (~16 KB)

### 2. Check Manifest.json
Visit: `https://yourapp.com/manifest.json`

Should return valid JSON with:
- `"name"`: "GrooveVie - Order Food"
- `"display"`: "standalone"
- `"start_url"`: "/"
- `"icons"` array with at least 2 entries (192 and 512)
- `"theme_color"`: "#fbbf24"

### 3. Check Service Worker
Visit: `https://yourapp.com/sw.js`

Should return the service worker code starting with `// Service Worker for GrooveVie PWA`

## Browser Testing

### Chrome DevTools (Desktop)
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Manifest** section - should show green checkmarks
4. Check **Service Workers** section - should show registered `/sw.js`
5. Try clicking "Add to shelf" button

### Chrome DevTools (Desktop - Simulate Android)
1. Press **F12** to open DevTools
2. Press **Ctrl+Shift+M** to enable device emulation
3. Select "Pixel 4" or similar Android device
4. Refresh the page
5. Should see install prompt after 3-5 seconds at the bottom

### Android Chrome (Real Device)
1. Open Chrome on Android
2. Visit your app URL
3. Wait 3-5 seconds
4. Should see a card at the bottom: "Install GrooveVie"
5. Tap "Install Now" button
6. Native install dialog should appear
7. Tap "Install" to confirm

## Console Debugging

### Enable Console Logs
1. Open DevTools (F12)
2. Go to **Console** tab
3. Refresh the page
4. Look for `[PWA]` prefixed messages

### Expected Console Output (in order):
```
[PWA] Listeners attached
[PWA] beforeinstallprompt event fired! (or skip if no native support)
[PWA] Showing native install prompt
[PWA] Service Worker registered successfully...
[PWA] Showing fallback install prompt (if beforeinstallprompt doesn't fire)
```

## Common Issues & Solutions

### Issue: Prompt Not Appearing
**Cause**: `beforeinstallprompt` event not firing

**Solutions**:
1. Ensure you're on HTTPS (required for PWA)
2. Check that manifest.json is valid
3. Verify icons exist and are accessible
4. Check that service worker registers successfully
5. Open DevTools → Console and look for `[PWA]` messages
6. Try incognito mode (some browsers cache PWA state)

### Issue: Manifest.json 404
**Solution**: Ensure file is in `public/` folder, not in `src/`

### Issue: Service Worker Not Registering
**Cause**: Service worker file not found or invalid

**Solutions**:
1. Verify `/sw.js` is accessible
2. Check for syntax errors in `public/sw.js`
3. Try clearing browser cache
4. Check console for registration errors

### Issue: Only Seeing "Learn More" Instead of "Install Now"
**Cause**: Native `beforeinstallprompt` not firing, using fallback

**Solution**:
- This is normal on some devices
- Clicking the button will show instructions
- Check console for fallback prompt message

### Issue: Prompt Disappeared After 1st Visit
**Cause**: Dismissed in current session or app was installed

**Solutions**:
- Clear `sessionStorage` in DevTools → Application → Storage
- Or open in incognito/private mode
- Verify `pwa-prompt-dismissed` key exists in Session Storage

## PWA Criteria Checklist

For PWA to work, these must be met:
- ✓ HTTPS connection (production only)
- ✓ Valid `manifest.json` in public folder
- ✓ `manifest.json` referenced in HTML `<head>`
- ✓ Service worker at `/sw.js`
- ✓ Icons (192x192 and 512x512 minimum)
- ✓ `display: "standalone"` in manifest
- ✓ `start_url` in manifest
- ✓ `name` and `short_name` in manifest
- ✓ `theme_color` and `background_color` in manifest

## Testing Checklist

- [ ] Manifest.json is valid and accessible
- [ ] Icons are generated and accessible
- [ ] Service worker registers successfully
- [ ] Console shows `[PWA]` debug messages
- [ ] Prompt appears after 3-5 seconds on first visit
- [ ] Prompt can be dismissed with X button
- [ ] Prompt reappears on refresh if not installed
- [ ] Install button works (or fallback appears)
- [ ] App can be installed successfully
- [ ] Installed app runs in standalone mode
- [ ] Prompt doesn't appear for installed app
- [ ] Page loads offline (cached content)

## Mobile Testing

### Android
1. Use Chrome or Edge browser
2. Visit app URL via HTTPS
3. Wait for install prompt
4. Tap "Install Now"
5. Confirm installation
6. Find app icon on home screen
7. Launch from home screen

### iOS
1. Use Safari browser
2. Tap Share button
3. Tap "Add to Home Screen"
4. Enter app name
5. Tap Add
6. App appears on home screen
(Note: iOS doesn't use `beforeinstallprompt`, use manual method)

## Performance Monitoring

### Check Service Worker Cache
1. DevTools → Application → Cache Storage
2. Should see `groovevie-v1` cache
3. Expand to see cached files
4. Files should load from cache on offline

### Monitor Network
1. DevTools → Network tab
2. Reload page
3. First load: files from network
4. Second load: files from cache (offline mode)

## Production Deployment

Before going to production:
1. [ ] Enable HTTPS
2. [ ] Test manifest.json is valid
3. [ ] Verify all icons are present
4. [ ] Test service worker installation
5. [ ] Test on real Android device
6. [ ] Test offline functionality
7. [ ] Monitor console for errors
8. [ ] Check Google Lighthouse PWA audit

## Lighthouse Audit

Run in Chrome DevTools:
1. DevTools → Lighthouse tab
2. Select "PWA" category
3. Click "Analyze page load"
4. Review audit results
5. Fix any reported issues

Expected score: 90+ for proper PWA

## Useful Commands

### Generate icons (if needed again)
```bash
node scripts/generate-pwa-icons.js
```

### Clear all caches
```javascript
// Run in browser console
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
}).then(() => {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister())
  })
})
```

### View all Service Worker registrations
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log(registrations)
})
```

## References

- [PWA Criteria - web.dev](https://web.dev/articles/install-criteria)
- [Service Workers API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest - MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Chrome DevTools - Application Tab](https://developer.chrome.com/docs/devtools/application/)
