# Database Migration Fix

## 🐛 Issue Encountered

**Error**: `ERROR: 42P13: input parameters after one with a default value must also have defaults`

## 🔍 Root Cause

In PostgreSQL function definitions, once a parameter has a default value, all subsequent parameters must also have default values. The original function definition had this parameter order:

```sql
-- INCORRECT ORDER
CREATE OR REPLACE FUNCTION public.submit_menu_order_with_transfer(
  p_business_id UUID,
  p_seat_label TEXT,
  p_customer_note TEXT,
  p_payment_method TEXT,
  p_total_amount DECIMAL,
  p_order_type TEXT,
  p_customer_phone TEXT DEFAULT NULL,    -- Has default
  p_delivery_address TEXT DEFAULT NULL,  -- Has default
  p_order_items JSONB                    -- ❌ No default after parameters with defaults
)
```

## ✅ Solution Applied

Moved all parameters with default values to the end of the parameter list:

```sql
-- CORRECT ORDER
CREATE OR REPLACE FUNCTION public.submit_menu_order_with_transfer(
  p_business_id UUID,
  p_seat_label TEXT,
  p_customer_note TEXT,
  p_payment_method TEXT,
  p_total_amount DECIMAL,
  p_order_type TEXT,
  p_order_items JSONB,                   -- ✅ Required parameter before defaults
  p_customer_phone TEXT DEFAULT NULL,    -- Default parameter
  p_delivery_address TEXT DEFAULT NULL   -- Default parameter
)
```

## 📁 Files Updated

1. **`database_migration_menu_orders_enhancement.sql`** - Original file fixed
2. **`database_migration_menu_orders_enhancement_fixed.sql`** - Clean fixed version

## 🔧 API Compatibility

The API code doesn't need changes because it uses named parameters (object notation) in the RPC call:

```typescript
const { data: result, error } = await supabase
  .rpc("submit_menu_order_with_transfer", {
    p_business_id: orderData.businessId,
    p_seat_label: orderData.seatLabel,
    p_customer_note: cleanCustomerNote || null,
    p_payment_method: orderData.paymentMethod,
    p_total_amount: totalAmount,
    p_order_type: orderType,
    p_order_items: orderData.items.map(item => ({...})),
    p_customer_phone: customerPhone,
    p_delivery_address: orderData.deliveryAddress || null,
  })
```

Named parameters work regardless of the order in the function definition.

## 🚀 Next Steps

1. Use the fixed migration script: `database_migration_menu_orders_enhancement_fixed.sql`
2. Or apply the corrected original file: `database_migration_menu_orders_enhancement.sql`
3. Both files now have the correct parameter ordering

## ✅ Verification

The migration should now run successfully without the parameter ordering error.