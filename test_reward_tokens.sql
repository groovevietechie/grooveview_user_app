-- Test Script for Reward Tokens System
-- Run these queries to test the reward tokens functionality

-- ============================================
-- 1. SETUP: Check if migration was successful
-- ============================================

-- Check customers table has reward_tokens column
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'reward_tokens';

-- Check orders table has token_payment_amount column
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'token_payment_amount';

-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_award_order_tokens';

-- Check if functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('award_order_tokens', 'deduct_customer_tokens');

-- ============================================
-- 2. TEST: Token Earning
-- ============================================

-- Find a customer with orders
SELECT c.id as customer_id, c.sync_passcode, c.reward_tokens, COUNT(o.id) as order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id
LIMIT 5;

-- Check current token balance for a specific customer
-- Replace 'YOUR_CUSTOMER_ID' with actual customer ID
SELECT id, sync_passcode, reward_tokens, created_at
FROM customers 
WHERE id = 'YOUR_CUSTOMER_ID';

-- Find orders for this customer
SELECT id, total_amount, status, payment_status, token_payment_amount, created_at
FROM orders 
WHERE customer_id = 'YOUR_CUSTOMER_ID'
ORDER BY created_at DESC;

-- Simulate completing an order to award tokens
-- Replace 'YOUR_ORDER_ID' with actual order ID
-- This should trigger the token award (2% of total_amount)
UPDATE orders 
SET status = 'served', payment_status = 'paid'
WHERE id = 'YOUR_ORDER_ID' AND customer_id IS NOT NULL;

-- Verify tokens were awarded
SELECT id, sync_passcode, reward_tokens
FROM customers 
WHERE id = 'YOUR_CUSTOMER_ID';

-- ============================================
-- 3. TEST: Token Usage
-- ============================================

-- Check if customer has enough tokens
SELECT id, reward_tokens
FROM customers 
WHERE id = 'YOUR_CUSTOMER_ID' AND reward_tokens > 0;

-- Test deducting tokens (using the function)
-- Replace values with actual customer_id and amount
SELECT deduct_customer_tokens('YOUR_CUSTOMER_ID'::uuid, 50.00);

-- Verify tokens were deducted
SELECT id, reward_tokens
FROM customers 
WHERE id = 'YOUR_CUSTOMER_ID';

-- ============================================
-- 4. ANALYTICS: Token Statistics
-- ============================================

-- Total tokens in the system
SELECT 
  COUNT(*) as total_customers,
  SUM(reward_tokens) as total_tokens_available,
  AVG(reward_tokens) as avg_tokens_per_customer,
  MAX(reward_tokens) as highest_balance,
  MIN(reward_tokens) as lowest_balance
FROM customers
WHERE reward_tokens > 0;

-- Total tokens used for payments
SELECT 
  COUNT(*) as orders_with_tokens,
  SUM(token_payment_amount) as total_tokens_used,
  AVG(token_payment_amount) as avg_tokens_per_order,
  MAX(token_payment_amount) as max_tokens_used
FROM orders
WHERE token_payment_amount > 0;

-- Token usage by payment method
SELECT 
  payment_method,
  COUNT(*) as order_count,
  SUM(token_payment_amount) as total_tokens_used,
  AVG(token_payment_amount) as avg_tokens_used
FROM orders
WHERE token_payment_amount > 0
GROUP BY payment_method
ORDER BY total_tokens_used DESC;

-- Customers with highest token balances
SELECT 
  c.id,
  c.sync_passcode,
  c.reward_tokens,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_spent,
  SUM(o.token_payment_amount) as tokens_used
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE c.reward_tokens > 0
GROUP BY c.id, c.sync_passcode, c.reward_tokens
ORDER BY c.reward_tokens DESC
LIMIT 10;

-- Recent token transactions (orders with token payments)
SELECT 
  o.id as order_id,
  o.customer_id,
  c.sync_passcode,
  o.total_amount,
  o.token_payment_amount,
  o.payment_method,
  o.status,
  o.created_at
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.token_payment_amount > 0
ORDER BY o.created_at DESC
LIMIT 20;

