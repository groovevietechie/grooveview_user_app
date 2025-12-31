-- Basic migration to add essential transfer payment support
-- This adds only the minimum required columns for transfer payments to work

-- Add transfer_code column for transfer payment identification
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS transfer_code TEXT;

-- Add order_type column for order categorization
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'table' CHECK (order_type IN ('table', 'room', 'home'));

-- Add customer_phone column for delivery orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add delivery_address column for home delivery (if not exists)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add payment_confirmed_at for tracking payment confirmation
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_transfer_code 
ON public.orders (transfer_code);

CREATE INDEX IF NOT EXISTS idx_orders_order_type 
ON public.orders (order_type);

-- Update existing orders to have proper order_type based on seat_label
UPDATE public.orders 
SET order_type = CASE 
  WHEN seat_label ILIKE 'table%' THEN 'table'
  WHEN seat_label ILIKE 'room%' THEN 'room'
  WHEN seat_label ILIKE 'home%' OR seat_label = 'Home Delivery' THEN 'home'
  ELSE 'table'
END
WHERE order_type IS NULL OR order_type = 'table';

-- Add comments to document the new columns
COMMENT ON COLUMN public.orders.transfer_code IS 'Unique 6-digit code for transfer payment identification';
COMMENT ON COLUMN public.orders.customer_phone IS 'Customer phone number for delivery orders';
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: table, room, or home';
COMMENT ON COLUMN public.orders.payment_confirmed_at IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN public.orders.delivery_address IS 'Delivery address for home delivery orders';