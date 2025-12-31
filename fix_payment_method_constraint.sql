-- Fix payment method constraint to allow 'transfer'
-- This script updates the check constraint on the orders table to allow 'transfer' as a valid payment method

-- First, let's see what the current constraint allows
-- DROP the existing constraint if it exists
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Add the updated constraint that includes 'transfer'
ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('cash', 'card', 'transfer', 'pos'));

-- Also ensure payment_status allows the values we need
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'confirmed'));

-- Add comment to document the change
COMMENT ON CONSTRAINT orders_payment_method_check ON public.orders IS 'Allows cash, card, transfer, and pos payment methods';
COMMENT ON CONSTRAINT orders_payment_status_check ON public.orders IS 'Allows pending, paid, failed, cancelled, and confirmed payment statuses';