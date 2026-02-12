# Order Count Badges Implementation

## Overview
Successfully implemented order count badges across the menu system. The badges display the total number of orders for menu items, categories, and menus, providing valuable insights into popular items.

## Features Implemented

### 1. Order Count API (`src/lib/api.ts`)
- Added `getMenuItemOrderCounts(businessId)` function
- Fetches order counts from `order_items` table joined with `orders`
- Aggregates quantities by menu item ID
- Returns a dictionary mapping item IDs to their total order counts

### 2. Menu Item Badges (`src/components/MenuItemCard.tsx`)
- Added `orderCount` prop to MenuItemCard component
- Displays badge in top-left corner showing "X Orders" or "X Order"
- Badge appears on both image and non-image item cards
- Styled with white background and theme color text
- Only shows when order count > 0

### 3. Category Badges (`src/components/menu-flow/MenuTabsView.tsx`)
- Added `getCategoryOrderCount()` helper function
- Calculates total orders for all items in a category
- Badge displays in bottom-right corner of category cards
- Shows "X Orders" or "X Order" with theme color
- Appears in both search results and default category grid
- Only shows when category has orders

### 4. Menu Tab Counts
- Added `getMenuOrderCount()` helper function
- Calculates total orders for all categories in a menu
- Can be extended to show on menu tabs if needed

### 5. Data Flow
```
MenuPage (fetches order counts)
  ↓
MenuList (passes order counts)
  ↓
MenuTabsView (calculates category/menu totals)
  ↓
ItemsGrid (passes to individual items)
  ↓
MenuItemCard (displays badge)
```

## Badge Styling

### Menu Items
- **Position**: Top-right corner
- **Background**: White with 95% opacity
- **Text Color**: Theme color
- **Font**: Bold, extra small (text-xs)
- **Format**: "6 Orders" or "1 Order"

### Categories
- **Position**: Top-right corner (overlaid on image)
- **Background**: White with 95% opacity and backdrop blur
- **Text Color**: Theme color
- **Font**: Bold, extra small (text-xs)
- **Format**: "6 Orders" or "1 Order"

## Database Query
The order counts are fetched using:
```sql
SELECT 
  menu_item_id,
  quantity,
  orders.business_id
FROM order_items
INNER JOIN orders ON order_items.order_id = orders.id
WHERE orders.business_id = ?
```

Then aggregated in JavaScript to sum quantities per item.

## Performance Considerations
- Order counts are fetched once when MenuPage loads
- Counts are passed down through props (no re-fetching)
- Calculations for categories/menus are memoized in useMemo hooks
- Badges only render when count > 0 (conditional rendering)

## User Experience
- Badges help customers identify popular items
- Provides social proof for menu choices
- Non-intrusive design that doesn't clutter the UI
- Consistent styling across all menu levels

## Future Enhancements
- Add time-based filtering (orders this week/month)
- Show trending indicators for rapidly growing items
- Add tooltips with more detailed statistics
- Cache order counts with periodic refresh
- Add order count sorting option
