# Sample Service Data for Testing

This file contains sample SQL commands that businesses can use to populate their service configurations and options for testing the customer app service functionality.

## Sample Service Configurations

```sql
-- Insert Room Booking service configuration
INSERT INTO service_configurations (
    business_id, 
    service_type, 
    title, 
    description, 
    is_active, 
    pricing_structure, 
    available_options
) VALUES (
    '<your-business-id>', 
    'roomBooking', 
    'Private Room Booking', 
    'Book our luxurious private rooms for intimate gatherings', 
    true, 
    '{"base_price": 5000, "hourly_rate": 1000}', 
    ARRAY['VIP Room', 'Standard Room', 'Party Room']
);

-- Insert Party Booking service configuration
INSERT INTO service_configurations (
    business_id, 
    service_type, 
    title, 
    description, 
    is_active, 
    pricing_structure, 
    available_options
) VALUES (
    '<your-business-id>', 
    'partyBooking', 
    'Complete Party Package', 
    'Full-service party planning with all amenities included', 
    true, 
    '{"base_price": 15000, "per_person": 500}', 
    ARRAY['Drinks', 'Food', 'Entertainment', 'Decorations']
);
```

## Sample Service Options

### Room Options
```sql
INSERT INTO service_options (business_id, name, category, price, is_active, description) VALUES
('<your-business-id>', 'VIP Room', 'Rooms', 10000, true, 'Luxury VIP room with premium amenities'),
('<your-business-id>', 'Standard Room', 'Rooms', 5000, true, 'Comfortable standard room for small groups'),
('<your-business-id>', 'Party Room', 'Rooms', 15000, true, 'Large party room perfect for celebrations');
```

### Drink Options
```sql
INSERT INTO service_options (business_id, name, category, price, is_active, description) VALUES
('<your-business-id>', 'Premium Whiskey', 'Drinks', 8000, true, 'Top-shelf whiskey selection'),
('<your-business-id>', 'House Wine', 'Drinks', 3000, true, 'Quality house wine selection'),
('<your-business-id>', 'Craft Beer', 'Drinks', 1500, true, 'Local craft beer varieties'),
('<your-business-id>', 'Signature Cocktails', 'Drinks', 2500, true, 'Our bartender special cocktails'),
('<your-business-id>', 'Premium Gin', 'Drinks', 6000, true, 'Premium gin brands'),
('<your-business-id>', 'Cognac Selection', 'Drinks', 12000, true, 'Fine cognac collection');
```

### Food Options
```sql
INSERT INTO service_options (business_id, name, category, price, is_active, description) VALUES
('<your-business-id>', 'Appetizer Platter', 'Food', 4000, true, 'Mixed appetizer selection'),
('<your-business-id>', 'Main Course Buffet', 'Food', 8000, true, 'Full buffet with multiple main courses'),
('<your-business-id>', 'Dessert Selection', 'Food', 2500, true, 'Variety of desserts'),
('<your-business-id>', 'Canapé Service', 'Food', 3500, true, 'Elegant canapé selection');
```

### Entertainment Options
```sql
INSERT INTO service_options (business_id, name, category, price, is_active, description) VALUES
('<your-business-id>', 'Professional DJ', 'DJ Services', 25000, true, '4-hour professional DJ service'),
('<your-business-id>', 'Live Band', 'Performers', 50000, true, '3-piece live band performance'),
('<your-business-id>', 'Solo Singer', 'Performers', 15000, true, 'Professional solo vocalist'),
('<your-business-id>', 'Dance Performance', 'Performers', 20000, true, 'Professional dance entertainment');
```

### Shisha Options
```sql
INSERT INTO service_options (business_id, name, category, price, is_active, description) VALUES
('<your-business-id>', 'Apple Mint Shisha', 'Shisha', 2000, true, 'Refreshing apple mint flavor'),
('<your-business-id>', 'Double Apple Shisha', 'Shisha', 2000, true, 'Classic double apple flavor'),
('<your-business-id>', 'Grape Shisha', 'Shisha', 2000, true, 'Sweet grape flavor'),
('<your-business-id>', 'Mixed Fruit Shisha', 'Shisha', 2500, true, 'Exotic mixed fruit blend');
```

### Accessories
```sql
INSERT INTO service_options (business_id, name, category, price, is_active, description) VALUES
('<your-business-id>', 'Party Balloons', 'Accessories', 500, true, 'Colorful party balloon decoration'),
('<your-business-id>', 'Face Masks', 'Accessories', 300, true, 'Fun party face masks'),
('<your-business-id>', 'Photo Props', 'Accessories', 800, true, 'Party photo booth props'),
('<your-business-id>', 'Table Decorations', 'Accessories', 1200, true, 'Elegant table decoration setup');
```

### Branded Wears
```sql
INSERT INTO service_options (business_id, name, category, price, is_active, description) VALUES
('<your-business-id>', 'Custom T-Shirts', 'Branded Wears', 1500, true, 'Custom branded t-shirts'),
('<your-business-id>', 'Party Hats', 'Branded Wears', 400, true, 'Branded party hats'),
('<your-business-id>', 'Custom Hoodies', 'Branded Wears', 3000, true, 'Premium branded hoodies');
```

## How to Use This Data

1. **Replace Business ID**: Replace `<your-business-id>` with your actual business UUID
2. **Run in Supabase**: Execute these SQL commands in your Supabase SQL editor
3. **Customize Prices**: Adjust prices according to your business model
4. **Add More Options**: Create additional service options as needed
5. **Test in Customer App**: Visit your customer app and test the service booking flow

## Verification Queries

After inserting the data, verify it was created correctly:

```sql
-- Check service configurations
SELECT * FROM service_configurations WHERE business_id = '<your-business-id>';

-- Check service options by category
SELECT category, COUNT(*), AVG(price) as avg_price 
FROM service_options 
WHERE business_id = '<your-business-id>' 
GROUP BY category;

-- Check all active service options
SELECT name, category, price, description 
FROM service_options 
WHERE business_id = '<your-business-id>' AND is_active = true 
ORDER BY category, price;
```

## Notes

- All prices are in cents (multiply by 100 for dollar amounts)
- Categories must match the predefined list in the database constraints
- Service configurations should be unique per business and service type
- Make sure your business has the necessary permissions to insert this data
- Test the customer app after inserting data to ensure everything works correctly