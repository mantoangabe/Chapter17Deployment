-- Rename fraud-related columns on orders for clarity (idempotent).
-- Safe whether the DB still has risk_score/is_fraud or was created without them.

-- 1) Drop legacy risk_score only if present
ALTER TABLE public.orders DROP COLUMN IF EXISTS risk_score;

-- 2) Rename is_fraud -> actual_fraud only when is_fraud exists and actual_fraud does not
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'is_fraud'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'actual_fraud'
  ) THEN
    ALTER TABLE public.orders RENAME COLUMN is_fraud TO actual_fraud;
  END IF;
END $$;

-- 3) New columns (skip if already applied)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS predicted_fraud boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fraud_probability numeric(6,5) DEFAULT NULL;

-- 4) order_predictions: rename predicted_is_fraud -> predicted_fraud only if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_predictions' AND column_name = 'predicted_is_fraud'
  ) THEN
    ALTER TABLE public.order_predictions RENAME COLUMN predicted_is_fraud TO predicted_fraud;
  END IF;
END $$;
