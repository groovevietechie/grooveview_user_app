# Menu Item Options Setup Guide

## Issue Identified
The menu item options functionality was not working because the customer app lacked read access to the `menu_item_option_categories` and `menu_item_options` tables due to Row Level Security (RLS) policies.

## Database Structure
The menu item options system uses this relationship:
```
menu_items (id) → menu_item_option_categories (item_id) → menu_item_options (category_id)
```

## Solution Applied

### 1. Fixed API Queries
Updated the customer app API to use the correct table names and relationships:

**Before:**
```typescript
option_categories:menu_item_option_categories(
  *,
  options:menu_item_options(*)
)
```

**After:**
```typescript
menu_item_option_categories (
  id, item_id, name, description, is_required, allow_multiple, display_order,
  created_at, updated_at,
  menu_item_options (
    id, category_id, name, price, is_available, display_order,
    created_at, updated_at
  )
)
```

### 2. Data Processing
The API now correctly maps the fetched data:
- `item.menu_item_option_categories` → `item.option_categories`
- Sorts categories and options by `display_order`
- Filters out unavailable options

### 3. Database Access (REQUIRED)
**You must run this SQL on your Supabase database:**

```sql
-- Enable RLS if not already enabled
ALTER TABLE menu_item_option_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_options ENABLE ROW LEVEL SECURITY;

-- Add public read policies for customer app access
CREATE POLICY "Public can view menu item option categories" ON menu_item_option_categories
    FOR SELECT USING (true);

CREATE POLICY "Public can view menu item options" ON menu_item_options
    FOR SELECT USING (true);
```

**Or run the provided SQL file:**
```bash
# Execute the SQL file in your Supabase SQL editor
cat add_public_access_menu_options.sql
```

## Testing Steps

### 1. Verify Database Setup
1. Run the SQL commands above in your Supabase SQL editor
2. Verify the policies were created:
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('menu_item_option_categories', 'menu_item_options');
   ```

### 2. Add Options in Business App
1. Open the business app
2. Navigate to a menu item
3. Add option categories (e.g., "Size", "Toppings")
4. Add options within each category with prices
5. Set some categories as required/optional
6. Save the changes

### 3. Test in Customer App
1. Open the customer app
2. Navigate to the menu item with options
3. Increase quantity to > 0
4. Verify "Customize Options" button appears
5. Click the button and test option selection
6. Verify pricing calculations include option prices
7. Add to cart and verify options are preserved

## Expected Behavior

### Visual Indicators
- ⚙️ Gear icon on items with options
- "Customize Options" button when quantity > 0
- Required option indicators (red asterisk)
- Option pricing display

### Functionality
- Modal opens with categorized options
- Single/multiple selection per category
- Required option validation
- Price calculation (base + options) × quantity
- Cart integration with option details

## Troubleshooting

### Options Not Showing
1. **Check database policies**: Ensure public read policies are applied
2. **Verify data exists**: Check if options are actually created in business app
3. **Check console**: Look for API errors in browser developer tools

### API Errors
- **403 Forbidden**: RLS policies not applied correctly
- **Empty results**: No options created for the menu items
- **Network errors**: Check Supabase connection

### UI Issues
- **Button not appearing**: Check `hasOptions` logic in MenuItemCard
- **Modal not opening**: Verify MenuItemOptionsModal import and usage
- **Pricing wrong**: Check option price calculation in modal and cart

## Files Modified

### Customer App
- `src/lib/api.ts` - Fixed query structure and data mapping
- `src/components/MenuItemCard.tsx` - Options detection and button display
- `src/components/MenuItemOptionsModal.tsx` - Already implemented correctly
- `src/store/cartStore.ts` - Already handles options correctly

### Database
- `add_public_access_menu_options.sql` - RLS policies for public access

## Next Steps

1. **Run the SQL commands** to enable public access
2. **Test with real data** by adding options in the business app
3. **Verify the complete flow** from browsing to cart to order
4. **Monitor for any edge cases** or additional requirements

The implementation is now complete and should work correctly once the database access is properly configured.