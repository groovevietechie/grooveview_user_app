-- Customer Profile & Device Sync Migration
-- This migration adds customer profile tracking and multi-device sync capabilities

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table: stores customer profiles with sync passcodes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_passcode VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer devices table: links devices to customer profiles
CREATE TABLE IF NOT EXISTS customer_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  device_fingerprint TEXT,
  device_name VARCHAR(255),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer activities table: tracks all customer activities
CREATE TABLE IF NOT EXISTS customer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  business_id UUID REFERENCES businesses(id),
  activity_type VARCHAR(50) NOT NULL, -- 'order', 'booking', 'view', 'cart'
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add customer_id to existing orders table (nullable for backward compatibility)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Add customer_id to existing service_bookings table (nullable for backward compatibility)
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_sync_passcode ON customers(sync_passcode);
CREATE INDEX IF NOT EXISTS idx_customer_devices_customer_id ON customer_devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_devices_device_id ON customer_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_device_id ON customer_activities(device_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_business_id ON customer_activities(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_customer_id ON service_bookings(customer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on customers table
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE customers IS 'Customer profiles with sync passcodes for multi-device access';
COMMENT ON TABLE customer_devices IS 'Devices linked to customer profiles';
COMMENT ON TABLE customer_activities IS 'Tracks all customer activities across devices';
COMMENT ON COLUMN orders.customer_id IS 'Links order to customer profile for multi-device sync';
COMMENT ON COLUMN service_bookings.customer_id IS 'Links booking to customer profile for multi-device sync';
