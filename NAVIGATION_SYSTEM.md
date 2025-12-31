# Navigation System Implementation

This document describes the comprehensive navigation system implemented for the GrooveVie webapp to ensure proper back button functionality across all devices and browsers.

## Overview

The navigation system provides:
- **Consistent back button behavior** across all pages
- **Device back button support** for mobile browsers and PWAs
- **Hierarchical navigation** that follows logical user flow
- **Fallback routes** for edge cases

## Components

### 1. `useBackNavigation` Hook (`src/hooks/useBackNavigation.ts`)
A custom React hook that provides consistent navigation behavior:
- Handles browser back button events
- Provides programmatic navigation methods
- Supports custom back handlers and fallback routes

### 2. `BackButton` Component (`src/components/BackButton.tsx`)
A reusable back button component:
- Consistent styling across the app
- Uses the `useBackNavigation` hook internally
- Supports custom labels and styling

### 3. `NavigationHandler` Component (`src/components/NavigationHandler.tsx`)
Global navigation handler for browser-level events:
- Manages browser history state
- Handles special cases like payment pages
- Provides Android WebView back button support

### 4. `MobileBackHandler` Component (`src/components/MobileBackHandler.tsx`)
Specialized handler for mobile device back buttons:
- Intercepts device back button presses
- Maintains proper history state
- Prevents unwanted app exits

### 5. Navigation Utilities (`src/lib/navigation-utils.ts`)
Helper functions for navigation logic:
- Route hierarchy definitions
- Parent route resolution
- Path analysis utilities

## Navigation Hierarchy

The app follows this navigation hierarchy:

```
Home (/)
└── Business Menu (/b/[slug])
    ├── Checkout (/b/[slug]/checkout)
    │   └── Payment (/b/[slug]/payment)
    ├── Order Confirmation (/b/[slug]/order/[orderId])
    └── Order Tracking (/b/[slug]/orders)
```

## Back Button Behavior

### Desktop/Browser Back Button
- **Payment Page** → Checkout Page
- **Checkout Page** → Business Menu
- **Order Confirmation** → Business Menu
- **Order Tracking** → Business Menu
- **Business Menu** → Home Page

### Mobile Device Back Button
Same hierarchy as browser back button, with additional handling for:
- PWA environments
- Android WebView contexts
- iOS Safari standalone mode

## Implementation Details

### 1. Global Setup
The navigation system is initialized in the root layout (`src/app/layout.tsx`):

```tsx
<ThemeProvider>
  <NavigationHandler />
  <MobileBackHandler />
  {children}
</ThemeProvider>
```

### 2. Component Usage
Components use the navigation system in two ways:

**Using the hook directly:**
```tsx
const { goBack } = useBackNavigation({
  fallbackRoute: `/b/${business.slug}`
})
```

**Using the BackButton component:**
```tsx
<BackButton 
  label="Back to Menu"
  fallbackRoute={`/b/${business.slug}`}
/>
```

### 3. Custom Back Handlers
For complex flows (like service booking), custom back handlers can be provided:

```tsx
useBackNavigation({
  onBack: () => {
    if (step === "payment") {
      setStep("bookingForm")
    } else if (step === "bookingForm") {
      setStep("serviceOptions")
    }
    // ... custom logic
  }
})
```

## Updated Components

The following components have been updated to use the new navigation system:

1. **CheckoutPage** - Uses BackButton component
2. **MenuPaymentClient** - Uses BackButton component  
3. **OrderConfirmationPage** - Uses useBackNavigation hook
4. **OrderTrackingPage** - Uses BackButton component
5. **ServiceFlow** - Uses useBackNavigation with custom handler
6. **ServiceBookingForm** - Uses BackButton component
7. **MenuHeader** - Uses useBackNavigation hook

## Mobile Considerations

### PWA Support
The system includes meta tags for PWA compatibility:
```html
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
```

### Android WebView
For Android apps using WebView, the system exposes a global handler:
```javascript
// Available globally for Android WebView integration
window.handleAndroidBack()
```

### iOS Safari
The system handles iOS Safari's unique behavior with history state management.

## Testing

To test the navigation system:

1. **Browser Testing:**
   - Use browser back/forward buttons
   - Test on different pages in the hierarchy
   - Verify fallback behavior

2. **Mobile Testing:**
   - Test device back button on Android
   - Test swipe back gesture on iOS
   - Test in PWA mode

3. **Edge Cases:**
   - Direct URL access to deep pages
   - Refresh on various pages
   - Multiple tab scenarios

## Benefits

1. **Consistent UX:** Users get predictable navigation behavior
2. **Mobile-First:** Proper device back button support
3. **Maintainable:** Centralized navigation logic
4. **Flexible:** Supports custom navigation flows
5. **Robust:** Handles edge cases and fallbacks

## Future Enhancements

Potential improvements:
- Navigation breadcrumbs
- Deep linking support
- Navigation analytics
- Gesture-based navigation
- Voice navigation commands