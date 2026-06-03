-- Link customer-app orders to customer profiles without overloading orders.customer_id.
-- Also track lifetime reward token spending for audit/display.

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_profile_id UUID REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_profile_id ON orders(customer_profile_id);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS reward_tokens_used NUMERIC DEFAULT 0;

UPDATE customers
SET reward_tokens_used = 0
WHERE reward_tokens_used IS NULL;

COMMENT ON COLUMN orders.customer_profile_id IS 'Customer profile that placed this order. Separate from auth/user customer_id.';
COMMENT ON COLUMN customers.reward_tokens_used IS 'Lifetime reward tokens spent by this customer.';
