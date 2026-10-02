# PWA Install Prompt - Design Specifications

## Color Scheme
- **Primary Dark**: `slate-900` to `blue-950` (Navy Blue gradient)
- **Accent**: `amber-400` / `amber-300` (Gold)
- **Border**: `amber-400/40` (Semi-transparent gold)
- **Text**: `slate-300` (Light gray) & `amber-300` (Gold gradient for title)

## Visual Design Elements

### Card Background
```
Gradient: from-slate-900 via-blue-950 to-slate-900
Border: 2px amber-400/40 with rounded-2xl
Shadow: shadow-2xl for depth
```

### Header Accents
- **Top Line**: Animated gradient line (transparent → amber → transparent)
- **Icon Container**: Glowing amber background with blur effect
- **Icon**: ArrowDownTrayIcon in amber-300
- **Sparkles**: SparklesIcon next to title for premium feel

### Typography
- **Title**: Font-black, gradient text (amber-300 → amber-200 → amber-400)
- **Body**: text-xs, text-slate-300 for readability
- **Buttons**: Font-semibold with proper contrast

### Interactive Elements

#### "Install Now" Button
- Gradient: from-amber-400 via-amber-300 to-amber-500
- Hover: Increased opacity and shine effect
- Active: scale-95 (press-down effect)
- Shine animation: Horizontal shimmer on hover
- Text: text-slate-900 (dark text on gold)

#### "Dismiss" Button (X)
- Background: bg-slate-800/50
- Hover: bg-slate-800 with border-slate-600
- Text: text-slate-300
- Active: scale-95

### Animations & Effects

#### Slide In Animation
```css
Duration: 500ms
Easing: ease-out
From: opacity 0, translateY(24px)
To: opacity 1, translateY(0)
```

#### Glow Effects
- **Background Glow**: Radial blur effect with amber-400/20
- **Border Glow**: Inset glow creating internal light effect
- **Icon Glow**: Centered blur behind icon

#### Shimmer Effect
- Animation duration: 2s infinite
- Creates left-to-right shine on button hover
- Opacity transitions for smooth effect

### Bottom Accent Dots
- Three dots with varying opacity
- Colors: `amber-400/40`, `amber-400/60`, `amber-400/40`
- Size: w-1.5 h-1.5
- Position: bottom-right corner

## Responsive Behavior

### Mobile (Default)
- Full width with 16px padding (4 * 4)
- max-w-md constraint (28rem)
- Center aligned with mx-auto

### Tablet/Desktop
- Same constraints maintained
- Max width: 448px (md in Tailwind)

## Spacing & Dimensions

```
Container Padding: p-5 (20px)
Gap between icon & content: gap-4
Gap between buttons: gap-2
Icon size: w-10 h-10
Icon inner size: w-5 h-5 (for ArrowDownTrayIcon)
Button padding: px-5 py-2.5
Dismiss button padding: px-3 py-2.5
```

## Accessibility Features

- **Color Contrast**: Gold on dark navy meets WCAG AA standards
- **Touch Targets**: Buttons are 44px+ tall (mobile recommendation)
- **Icon Labels**: title="Dismiss" on close button
- **Readable Font**: sans-serif, minimum 12px equivalent
- **Focus States**: Active states provide visual feedback
- **Semantic HTML**: Proper button elements

## Browser Compatibility

- ✅ Chrome/Chromium 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 15+
- ✅ Mobile browsers (iOS Safari 15+, Chrome Android)

## Performance Considerations

- Minimal animations for 60fps performance
- No heavy 3D transforms (using simple translate/scale)
- GPU acceleration via will-change (implicit)
- Efficient gradient usage (CSS gradients, not image-based)
- No unnecessary blur filters on large areas

## Customization Guide

### Change Primary Color (Navy Blue)
Replace `slate-900`, `blue-950`, `slate-800` with your color

### Change Accent Color (Gold)
Replace all `amber-400`, `amber-300`, `amber-500` with your color

### Adjust Glow Intensity
Modify opacity values: `amber-400/20` → `amber-400/30` (more glow)

### Change Animation Speed
Modify duration in animate-in: `duration-500` → `duration-300` (faster)

### Modify Border Style
Change `border-2 border-amber-400/40` to adjust border thickness/color

## Light/Dark Mode Support

Currently optimized for dark mode (matches app theme).

For light mode alternative:
- Swap `slate-900` ↔ `slate-100`
- Swap `text-slate-300` ↔ `text-slate-700`
- Adjust shadow intensity
- Adjust border opacity

## Visual Hierarchy

1. **Title + Icon**: Primary focus (bright gold gradient)
2. **Description**: Secondary information (light gray)
3. **CTA Button**: Clear action point (bright gold, prominent)
4. **Dismiss Button**: Secondary action (subdued gray)
5. **Decorative Elements**: Accents and glows (supporting)

## Premium Touches

✨ Glowing backgrounds with blur
✨ Gradient text for title
✨ Animated shimmer on buttons
✨ Accent dots for visual interest
✨ Top accent line animation
✨ Inset box-shadow for depth
✨ Smooth transitions and animations
✨ Professional icon selection

## Design Philosophy

The prompt embodies:
- **Sophistication**: Dark navy + gold is premium
- **Futuristic**: Glow effects and gradients feel modern
- **Appeal**: Eye-catching without being overwhelming
- **Trust**: Professional color scheme builds confidence
- **Clarity**: Clear typography and strong hierarchy
- **Interaction**: Smooth animations provide feedback
