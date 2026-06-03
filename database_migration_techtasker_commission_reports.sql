-- TechTasker Solutions monthly commission ledger.
-- Records each completed order once and computes 1% commission for reporting.

CREATE TABLE IF NOT EXISTS techtasker_commission_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_completed_at TIMESTAMPTZ NOT NULL,
  order_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.01,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_month DATE NOT NULL,
  order_status TEXT NOT NULL DEFAULT 'served',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_techtasker_commission_orders_month
  ON techtasker_commission_orders(report_month);

CREATE INDEX IF NOT EXISTS idx_techtasker_commission_orders_week
  ON techtasker_commission_orders(week_start, week_end);

CREATE INDEX IF NOT EXISTS idx_techtasker_commission_orders_business
  ON techtasker_commission_orders(business_id);

ALTER TABLE techtasker_commission_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to TechTasker commission orders"
  ON techtasker_commission_orders;

CREATE POLICY "Allow public read access to TechTasker commission orders"
  ON techtasker_commission_orders
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow database sync to manage TechTasker commission orders"
  ON techtasker_commission_orders;

CREATE POLICY "Allow database sync to manage TechTasker commission orders"
  ON techtasker_commission_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON techtasker_commission_orders TO anon, authenticated;

CREATE OR REPLACE FUNCTION sync_techtasker_commission_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $tt_commission$
DECLARE
  v_order RECORD;
  v_order_date TIMESTAMPTZ;
  v_week_start DATE;
BEGIN
  SELECT id, business_id, status, total_amount, created_at, updated_at
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_order.status <> 'served' THEN
    DELETE FROM techtasker_commission_orders WHERE order_id = p_order_id;
    RETURN;
  END IF;

  -- Reports are grouped by when the order was created, not when the status changed.
  v_order_date := COALESCE(v_order.created_at, v_order.updated_at, NOW());
  v_week_start := DATE_TRUNC('week', v_order_date AT TIME ZONE 'Africa/Lagos')::DATE;

  INSERT INTO techtasker_commission_orders (
    order_id,
    business_id,
    order_completed_at,
    order_amount,
    commission_rate,
    commission_amount,
    week_start,
    week_end,
    report_month,
    order_status,
    updated_at
  )
  VALUES (
    v_order.id,
    v_order.business_id,
    v_order_date,
    COALESCE(v_order.total_amount, 0),
    0.01,
    ROUND(COALESCE(v_order.total_amount, 0) * 0.01, 2),
    v_week_start,
    v_week_start + 6,
    DATE_TRUNC('month', v_order_date AT TIME ZONE 'Africa/Lagos')::DATE,
    v_order.status,
    NOW()
  )
  ON CONFLICT (order_id) DO UPDATE SET
    business_id = EXCLUDED.business_id,
    order_completed_at = EXCLUDED.order_completed_at,
    order_amount = EXCLUDED.order_amount,
    commission_rate = EXCLUDED.commission_rate,
    commission_amount = EXCLUDED.commission_amount,
    week_start = EXCLUDED.week_start,
    week_end = EXCLUDED.week_end,
    report_month = EXCLUDED.report_month,
    order_status = EXCLUDED.order_status,
    updated_at = NOW();
END;
$tt_commission$;

CREATE OR REPLACE FUNCTION sync_techtasker_commission_order_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $tt_commission_trigger$
BEGIN
  PERFORM sync_techtasker_commission_order(NEW.id);
  RETURN NEW;
END;
$tt_commission_trigger$;

DROP TRIGGER IF EXISTS trg_sync_techtasker_commission_order ON orders;
CREATE TRIGGER trg_sync_techtasker_commission_order
AFTER INSERT OR UPDATE OF status, total_amount, created_at
ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_techtasker_commission_order_trigger();

CREATE OR REPLACE VIEW techtasker_monthly_commission_summary AS
SELECT
  report_month,
  week_start,
  week_end,
  COUNT(*) AS completed_orders,
  SUM(order_amount) AS gross_order_amount,
  SUM(commission_amount) AS commission_amount
FROM techtasker_commission_orders
GROUP BY report_month, week_start, week_end
ORDER BY report_month DESC, week_start DESC;

GRANT SELECT ON techtasker_monthly_commission_summary TO anon, authenticated;

-- Backfill existing served orders.
DO $tt_backfill$
DECLARE
  served_order RECORD;
BEGIN
  FOR served_order IN SELECT id FROM orders WHERE status = 'served' LOOP
    PERFORM sync_techtasker_commission_order(served_order.id);
  END LOOP;
END;
$tt_backfill$;
