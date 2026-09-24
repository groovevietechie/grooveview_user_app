# Groovevie Mobile Design Guide

## Layout Structure (Mobile-First)

### 1. Header Section
```
┌─────────────────────────────┐
│  [Logo] Groovevie | [☰] [👤]│
└─────────────────────────────┘
```
- Logo with gold border
- Navigation menu (hamburger on mobile)
- User profile icon

---

### 2. Hero Section
```
┌─────────────────────────────┐
│                             │
│    [Hero Image Background]  │
│    • Back 1.png (Drinks)    │
│    • Back 2.png (Food)      │
│    • Back 3.png (Services)  │
│                             │
│  ✨ WELCOME TO             │
│  Groovevie                 │
│  Serviced Lounge           │
│                             │
│  Good Drinks • Great Vibes  │
│  • Unforgettable Moments    │
│                             │
│  📍 3, Arowojobe Street...  │
│                             │
│  [🍸 Explore the menu →]    │
│                             │
│         ● ● ●               │ (dots for tab selection)
└─────────────────────────────┘
```
- Dynamic background image that changes with tab selection
- Gradient overlay for text readability
- Responsive height (350px on mobile)
- Interactive navigation dots

---

### 3. Category Tab Cards (NEW)
```
┌─────────────────────────────┐
│  ┌──────┬──────┬──────┐    │
│  │ 🍸   │ 🍽️   │ 🎬   │    │
│  │Drinks│ Food │Servs │    │
│  │13    │ 6    │      │    │
│  │Items │Items │Servs │    │
│  └──────┴──────┴──────┘    │
│  (Active Tab has Gold)      │
└─────────────────────────────┘
```
- Three equal-width buttons in grid layout
- Color-coded icons:
  - Drinks: Amber/Gold gradient
  - Food: Emerald/Green gradient
  - Services: Blue gradient
- Item counts displayed below title
- Active tab highlighted with gold gradient
- Hover effects for interactivity

---

### 4. Search Bar
```
┌─────────────────────────────┐
│  [🔍] Search for drinks... [☲] │
└─────────────────────────────┘
```
- Full-width search input
- Placeholder: "Search for drinks, food, or services..."
- Filter button on the right
- 60px minimum height
- Rounded corners (999px border-radius)

---

### 5. Menu Content Section
```
┌─────────────────────────────┐
│  🍸 Drinks Menu             │
│  Browse our delicious offerings │
│                             │
│  ┌─────────────┬─────────────┐
│  │ 27 Orders   │ 4 Orders   │
│  │ Tequila     │ Wine       │
│  │ Premium ... │ Red, White │
│  │ ₦4,500+     │ ₦6,000+    │
│  │[Order Now →]│[Order Now]│
│  ├─────────────┼─────────────┤
│  │ 15 Orders   │ 2 Orders   │
│  │ Whisky      │ Brandy     │
│  │ Smooth...   │ Bold taste │
│  │ ₦7,000+     │ ₦5,500+    │
│  │[Order Now →]│[Order Now]│
│  └─────────────┴─────────────┘
│                             │
│  Trust Strip:               │
│  ✓ Quality Drinks          │
│  ⚡ Fast Service           │
│  ❤️ Relaxed Vibes          │
└─────────────────────────────┘
```
- Responsive 2-column grid
- Product cards with images
- Order count badges
- Price display
- CTA buttons
- Trust/feature indicators at bottom

---

### 6. Bottom Navigation (Mobile)
```
┌─────────────────────────────┐
│             [Shopping Cart] │
│             (Fixed position)│
│             (Floating FAB)  │
│             +8 (item count) │
└─────────────────────────────┘
```
- Floating action button
- Shopping cart icon
- Item count badge
- Fixed at bottom-right
- Tappable on mobile

---

## Color Palette

### Primary Colors
- **Gold/Amber**: `#f6c945`, `#ffe461`, `#ffe98d`
  - Used for: Active states, highlights, CTAs
- **Dark Blue**: `#020812`, `#020a16`
  - Used for: Background, base color
- **Accent Blue**: `#2f8cff`
  - Used for: Secondary actions, accents

### Secondary Colors
- **Light Text**: `#edf5ff`, `#f2f7ff`
- **Muted Text**: `#aebed5`, `#aab8cb`
- **Border Colors**: Transparent blue with 0.2-0.42 opacity

### Gradient Backgrounds
- **Hero Overlay**: `linear-gradient(90deg, rgba(2, 8, 18, .98) 0%, ...)`
- **Tab Active**: `linear-gradient(135deg, rgba(130, 93, 9, .85), rgba(72, 48, 5, .8))`
- **Card Hover**: `linear-gradient(145deg, rgba(22, 51, 101, .78), rgba(5, 20, 44, .82))`

---

