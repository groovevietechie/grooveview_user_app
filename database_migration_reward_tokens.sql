-- Add reward tokens to customer profiles
-- 1 token = 1 Naira
-- Customers earn 2% of order total as tokens for completed orders

-- Add reward_tokens column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS reward_tokens DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment to explain the column
COMMENT ON COLUMN customers.reward_tokens IS 'Reward tokens earned from completed orders. 1 token = 1 Naira. Customers earn 2% of order total.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_reward_tokens ON customers(reward_tokens);

-- Create a function to calculate and award tokens for completed orders
CREATE OR REPLACE FUNCTION award_order_tokens()
RETURNS TRIGGER AS $$
DECLARE
  token_amount DECIMAL(10, 2);
BEGIN
  -- Only award tokens when order status changes to 'served' (completed)
  -- and payment status is 'paid'
  IF NEW.status = 'served' 
     AND NEW.payment_status = 'paid' 
     AND (OLD.status IS NULL OR OLD.status != 'served')
     AND NEW.customer_id IS NOT NULL THEN
    
    -- Calculate 2% of order total
    token_amount := NEW.total_amount * 0.02;
    
    -- Add tokens to customer account
    UPDATE customers
    SET reward_tokens = reward_tokens + token_amount
    WHERE id = NEW.customer_id;
    
    -- Log the token award
    RAISE NOTICE 'Awarded % tokens to customer % for order %', token_amount, NEW.customer_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically award tokens when orders are completed
DROP TRIGGER IF EXISTS trigger_award_order_tokens ON orders;
CREATE TRIGGER trigger_award_order_tokens
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION award_order_tokens();

-- Create a function to deduct tokens when used for payment
CREATE OR REPLACE FUNCTION deduct_customer_tokens(
  p_customer_id UUID,
  p_token_amount DECIMAL(10, 2)
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL(10, 2);
BEGIN
  -- Get current token balance
  SELECT reward_tokens INTO current_balance
  FROM customers
  WHERE id = p_customer_id;
  
  -- Check if customer has enough tokens
  IF current_balance IS NULL OR current_balance < p_token_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct tokens
  UPDATE customers
  SET reward_tokens = reward_tokens - p_token_amount
  WHERE id = p_customer_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add token_payment_amount column to orders table to track token usage
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS token_payment_amount DECIMAL(10, 2) DEFAULT 0.00;

COMMENT ON COLUMN orders.token_payment_amount IS 'Amount paid using reward tokens (1 token = 1 Naira)';

-- Create index for token payment tracking
CREATE INDEX IF NOT EXISTS idx_orders_token_payment ON orders(token_payment_amount) WHERE token_payment_amount > 0;
