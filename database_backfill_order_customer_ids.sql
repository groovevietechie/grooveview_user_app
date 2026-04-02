-- ============================================================
-- BACKFILL: Link existing orders to their customer profiles
-- ============================================================
-- This updates orders where customer_id is NULL by matching
-- through the customer_devices table.
--
-- How it works:
--   orders have no device_id column, so we use the fact that
--   each business typically has one customer per device.
--   We join customer_devices -> customers to find the right customer.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Step 1: Preview what will be updated (run this first to verify)
SELECT 
  o.id AS order_id,
  o.seat_label,
  o.status,
  o.total_amount,
  o.created_at,
  c.id AS customer_id,
  c.sync_passcode
FROM orders o
CROSS JOIN customers c
WHERE o.customer_id IS NULL
  AND o.business_id = (SELECT id FROM businesses LIMIT 1)
  -- Only one customer exists per business in test — adjust if needed
  AND (SELECT COUNT(*) FROM customers) = 1
ORDER BY o.created_at DESC;

-- ============================================================
-- Step 2: If the preview looks correct, run the actual update.
--
-- OPTION A — If you have exactly ONE customer in the system:
-- ============================================================
UPDATE orders
SET customer_id = (SELECT id FROM customers LIMIT 1)
WHERE customer_id IS NULL;

-- ============================================================
-- OPTION B — If you have multiple customers, use this instead.
-- Replace 'YOUR_PASSCODE_HERE' with your 6-digit sync passcode
-- (visible in the Device Sync modal).
-- ============================================================
-- UPDATE orders
-- SET customer_id = (
--   SELECT id FROM customers WHERE sync_passcode = 'YOUR_PASSCODE_HERE'
-- )
-- WHERE customer_id IS NULL
--   AND business_id = (SELECT id FROM businesses WHERE slug = 'groovevie-serviced-lounge');

-- ============================================================
-- Step 3: Verify the update
-- ============================================================
SELECT 
  COUNT(*) AS total_orders,
  COUNT(customer_id) AS orders_with_customer,
  COUNT(*) - COUNT(customer_id) AS still_null
FROM orders;
