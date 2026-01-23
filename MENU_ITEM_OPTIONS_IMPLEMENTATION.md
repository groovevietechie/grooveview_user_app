# Menu Item Options Implementation

## Overview
The menu item options functionality has been implemented in the customer app to allow users to customize their menu items with various options (like size, toppings, etc.) before adding them to cart.

## Database Structure
Since both the business and customer apps use the same database, the menu item options tables are already available:

### `menu_item_option_categories`
- Groups options into categories (e.g., "Size", "Toppings", "Extras")
- Each category belongs to a menu item
- Can be required or optional
- Can allow single or multiple selections

### `menu_item_options`
- Individual options within a category
- Each option has a name and optional price
- Can be marked as available/unavailable

## Implementation Details

### 1. API Integration
The customer app's API (`src/lib/api.ts`) fetches menu items with their option categories and options using nested queries:

```typescript
.select(`
  *,
  option_categories:menu_item_option_categories(
    *,
    options:menu_item_options(*)
  )
`)
```

### 2. UI Components

#### MenuItemCard
- Shows a gear icon for items with options
- Displays "Customize Options" button when quantity > 0 and item has options
- Handles required vs optional options
- Shows validation messages for required options

#### MenuItemOptionsModal
- Full-screen modal for selecting options
- Grouped by categories with clear labels
- Shows required/optional indicators
- Calculates total price including option prices
- Validates required selections before allowing add to cart

### 3. Cart Integration
The cart store handles:
- Selected options with each cart item
- Total calculation including option prices
- Differentiation of cart items with different option selections
- Option details for order submission

## User Flow

1. **Browse Items**: User sees items with gear icon indicating customizable options
2. **Select Quantity**: User increases quantity to > 0
3. **Customize Options**: "Customize Options" button appears below "Add to Cart"
4. **Select Options**: Modal opens showing all option categories and choices
5. **Validate**: Required options must be selected before proceeding
6. **Add to Cart**: Item added with selected options and calculated total price
7. **Order**: Options are included in order submission with proper pricing

## Key Features

### Visual Indicators
- Gear icon on items with options
- Required option indicators (red asterisk)
- Option pricing display
- Total price calculation

### Validation
- Required option categories must have at least one selection
- Clear error messages for missing required options
- Disabled "Add to Cart" until requirements met

### Pricing
- Base item price + option prices
- Individual option pricing displayed
- Total calculated automatically
- Quantity multiplier applied to total

### Flexibility
- Single or multiple selection per category
- Optional vs required categories
- Custom option names and prices
- Display order control

## Testing

To test the functionality:

1. Add option categories and options to menu items in the business app
2. Visit the customer app and navigate to items with options
3. Verify the "Customize Options" button appears when quantity > 0
4. Test the option selection modal and pricing calculations
5. Confirm items are added to cart with correct options and pricing

## Business App Integration

The business app has the UI for managing menu item options:
- Create/edit option categories for menu items
- Add/remove individual options with pricing
- Set required/optional and single/multiple selection rules
- Manage display order and availability

The customer app automatically reflects any changes made in the business app since they share the same database.