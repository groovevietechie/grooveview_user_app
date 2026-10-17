-- Spin Cooldown System Migration
-- Adds weekly cooldown tracking for green drink rewards

-- Add columns to spin_results_history table for tracking cooldown
ALTER TABLE spin_results_history
ADD COLUMN IF NOT EXISTS cooldown_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cooldown_ends_at TIMESTAMP;

-- Create index for efficient cooldown queries
CREATE INDEX IF NOT EXISTS idx_spin_results_cooldown ON spin_results_history(customer_id, reward_type, cooldown_ends_at)
WHERE cooldown_active = true;

-- Add comment documenting the cooldown logic
COMMENT ON COLUMN spin_results_history.cooldown_active IS 'TRUE if this green drink reward is under weekly cooldown';
COMMENT ON COLUMN spin_results_history.cooldown_ends_at IS 'ISO timestamp when cooldown expires (7 days from redemption)';
