-- Fixed version of submit_menu_order_with_transfer that works around the payment_method constraint
-- This uses 'cash' as the payment method in the database but tracks transfer via transfer_code

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
  v_db_payment_method TEXT;
BEGIN
  -- WORKAROUND: Use 'cash' as payment method in database to avoid constraint error
  -- The actual payment method is tracked via transfer_code presence
  v_db_payment_method := CASE 
    WHEN p_payment_method = 'transfer' THEN 'cash'
    ELSE p_payment_method
  END;

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
    v_db_payment_method, -- Use workaround payment method
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
    'payment_method', p_payment_method -- Return the original payment method
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_menu_order_with_transfer TO authenticated;