-- ============================================
-- 5. MAINTENANCE: Cleanup & Reset (USE WITH CAUTION!)
-- ============================================

-- Reset all customer token balances to 0 (CAUTION!)
-- Uncomment to use:
-- UPDATE customers SET reward_tokens = 0;

-- Remove token payments from all orders (CAUTION!)
-- Uncomment to use:
-- UPDATE orders SET token_payment_amount = 0;

-- Delete the trigger (if you need to remove it)
-- Uncomment to use:
-- DROP TRIGGER IF EXISTS trigger_award_order_tokens ON orders;

-- Delete the functions (if you need to remove them)
-- Uncomment to use:
-- DROP FUNCTION IF EXISTS award_order_tokens();
-- DROP FUNCTION IF EXISTS deduct_customer_tokens(uuid, decimal);

-- ============================================
-- 6. MONITORING: Check for Issues
-- ============================================

-- Find orders that should have awarded tokens but didn't
SELECT 
  o.id,
  o.customer_id,
  o.total_amount,
  o.status,
  o.payment_status,
  c.reward_tokens,
  o.created_at
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'served' 
  AND o.payment_status = 'paid'
  AND o.customer_id IS NOT NULL
  AND o.created_at > NOW() - INTERVAL '7 days'
ORDER BY o.created_at DESC;

-- Find customers with negative token balances (should not happen)
SELECT id, sync_passcode, reward_tokens
FROM customers
WHERE reward_tokens < 0;

-- Find orders where token payment exceeds total amount (should not happen)
SELECT id, total_amount, token_payment_amount, payment_method
FROM orders
WHERE token_payment_amount > total_amount;

-- ============================================
-- 7. REPORTING: Business Insights
-- ============================================

-- Token earning rate by business
SELECT 
  b.name as business_name,
  COUNT(DISTINCT o.customer_id) as unique_customers,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_revenue,
  SUM(o.total_amount * 0.02) as tokens_awarded,
  SUM(o.token_payment_amount) as tokens_redeemed
FROM orders o
JOIN businesses b ON b.id = o.business_id
WHERE o.status = 'served' AND o.payment_status = 'paid'
GROUP BY b.id, b.name
ORDER BY total_revenue DESC;

-- Customer loyalty metrics
SELECT 
  c.id,
  c.sync_passcode,
  c.reward_tokens as current_balance,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as lifetime_value,
  SUM(o.total_amount * 0.02) as total_tokens_earned,
  SUM(o.token_payment_amount) as total_tokens_used,
  (SUM(o.total_amount * 0.02) - SUM(o.token_payment_amount)) as calculated_balance
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'served' AND o.payment_status = 'paid'
GROUP BY c.id, c.sync_passcode, c.reward_tokens
HAVING COUNT(o.id) > 0
ORDER BY lifetime_value DESC
LIMIT 20;

-- Token redemption rate
SELECT 
  COUNT(DISTINCT CASE WHEN token_payment_amount > 0 THEN customer_id END) as customers_using_tokens,
  COUNT(DISTINCT customer_id) as total_customers_with_orders,
  ROUND(
    COUNT(DISTINCT CASE WHEN token_payment_amount > 0 THEN customer_id END)::numeric / 
    NULLIF(COUNT(DISTINCT customer_id), 0) * 100, 
    2
  ) as redemption_rate_percentage
FROM orders
WHERE customer_id IS NOT NULL;

-- ============================================
-- END OF TEST SCRIPT
-- ============================================

-- Notes:
-- 1. Replace 'YOUR_CUSTOMER_ID' and 'YOUR_ORDER_ID' with actual IDs
-- 2. Run sections individually to test specific functionality
-- 3. Use CAUTION with cleanup queries (section 5)
-- 4. Monitor the analytics queries regularly for insights
