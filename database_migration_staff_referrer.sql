-- Migration: Add staff referrer commission tracking for service bookings
-- This migration adds support for tracking staff referrers who bring in service bookings

-- Add referrer_staff_id column to service_bookings table
ALTER TABLE service_bookings
ADD COLUMN IF NOT EXISTS referrer_staff_id UUID REFERENCES business_staff(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_bookings_referrer_staff_id 
ON service_bookings(referrer_staff_id);

-- Add comment to document the column
COMMENT ON COLUMN service_bookings.referrer_staff_id IS 'References the staff member who referred this booking for commission tracking';

-- Update the submit_service_booking_with_payment function to include referrer_staff_id
CREATE OR REPLACE FUNCTION submit_service_booking_with_payment(
  p_business_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_service_type TEXT,
  p_event_date TIMESTAMP WITH TIME ZONE,
  p_number_of_participants INTEGER,
  p_total_amount NUMERIC,
  p_transfer_code TEXT,
  p_service_details JSONB,
  p_customer_email TEXT DEFAULT NULL,
  p_referrer_staff_id UUID DEFAULT NULL
)
RETURNS TABLE(booking_id UUID, transfer_code TEXT) AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Insert the service booking with referrer information
  INSERT INTO service_bookings (
    business_id,
    customer_name,
    customer_phone,
    customer_email,
    service_type,
    status,
    booking_date,
    event_date,
    number_of_participants,
    total_amount,
    service_details,
    transfer_code,
    payment_status,
    referrer_staff_id
  ) VALUES (
    p_business_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_service_type,
    'pending',
    NOW(),
    p_event_date,
    p_number_of_participants,
    p_total_amount,
    p_service_details,
    p_transfer_code,
    'pending',
    p_referrer_staff_id
  )
  RETURNING id INTO v_booking_id;

  -- Return the booking ID and transfer code
  RETURN QUERY SELECT v_booking_id, p_transfer_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the fallback submit_service_booking function to include referrer_staff_id
CREATE OR REPLACE FUNCTION submit_service_booking(
  p_business_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_service_type TEXT,
  p_event_date TIMESTAMP WITH TIME ZONE,
  p_number_of_participants INTEGER,
  p_total_amount NUMERIC,
  p_service_details JSONB,
  p_customer_email TEXT DEFAULT NULL,
  p_referrer_staff_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Insert the service booking with referrer information
  INSERT INTO service_bookings (
    business_id,
    customer_name,
    customer_phone,
    customer_email,
    service_type,
    status,
    booking_date,
    event_date,
    number_of_participants,
    total_amount,
    service_details,
    referrer_staff_id
  ) VALUES (
    p_business_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_service_type,
    'pending',
    NOW(),
    p_event_date,
    p_number_of_participants,
    p_total_amount,
    p_service_details,
    p_referrer_staff_id
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION submit_service_booking_with_payment TO authenticated, anon;
GRANT EXECUTE ON FUNCTION submit_service_booking TO authenticated, anon;
