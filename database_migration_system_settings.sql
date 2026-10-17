-- System Settings Table
-- Stores global application settings like cashback token percentage

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  data_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description, data_type) 
VALUES 
  ('cashback_token_percentage', '2', 'Percentage of order total awarded as cashback tokens (e.g., 2 means 2%)', 'number')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Enable real-time subscriptions on system_settings table
ALTER TABLE system_settings REPLICA IDENTITY FULL;

-- RLS Policy (optional - adjust based on your security model)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings (optional)
CREATE POLICY "Allow public read" ON system_settings
  FOR SELECT USING (true);

-- Allow authenticated admin to update (adjust based on your auth model)
CREATE POLICY "Allow authenticated update" ON system_settings
  FOR UPDATE USING (auth.role() = 'authenticated');
