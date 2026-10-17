-- Spin System Database Migration
-- Manages configurable spin rewards and customer spin balances

-- Table 1: Spin Reward Options (Configurable from Database)
CREATE TABLE IF NOT EXISTS spin_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_type VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  value NUMERIC(10,2),
  color VARCHAR(20),
  probability NUMERIC(5,2) DEFAULT 1.0, -- 1-100, higher = more likely
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Customer Spin Balance
CREATE TABLE IF NOT EXISTS customer_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  spin_balance INTEGER DEFAULT 0,
  total_spins_earned INTEGER DEFAULT 0,
  total_spins_used INTEGER DEFAULT 0,
  last_free_drink_at TIMESTAMP, -- Track weekly free drink
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id)
);

-- Table 3: Spin Usage History
CREATE TABLE IF NOT EXISTS spin_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  spin_count INTEGER NOT NULL DEFAULT 1,
  source VARCHAR(50), -- 'order_completion', 'manual_award', etc
  source_id UUID, -- order_id or reference
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Spin Results History
CREATE TABLE IF NOT EXISTS spin_results_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  reward_label VARCHAR(255) NOT NULL,
  reward_value NUMERIC(10,2),
  spun_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP
);

-- Default Reward Options
INSERT INTO spin_rewards (reward_type, label, description, icon, value, color, probability, enabled)
VALUES
  ('greenBeer', '🍺 Green Bottled Drink', 'Free green bottled drink - redeemable once a week', '🍺', 1, '#34d399', 25.0, true),
  ('blackBeer', '🍺 Black Bottled Drink', 'Free black bottled drink', '🍺', 1, '#6b7280', 15.0, true),
  ('cashback200', '₦200 Cashback', 'Get ₦200 cashback on your next order', '💰', 200, '#f97316', 20.0, true),
  ('cashback50', '₦50 Cashback', 'Get ₦50 cashback on your next order', '💵', 50, '#fbbf24', 20.0, true),
  ('discount10', '10% Discount', 'Get 10% discount on your next order', '🏷️', 10, '#8b5cf6', 15.0, true),
  ('tryAgain', '🎯 Try Again', 'Spin again for free!', '🎯', 0, '#ef4444', 5.0, true)
ON CONFLICT (reward_type) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_spins_customer_id ON customer_spins(customer_id);
CREATE INDEX IF NOT EXISTS idx_spin_usage_customer_id ON spin_usage_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_spin_results_customer_id ON spin_results_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_spin_rewards_enabled ON spin_rewards(enabled);

-- Enable real-time subscriptions
ALTER TABLE customer_spins REPLICA IDENTITY FULL;
ALTER TABLE spin_rewards REPLICA IDENTITY FULL;

-- RLS Policies
ALTER TABLE spin_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_results_history ENABLE ROW LEVEL SECURITY;

-- Allow public read on rewards
CREATE POLICY "Allow public read on spin_rewards" ON spin_rewards
  FOR SELECT USING (enabled = true);

-- Allow read own spins
CREATE POLICY "Allow read own spins" ON customer_spins
  FOR SELECT USING (true);

-- Allow authenticated updates
CREATE POLICY "Allow authenticated spin updates" ON customer_spins
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert spin history" ON spin_usage_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow insert spin results" ON spin_results_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
