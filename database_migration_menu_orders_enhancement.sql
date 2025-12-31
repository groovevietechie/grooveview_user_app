-- Migration to enhance menu orders for new checkout flow
-- This should be run on the Supabase database

-- Add new columns to orders table for enhanced checkout flow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS transfer_code TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'table' CHECK (order_type IN ('table', 'room', 'home')),
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_transfer_code 
ON public.orders (transfer_code);

CREATE INDEX IF NOT EXISTS idx_orders_order_type 
ON public.orders (order_type);

CREATE INDEX IF NOT EXISTS idx_orders_payment_method 
ON public.orders (payment_method);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON public.orders (payment_status);

-- Update existing orders to have proper order_type based on seat_label
UPDATE public.orders 
SET order_type = CASE 
  WHEN seat_label ILIKE 'table%' THEN 'table'
  WHEN seat_label ILIKE 'room%' THEN 'room'
  WHEN seat_label ILIKE 'home%' OR seat_label = 'Home Delivery' THEN 'home'
  ELSE 'table'
END
WHERE order_type IS NULL OR order_type = 'table';

-- Create or replace function to submit menu order with transfer payment
-- FIXED: Parameters with defaults moved to the end
CREATE OR REPLACE FUNCTION public.submit_menu_order_with_transfer(
  p_business_id UUID,
  p_seat_label TEXT,
  p_customer_note TEXT,
  p_payment_method TEXT,
  p_total_amount DECIMAL,
  p_order_type TEXT,
  p_order_items JSONB,
  p_customer_phone TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_transfer_code TEXT;
  v_item JSONB;
BEGIN
  -- Generate transfer code if payment method is transfer
  IF p_payment_method = 'transfer' THEN
    v_transfer_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;

  -- Insert the order
  INSERT INTO public.orders (
    business_id,
    seat_label,
    customer_note,
    status,
    payment_method,
    payment_status,
    total_amount,
    order_type,
    customer_phone,
    delivery_address,
    transfer_code
  ) VALUES (
    p_business_id,
    p_seat_label,
    p_customer_note,
    'new',
    p_payment_method,
    CASE WHEN p_payment_method = 'transfer' THEN 'pending' ELSE 'pending' END,
    p_total_amount,
    p_order_type,
    p_customer_phone,
    p_delivery_address,
    v_transfer_code
  )
  RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      quantity,
      unit_price,
      item_note
    ) VALUES (
      v_order_id,
      (v_item->>'menuItemId')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unitPrice')::DECIMAL,
      v_item->>'note'
    );
  END LOOP;

  -- Return order details
  RETURN json_build_object(
    'order_id', v_order_id,
    'transfer_code', v_transfer_code,
    'payment_method', p_payment_method
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_menu_order_with_transfer TO authenticated;

-- Create function to confirm menu order payment
CREATE OR REPLACE FUNCTION public.confirm_menu_order_payment(
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update order payment status
  UPDATE public.orders 
  SET 
    payment_status = 'paid',
    payment_confirmed_at = NOW(),
    status = CASE WHEN status = 'new' THEN 'accepted' ELSE status END
  WHERE id = p_order_id;

  -- Return success if row was updated
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.confirm_menu_order_payment TO authenticated;

-- Create function to get order by transfer code (for business app)
CREATE OR REPLACE FUNCTION public.get_menu_order_by_transfer_code(
  p_transfer_code TEXT,
  p_business_id UUID
)
RETURNS TABLE (
  id UUID,
  business_id UUID,
  seat_label TEXT,
  customer_note TEXT,
  status TEXT,
  payment_method TEXT,
  payment_status TEXT,
  total_amount DECIMAL,
  order_type TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  transfer_code TEXT,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.business_id,
    o.seat_label,
    o.customer_note,
    o.status,
    o.payment_method,
    o.payment_status,
    o.total_amount,
    o.order_type,
    o.customer_phone,
    o.delivery_address,
    o.transfer_code,
    o.payment_confirmed_at,
    o.created_at,
    o.updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'item_note', oi.item_note,
          'menu_item_name', mi.name,
          'menu_item_price', mi.price
        )
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::jsonb
    ) as items
  FROM public.orders o
  LEFT JOIN public.order_items oi ON o.id = oi.order_id
  LEFT JOIN public.menu_items mi ON oi.menu_item_id = mi.id
  WHERE o.transfer_code = p_transfer_code 
    AND o.business_id = p_business_id
  GROUP BY o.id, o.business_id, o.seat_label, o.customer_note, o.status, 
           o.payment_method, o.payment_status, o.total_amount, o.order_type,
           o.customer_phone, o.delivery_address, o.transfer_code, 
           o.payment_confirmed_at, o.created_at, o.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_menu_order_by_transfer_code TO authenticated;

-- Create enhanced order details view for better querying
CREATE OR REPLACE VIEW public.order_details_enhanced AS
SELECT 
  o.id,
  o.business_id,
  o.seat_label,
  o.customer_note,
  o.status,
  o.payment_method,
  o.payment_status,
  o.total_amount,
  o.order_type,
  o.customer_phone,
  o.delivery_address,
  o.transfer_code,
  o.payment_confirmed_at,
  o.estimated_ready_time,
  o.estimated_delivery_time,
  o.business_comment,
  o.created_at,
  o.updated_at,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'menu_item_id', oi.menu_item_id,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'item_note', oi.item_note,
        'menu_item_name', mi.name,
        'menu_item_description', mi.description,
        'menu_item_price', mi.price,
        'total_price', oi.quantity * oi.unit_price
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'::jsonb
  ) as items,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_quantity
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.menu_items mi ON oi.menu_item_id = mi.id
GROUP BY o.id, o.business_id, o.seat_label, o.customer_note, o.status, 
         o.payment_method, o.payment_status, o.total_amount, o.order_type,
         o.customer_phone, o.delivery_address, o.transfer_code, 
         o.payment_confirmed_at, o.estimated_ready_time, o.estimated_delivery_time,
         o.business_comment, o.created_at, o.updated_at;

