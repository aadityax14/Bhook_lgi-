-- Additive fixes applied after schema.sql / staff_schema.sql.
-- Safe to run on every startup.

-- auth.js stores bcrypt hashes here.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Keeps order items in the order the customer added them.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;

-- Shared Bhel stock can be fractional (1 Half Bhel = 0.5 shared).
DO $$
BEGIN
  IF (
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'products'
      AND column_name = 'stock_half_units'
  ) = 'integer' THEN
    ALTER TABLE products ALTER COLUMN stock_half_units TYPE NUMERIC(10, 2);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
