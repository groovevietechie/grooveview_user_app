-- Tracks one-time reward token redemption for menu orders.
-- total_amount remains the gross order value; token_payment_amount is the subsidy.

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tokens_redeemed BOOLEAN DEFAULT FALSE;

UPDATE orders
SET tokens_redeemed = FALSE
WHERE tokens_redeemed IS NULL;

COMMENT ON COLUMN orders.token_payment_amount IS 'Amount of the order subsidized with customer reward tokens.';
COMMENT ON COLUMN orders.tokens_redeemed IS 'True after token_payment_amount has been deducted from the customer reward balance.';