-- Create trigger to auto-generate transfer codes for transfer payments
CREATE OR REPLACE FUNCTION public.auto_generate_transfer_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate transfer code if payment method is transfer and code is not set
  IF NEW.payment_method = 'transfer' AND (NEW.transfer_code IS NULL OR NEW.transfer_code = '') THEN
    NEW.transfer_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating transfer codes
DROP TRIGGER IF EXISTS trigger_auto_generate_transfer_code ON public.orders;
CREATE TRIGGER trigger_auto_generate_transfer_code
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_transfer_code();

-- Update RLS policies if they exist (optional, depends on your security setup)
-- Enable RLS on orders table if not already enabled
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policy for businesses to access their own orders
-- CREATE POLICY "Businesses can access their own orders" ON public.orders
--   FOR ALL USING (auth.uid() IN (
--     SELECT owner_id FROM public.businesses WHERE id = business_id
--   ));

-- Add comments to document the new columns
COMMENT ON COLUMN public.orders.transfer_code IS 'Unique 6-digit code for transfer payment identification';
COMMENT ON COLUMN public.orders.customer_phone IS 'Customer phone number for delivery orders';
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: table, room, or home';
COMMENT ON COLUMN public.orders.payment_confirmed_at IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN public.orders.delivery_address IS 'Delivery address for home delivery orders';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_business_order_type 
ON public.orders (business_id, order_type);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_method 
ON public.orders (payment_status, payment_method);

CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc 
ON public.orders (created_at DESC);

-- Update any existing orders with missing data
UPDATE public.orders 
SET 
  order_type = CASE 
    WHEN seat_label ILIKE 'table%' THEN 'table'
    WHEN seat_label ILIKE 'room%' THEN 'room'
    WHEN seat_label ILIKE 'home%' OR seat_label = 'Home Delivery' THEN 'home'
    ELSE 'table'
  END
WHERE order_type IS NULL;

-- Ensure all transfer orders have transfer codes
UPDATE public.orders 
SET transfer_code = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE payment_method = 'transfer' 
  AND (transfer_code IS NULL OR transfer_code = '');

-- Create function to get order statistics by type
CREATE OR REPLACE FUNCTION public.get_order_statistics(
  p_business_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  order_type TEXT,
  payment_method TEXT,
  total_orders BIGINT,
  total_amount DECIMAL,
  avg_amount DECIMAL,
  pending_payments BIGINT,
  confirmed_payments BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.order_type,
    o.payment_method,
    COUNT(*) as total_orders,
    SUM(o.total_amount) as total_amount,
    AVG(o.total_amount) as avg_amount,
    COUNT(*) FILTER (WHERE o.payment_status = 'pending') as pending_payments,
    COUNT(*) FILTER (WHERE o.payment_status = 'paid') as confirmed_payments
  FROM public.orders o
  WHERE o.business_id = p_business_id
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  GROUP BY o.order_type, o.payment_method
  ORDER BY o.order_type, o.payment_method;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_order_statistics TO authenticated;