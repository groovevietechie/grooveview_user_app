-- ============================================================
-- FIX: Token award system
-- 
-- Problem: orders.customer_id references auth.users, NOT public.customers.
-- The existing trigger tries to UPDATE customers WHERE id = NEW.customer_id
-- but that UUID comes from auth.users — it will never match public.customers.
--
-- Solution: Add a device_id column to orders so we can join to
-- customer_devices -> customers. Then fix the trigger to use that path.
-- ============================================================

-- Step 1: Add device_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS device_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_orders_device_id ON orders(device_id);

-- Step 2: Replace the broken trigger function with one that
-- looks up the customer via customer_devices using device_id
CREATE OR REPLACE FUNCTION award_order_tokens()
RETURNS TRIGGER AS $$
DECLARE
  token_amount DECIMAL(10, 2);
  v_customer_id UUID;
BEGIN
  -- Only fire when status transitions to 'served'
  IF NEW.status = 'served'
     AND (OLD.status IS DISTINCT FROM 'served')
     AND NEW.tokens_awarded = FALSE THEN

    -- Find the customer via device_id -> customer_devices -> customers
    IF NEW.device_id IS NOT NULL THEN
      SELECT cd.customer_id INTO v_customer_id
      FROM customer_devices cd
      WHERE cd.device_id = NEW.device_id
      LIMIT 1;
    END IF;

    IF v_customer_id IS NOT NULL THEN
      token_amount := ROUND(NEW.total_amount * 0.02, 2);

      UPDATE customers
      SET reward_tokens = reward_tokens + token_amount
      WHERE id = v_customer_id;

      -- Mark as awarded to prevent double-awarding
      NEW.tokens_awarded := TRUE;

      RAISE NOTICE 'Awarded % tokens to customer % for order %', token_amount, v_customer_id, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger as BEFORE UPDATE so NEW can be modified
DROP TRIGGER IF EXISTS trigger_award_order_tokens ON orders;
CREATE TRIGGER trigger_award_order_tokens
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION award_order_tokens();

-- ============================================================
-- Step 4: Backfill device_id for existing orders
-- This sets device_id on all existing orders using the single
-- device registered in customer_devices for this business.
-- (Safe to run if you only have one device/customer in testing)
-- ============================================================
UPDATE orders o
SET device_id = cd.device_id
FROM customer_devices cd
WHERE o.device_id IS NULL
  AND cd.customer_id = (SELECT customer_id FROM customer_devices LIMIT 1);

-- ============================================================
-- Step 5: Verify
-- ============================================================
SELECT 
  o.id,
  o.seat_label,
  o.status,
  o.tokens_awarded,
  o.device_id,
  cd.customer_id,
  c.reward_tokens
FROM orders o
LEFT JOIN customer_devices cd ON cd.device_id = o.device_id
LEFT JOIN customers c ON c.id = cd.customer_id
ORDER BY o.created_at DESC
LIMIT 20;
