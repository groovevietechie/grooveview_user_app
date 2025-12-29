# Testing Guide for Database Integration

## Overview

This guide provides comprehensive testing procedures for the fully database-driven GrooveVie customer app, including menu display, service booking, and image handling.

## Pre-Testing Setup

### 1. Database Requirements

Ensure your Supabase database has:

**Business Data:**
```sql
-- Verify business exists with theme color
SELECT id, name, theme_color_hex, logo_url FROM businesses WHERE slug = 'your-business-slug';
```

**Menu Structure:**
```sql
-- Check menus with images
SELECT id, name, description, image_url, is_active FROM menus WHERE business_id = 'your-business-id';

-- Check categories with images
SELECT id, name, description, image_url FROM menu_categories WHERE menu_id IN (
  SELECT id FROM menus WHERE business_id = 'your-business-id'
);

-- Check items with images and pricing
SELECT id, name, description, price, image_url, is_available FROM menu_items WHERE category_id IN (
  SELECT id FROM menu_categories WHERE menu_id IN (
    SELECT id FROM menus WHERE business_id = 'your-business-id'
  )
);
```

**Service Configuration:**
```sql
-- Check service configurations
SELECT * FROM service_configurations WHERE business_id = 'your-business-id' AND is_active = true;

-- Check service options
SELECT * FROM service_options WHERE business_id = 'your-business-id' AND is_active = true;
```

### 2. Image Storage Setup

Verify Supabase Storage buckets exist and are publicly accessible:
- `menu-images/`
- `category-images/`
- `menu-items/`
- `business-logos/`

## Testing Scenarios

### 1. Main Category Selection Testing

#### Test Case 1.1: Database-Driven Categories Display
**Objective:** Verify categories section shows actual menu categories from database

**Steps:**
1. Navigate to the customer app
2. Observe the "Categories" section below Food/Drinks/Services
3. Verify categories display actual names from database
4. Check category images load correctly
5. Verify category descriptions appear

**Expected Results:**
- Categories show real data from `menu_categories` table
- Images load from `category.image_url` field
- Fallback colors appear when images fail
- Category names and descriptions match database

#### Test Case 1.2: Menu Image Integration
**Objective:** Verify Food/Drinks categories show representative menu images

**Steps:**
1. Check Food category displays image from food-related menu
2. Check Drinks category displays image from drinks-related menu
3. Verify fallback behavior when no menu images exist

**Expected Results:**
- Food category shows image from menu with food-related keywords
- Drinks category shows image from menu with drink-related keywords
- Fallback letters (F, D, S) appear when no images available

#### Test Case 1.3: Category Click Navigation
**Objective:** Test direct navigation from category cards to items

**Steps:**
1. Click on a category card in the categories section
2. Verify navigation jumps directly to that category's items
3. Test back navigation works correctly

**Expected Results:**
- Clicking category navigates to items grid
- Items shown match the selected category
- Back button returns to main category selection

### 2. Menu Filtering Testing

#### Test Case 2.1: Smart Menu Categorization
**Objective:** Verify menus are correctly filtered by Food/Drinks keywords

**Test Data Setup:**
```sql
-- Create test menus with different names
INSERT INTO menus (business_id, name, description) VALUES
('your-business-id', 'Food Menu', 'Delicious meals and dishes'),
('your-business-id', 'Drinks & Cocktails', 'Refreshing beverages and alcohol'),
('your-business-id', 'General Menu', 'Mixed items');
```

**Steps:**
1. Click "Food" main category
2. Verify only food-related menus appear
3. Click "Drinks" main category
4. Verify only drink-related menus appear
5. Test with menus that don't match keywords

**Expected Results:**
- Food category shows menus with food keywords
- Drinks category shows menus with drink keywords
- Fallback shows all menus if no matches found

#### Test Case 2.2: Keyword Matching Logic
**Objective:** Test keyword matching in menu names and descriptions

**Test Keywords:**
- Food: "food", "meal", "eat", "dish", "cuisine", "restaurant", "kitchen", "dining"
- Drinks: "drink", "beverage", "cocktail", "beer", "wine", "bar", "alcohol", "spirits", "juice"

**Steps:**
1. Create menus with various keyword combinations
2. Test filtering behavior for each keyword
3. Verify case-insensitive matching
4. Test partial word matching

### 3. Image Loading Testing

#### Test Case 3.1: Image Error Handling
**Objective:** Test graceful handling of broken image URLs

**Steps:**
1. Update a menu with invalid image URL
2. Navigate to the menu display
3. Verify fallback behavior
4. Check console for errors

**Expected Results:**
- No broken image icons displayed
- Fallback UI appears (colored background with letter)
- No JavaScript errors in console
- User experience remains smooth

#### Test Case 3.2: Image Loading Performance
**Objective:** Test image loading optimization

**Steps:**
1. Open browser developer tools
2. Navigate through different menu sections
3. Monitor network requests for images
4. Check loading times and optimization

**Expected Results:**
- Images load progressively
- Lazy loading works for off-screen images
- Optimized image sizes requested
- No duplicate image requests

### 4. Search Functionality Testing

#### Test Case 4.1: Category Search
**Objective:** Test search across menu categories

