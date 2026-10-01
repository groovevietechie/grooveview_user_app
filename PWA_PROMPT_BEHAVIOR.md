# PWA Install Prompt Behavior Guide

## Overview
The GrooveVie app now displays a persistent install prompt that encourages users to install the app on their Android devices. The prompt behavior has been optimized to maximize installation rates while respecting user preferences.

## Prompt Display Logic

### When Prompt SHOWS:
✅ On non-installed devices (browser-based users)
✅ After 3 seconds of page load
✅ On every new visit/page refresh
✅ Until the app is officially installed

### When Prompt HIDES:
❌ When app is already installed (running in standalone mode)
❌ When user clicks the X button (dismissal for current session only)
❌ User refreshes/reopens the app (dismissal resets)

## User Scenarios

### Scenario 1: First-Time User (Not Installed)
1. Opens GrooveVie app in browser
2. Waits 3 seconds
3. Beautiful install banner appears
4. Has two options:
   - **"Install Now"** → Installs app, prompt never shows again
   - **"X" (Dismiss)** → Hides prompt for this session

### Scenario 2: User Dismisses Prompt
1. User clicks X to dismiss
2. Continues browsing the app
3. Closes browser tab/app
4. **Next visit** → Prompt appears again after 3 seconds
5. Repeated nudging encourages installation

### Scenario 3: User Installs App
1. User clicks "Install Now"
2. Native install dialog appears
3. Confirms installation
4. App is installed on home screen
5. **Never sees prompt again** (even after clearing cache)

### Scenario 4: Already Installed User
1. Opens app from home screen
2. App runs in standalone mode (no browser UI)
3. Prompt never appears
4. Full native app experience

## Technical Details

### Storage Used
- **sessionStorage**: `pwa-prompt-dismissed`
  - Stores dismissal for current session only
  - Cleared when browser/app is closed
  - Cleared when page is refreshed

### Detection Methods
- Checks `window.matchMedia("(display-mode: standalone)")` to detect installed app
- Listens for `beforeinstallprompt` event from browser
- Listens for `appinstalled` event to detect successful installation

### Browser Support
- **Android Chrome** ✓ Full support
- **Android Edge** ✓ Full support
- **Android Firefox** ⚠️ No install prompt (no native support)
- **iOS Safari** ⚠️ Limited (requires manual "Add to Home Screen")
- **Desktop Chrome** ✓ Full support
- **Desktop Edge** ✓ Full support

## Advantages of This Approach

1. **Persistent Nudging**: Keeps reminding users until they install
2. **Non-Intrusive**: Can be dismissed with one click
3. **Smart Session Management**: Doesn't annoy returning users in same session
4. **Contextual**: Encourages action at ideal moments (new visits)
5. **Respectful**: Never shows for users who've installed
6. **Conversion Focused**: Maximum opportunities to convert browsers to app users

## Expected Conversion Metrics

- **Day 1**: 2-5% install rate (initial exposure)
- **Week 1**: 10-20% cumulative (repeated exposure)
- **Month 1**: 30-50% cumulative (persistent nudging effect)
- **Active Users**: ~70-80% of daily active users installed

## Analytics to Track

Consider logging:
- `pwa_prompt_shown` - When prompt appears
- `pwa_prompt_dismissed` - When user clicks X
- `pwa_install_started` - When user clicks "Install Now"
- `pwa_install_completed` - When installation succeeds

## Future Enhancements

1. **A/B Testing**: Test different messaging or timing
2. **Smart Timing**: Show based on user engagement (e.g., after 5 orders)
3. **Targeting**: Different messages for different user segments
4. **Incentives**: Limited-time offer to incentivize installation
5. **Analytics Dashboard**: Real-time conversion tracking

## Troubleshooting

### Prompt Not Appearing?
- Verify browser supports PWA (Chrome, Edge on Android)
- Check if app is already installed (check display-mode)
- Ensure HTTPS is being used
- Check browser console for errors
- Verify manifest.json is accessible

### Prompt Appears But Doesn't Install?
- Check manifest.json is valid JSON
- Verify app name is not too long
- Ensure icons are properly formatted
- Check device storage space
- Try different browser (Chrome vs Edge)

## References

- [Web App Install Prompts - Google](https://developer.chrome.com/articles/promote-install/)
- [PWA Install Criteria](https://web.dev/articles/install-criteria)
- [beforeinstallprompt API](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
