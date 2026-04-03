-- ============================================================
-- Migration: Waiters Profiles & Tips
-- ============================================================

-- 1. Waiters table (managed from groovevie-software)
CREATE TABLE IF NOT EXISTS waiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  profile_image_url TEXT,
  is_available_today BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waiters_business_id ON waiters(business_id);
CREATE INDEX IF NOT EXISTS idx_waiters_available ON waiters(business_id, is_available_today) WHERE is_active = true;

-- 2. Add waiter_id to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES waiters(id) ON DELETE SET NULL;

-- 3. Tips table
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  waiter_id UUID NOT NULL REFERENCES waiters(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'transfer',
  transfer_code TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_confirmed_at TIMESTAMPTZ,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  compliments TEXT[] DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tips_order_id ON tips(order_id);
CREATE INDEX IF NOT EXISTS idx_tips_waiter_id ON tips(waiter_id);
CREATE INDEX IF NOT EXISTS idx_tips_business_id ON tips(business_id);

-- 4. RLS Policies
ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Waiters: public read for active/available
CREATE POLICY "Public can view available waiters" ON waiters
  FOR SELECT USING (is_active = true);

-- Tips: anyone can insert
CREATE POLICY "Anyone can create a tip" ON tips
  FOR INSERT WITH CHECK (true);

-- Tips: public read own tips by order
CREATE POLICY "Public can view tips by order" ON tips
  FOR SELECT USING (true);

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_waiters_updated_at ON waiters;
CREATE TRIGGER update_waiters_updated_at
  BEFORE UPDATE ON waiters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tips_updated_at ON tips;
CREATE TRIGGER update_tips_updated_at
  BEFORE UPDATE ON tips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