**Steps:**
1. Enter search term in main category search box
2. Verify categories filter correctly
3. Test partial matches
4. Test case-insensitive search
5. Test search clearing

**Expected Results:**
- Categories filter based on name and description
- Partial matches work correctly
- Search is case-insensitive
- Clear search shows all categories

#### Test Case 4.2: Cross-Content Search
**Objective:** Test search across menus, categories, and items

**Steps:**
1. Search for menu names
2. Search for category names
3. Search for item names
4. Test with no results

**Expected Results:**
- Search works across all content types
- Relevant results appear
- "No results" state displays appropriately

### 5. Service Integration Testing

#### Test Case 5.1: Service Configuration Loading
**Objective:** Test service booking system integration

**Steps:**
1. Click "Services" main category
2. Verify service types load from database
3. Test service options display
4. Complete a test booking

**Expected Results:**
- Service configurations load correctly
- Service options display with images and pricing
- Booking form works properly
- Booking submission succeeds

### 6. Error Handling Testing

#### Test Case 6.1: Network Error Handling
**Objective:** Test behavior when database is unavailable

**Steps:**
1. Simulate network disconnection
2. Navigate through the app
3. Verify error boundaries work
4. Test retry functionality

**Expected Results:**
- Error boundaries catch failures
- User-friendly error messages display
- Retry buttons work correctly
- App doesn't crash

#### Test Case 6.2: Empty Data Handling
**Objective:** Test behavior with empty database

**Steps:**
1. Test with business that has no menus
2. Test with menus that have no categories
3. Test with categories that have no items

**Expected Results:**
- Empty states display appropriately
- No JavaScript errors occur
- User can still navigate
- Helpful messages guide user

### 7. Performance Testing

#### Test Case 7.1: Loading Performance
**Objective:** Measure app loading performance

**Steps:**
1. Clear browser cache
2. Navigate to customer app
3. Measure time to first contentful paint
4. Measure time to interactive

**Expected Results:**
- Initial load under 3 seconds
- Images load progressively
- No layout shifts during loading
- Smooth animations and transitions

#### Test Case 7.2: Memory Usage
**Objective:** Test memory efficiency

**Steps:**
1. Navigate through all sections multiple times
2. Monitor memory usage in dev tools
3. Check for memory leaks
4. Test with large datasets

**Expected Results:**
- Memory usage remains stable
- No significant memory leaks
- Efficient image caching
- Smooth performance with large menus

## Automated Testing

### Unit Tests
```typescript
// Example test for menu filtering
describe('Menu Filtering', () => {
  test('filters menus by food keywords', () => {
    const menus = [
      { name: 'Food Menu', description: 'Delicious meals' },
      { name: 'Drinks Menu', description: 'Refreshing beverages' }
    ]
    
    const filtered = getFilteredMenus(menus, 'food')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('Food Menu')
  })
})
```

### Integration Tests
```typescript
// Example test for database integration
describe('Database Integration', () => {
  test('loads menu data correctly', async () => {
    const businessId = 'test-business-id'
    const menuData = await getFullMenu(businessId)
    
    expect(menuData.menus).toBeDefined()
    expect(menuData.categories).toBeDefined()
    expect(menuData.items).toBeDefined()
  })
})
```

## Browser Compatibility Testing

Test on the following browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Accessibility Testing

### Test Cases:
1. Keyboard navigation through all components
2. Screen reader compatibility
3. Color contrast ratios
4. Focus indicators
5. Alt text for images

## Performance Benchmarks

### Target Metrics:
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 3s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## Troubleshooting Common Issues

### Issue: Categories not displaying
**Solution:** Check menu_categories table has data and valid menu_id references

### Issue: Images not loading
**Solution:** Verify Supabase Storage bucket permissions and CORS settings

### Issue: Menu filtering not working
**Solution:** Check menu names/descriptions contain expected keywords

### Issue: Service booking fails
**Solution:** Verify service_configurations and service_options tables have data

## Test Data Setup Scripts

### Sample Menu Data
```sql
-- Insert sample menus
INSERT INTO menus (business_id, name, description, image_url, is_active) VALUES
('your-business-id', 'Main Food Menu', 'Our delicious food offerings', 'https://example.com/food-menu.jpg', true),
('your-business-id', 'Drinks & Cocktails', 'Refreshing beverages and cocktails', 'https://example.com/drinks-menu.jpg', true);

-- Insert sample categories
INSERT INTO menu_categories (menu_id, name, description, image_url) VALUES
('food-menu-id', 'Appetizers', 'Start your meal right', 'https://example.com/appetizers.jpg'),
('food-menu-id', 'Main Courses', 'Hearty main dishes', 'https://example.com/mains.jpg'),
('drinks-menu-id', 'Cocktails', 'Signature cocktails', 'https://example.com/cocktails.jpg');
```

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors (if any)
5. Network requests (if relevant)
6. Database state (if relevant)

## Success Criteria

The database integration is successful when:
- ✅ All menu data loads from database
- ✅ Images display correctly with fallbacks
- ✅ Category navigation works smoothly
- ✅ Search functionality works across all content
- ✅ Service booking integrates properly
- ✅ Error handling is robust
- ✅ Performance meets benchmarks
- ✅ Accessibility standards are met