## Typography

### Headings
- **Hero Title**: `clamp(2rem, 5vw, 4rem)`, Bold (800), Gradient text
- **Section Title**: `1.25rem`, Bold (700)
- **Card Title**: `1rem`, Semibold (600)

### Body Text
- **Primary**: `0.98rem`, Regular (400), Light blue
- **Secondary**: `0.78rem`, Regular (400), Muted blue
- **Tab Label**: `0.9rem`, Bold (700)

---

## Spacing (Mobile-First)

### Padding
- Container: `3px` sides, `1rem` top/bottom
- Section: `1rem` internal
- Card: `1rem` padding
- Button: `0.75rem`

### Gaps
- Grid gaps: `0.75rem` (mobile), `1.5rem` (tablet+)
- Vertical spacing: `1.5rem` between sections

---

## Responsive Breakpoints

### Mobile (< 640px)
✅ Full implementation as shown above
- 3-column tab grid
- Single column menu
- Full-width search
- Optimized touch targets (min 44px)

### Tablet (640px - 1024px)
- 2-column menu grid with 1.5rem gap
- Larger category cards
- Side-by-side layout begins

### Desktop (> 1024px)
- Full experience
- 2-column menu on left, sidebar on right
- Smooth transitions
- Advanced filtering options

---

## Interactive States

### Tab Cards
- **Default**: Blue border, dark gradient background
- **Hover**: Lifted effect (-2px), brighter border
- **Active**: Gold border, golden gradient, enhanced shadow

### Buttons
- **Default**: Outlined style
- **Hover**: Color change, slight lift
- **Active**: Filled, enhanced shadow
- **Disabled**: Grayed out, no interactions

---

## Images

### Hero Images
Location: `/public/`

1. **back 1.png** - Drinks Section
   - Size: Optimized for web
   - Aspect Ratio: 16:9 recommended
   - Filter: `saturate(1.45) contrast(1.13)`

2. **Back 2.png** - Food Section
   - Size: Optimized for web
   - Aspect Ratio: 16:9 recommended
   - Filter: Same as above

3. **back 3.png** - Services Section
   - Size: Optimized for web
   - Aspect Ratio: 16:9 recommended
   - Filter: Same as above

### Image Usage
- Background images for hero section
- Display changes on tab click
- Smooth opacity transition (1.2s ease)
- 30% position offset for parallax effect

---

## Animation & Transitions

### Hero Carousel
- Tab change: Instant hero image swap
- Opacity transition: 1.2s ease
- Dot navigation: Smooth scale (1.3x on active)

### Tab Cards
- Hover: `transform: translateY(-2px)`, `transition: 0.25s ease`
- Active: Scale + shadow effects
- Color transitions: `0.25s ease`

### Dots Navigation
- Background transition: `0.25s ease`
- Transform transition: `0.25s ease`
- Smooth scaling: `1.3x` on active

---

## Accessibility Features

✅ **Semantic HTML**
- Proper heading hierarchy (h1, h2, h3)
- Button elements for interactions
- Image alt attributes

✅ **Keyboard Navigation**
- Tab key cycles through buttons
- Enter key activates buttons
- Arrow keys possible future enhancement

✅ **Screen Readers**
- ARIA labels on dots: `aria-label="Show slide X"`
- Descriptive button labels
- Color-independent info display

✅ **Visual Accessibility**
- High contrast text on dark backgrounds
- No information conveyed by color alone
- Sufficient button size (44px+ touch targets)

---

## Performance Considerations

✅ **Image Optimization**
- WebP format with fallbacks
- Lazy loading for below-fold content
- Responsive image sizing

✅ **CSS Optimization**
- Minimal repaints on hover
- GPU-accelerated transforms
- Efficient selectors

✅ **JavaScript Optimization**
- Minimal state changes
- Event delegation where possible
- Efficient carousel implementation

---

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers (iOS Safari 12+, Chrome Mobile)

---

## QA Testing Checklist

Mobile (< 640px):
- [ ] Hero images display correctly
- [ ] Tab switching works smoothly
- [ ] Category cards are clickable
- [ ] Search bar is full-width
- [ ] Cart button is accessible at bottom
- [ ] Text is readable (no overflow)
- [ ] Images load without distortion

Tablet (640px - 1024px):
- [ ] Layout adapts smoothly
- [ ] Spacing increases appropriately
- [ ] Cards maintain proportions
- [ ] No horizontal scroll

Desktop (> 1024px):
- [ ] Two-column layout active
- [ ] Sidebar visible
- [ ] Full feature set available
- [ ] Hover effects work

All Devices:
- [ ] Images load correctly
- [ ] Active states are clear
- [ ] Touch/click targets are responsive
- [ ] Performance is acceptable
- [ ] Accessibility features work
