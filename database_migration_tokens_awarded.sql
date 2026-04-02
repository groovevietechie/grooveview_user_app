-- Add tokens_awarded flag to orders table to prevent double-awarding
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tokens_awarded BOOLEAN DEFAULT FALSE;

-- Index for efficient lookup of un-awarded served orders
CREATE INDEX IF NOT EXISTS idx_orders_tokens_awarded ON orders (tokens_awarded) WHERE tokens_awarded = FALSE;
