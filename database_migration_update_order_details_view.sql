-- ============================================================
-- Migration: Add waiter info to order_details_with_options view
-- ============================================================
-- PostgreSQL requires DROP + CREATE when adding new columns to a view
-- (CREATE OR REPLACE only works when column list stays the same or appends at end)

DROP VIEW IF EXISTS order_details_with_options;

CREATE VIEW order_details_with_options AS
SELECT
    o.id as order_id,
    o.business_id,
    o.customer_id,
    o.seat_label,
    o.customer_note,
    o.status,
    o.payment_method,
    o.payment_status,
    o.total_amount,
    o.estimated_ready_time,
    o.estimated_delivery_time,
    o.business_comment,
    o.created_at as order_created_at,
    o.updated_at as order_updated_at,
    json_agg(
        json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'menu_item_name', mi.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'item_note', oi.item_note,
            'subtotal', oi.unit_price * oi.quantity::numeric,
            'selected_options', COALESCE(option_details.options, '[]'::json),
            'total_with_options', calculate_order_item_total(oi.id)
        ) ORDER BY oi.created_at
    ) as items,
    o.waiter_id,
    w.name as waiter_name
FROM orders o
LEFT JOIN waiters w ON o.waiter_id = w.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
LEFT JOIN (
    SELECT
        oio.order_item_id,
        json_agg(
            json_build_object(
                'id', oio.id,
                'option_id', oio.option_id,
                'option_name', oio.option_name,
                'option_price', oio.option_price
            ) ORDER BY oio.created_at
        ) as options
    FROM order_item_options oio
    GROUP BY oio.order_item_id
) option_details ON oi.id = option_details.order_item_id
GROUP BY
    o.id, o.business_id, o.customer_id, o.seat_label, o.customer_note,
    o.status, o.payment_method, o.payment_status, o.total_amount,
    o.estimated_ready_time, o.estimated_delivery_time, o.business_comment,
    o.created_at, o.updated_at, o.waiter_id, w.name;

GRANT SELECT ON order_details_with_options TO authenticated;
GRANT SELECT ON order_details_with_options TO anon;
