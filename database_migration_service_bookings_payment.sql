-- Migration to add payment fields to service_bookings table
-- This should be run on the Supabase database

-- Add new columns to service_bookings table
ALTER TABLE public.service_bookings 
ADD COLUMN IF NOT EXISTS transfer_code TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'failed')),
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index on transfer_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_bookings_transfer_code 
ON public.service_bookings (transfer_code);

-- Create index on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_service_bookings_payment_status 
ON public.service_bookings (payment_status);

-- Update existing bookings to have pending payment status
UPDATE public.service_bookings 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Create or replace the enhanced booking submission function
CREATE OR REPLACE FUNCTION public.submit_service_booking_with_payment(
  p_business_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_service_type TEXT,
  p_event_date TIMESTAMP WITH TIME ZONE,
  p_number_of_participants INTEGER,
  p_total_amount DECIMAL,
  p_transfer_code TEXT,
  p_service_details JSONB,
  p_customer_email TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Insert the service booking
  INSERT INTO public.service_bookings (
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
    payment_status
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
    'pending'
  )
  RETURNING id INTO v_booking_id;

  -- Return the booking ID and transfer code
  RETURN json_build_object(
    'booking_id', v_booking_id,
    'transfer_code', p_transfer_code
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_service_booking_with_payment TO authenticated;

-- Create function to get booking by transfer code (for business app)
CREATE OR REPLACE FUNCTION public.get_booking_by_transfer_code(
  p_transfer_code TEXT,
  p_business_id UUID
)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  service_type TEXT,
  status TEXT,
  booking_date TIMESTAMP WITH TIME ZONE,
  event_date TIMESTAMP WITH TIME ZONE,
  number_of_participants INTEGER,
  total_amount DECIMAL,
  service_details JSONB,
  transfer_code TEXT,
  payment_status TEXT,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sb.id,
    sb.customer_name,
    sb.customer_phone,
    sb.customer_email,
    sb.service_type,
    sb.status,
    sb.booking_date,
    sb.event_date,
    sb.number_of_participants,
    sb.total_amount,
    sb.service_details,
    sb.transfer_code,
    sb.payment_status,
    sb.payment_confirmed_at,
    sb.created_at,
    sb.updated_at
  FROM public.service_bookings sb
  WHERE sb.transfer_code = p_transfer_code 
    AND sb.business_id = p_business_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_booking_by_transfer_code TO authenticated;

-- Add comment to document the changes
COMMENT ON COLUMN public.service_bookings.transfer_code IS 'Unique 6-digit code for payment identification';
COMMENT ON COLUMN public.service_bookings.payment_status IS 'Payment status: pending, confirmed, or failed';
COMMENT ON COLUMN public.service_bookings.payment_confirmed_at IS 'Timestamp when payment was confirmed';