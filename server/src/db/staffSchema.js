import { pool } from './postgres.js';

// Additive, idempotent migration for customer profile extras.
export async function ensureUserProfileSchema() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS delivery_note TEXT;
  `);
}

// Additive, idempotent migration for staff logins and duty lists.
// Runs on server start. Never drops tables or deletes data.
export async function ensureStaffSchema() {
  await pool.query(`
    ALTER TABLE staff_applications
      ADD COLUMN IF NOT EXISTS password_hash TEXT;

    ALTER TABLE staff_applications
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS staff_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      application_id UUID UNIQUE
        REFERENCES staff_applications(id) ON DELETE SET NULL,

      login_id VARCHAR(20) NOT NULL UNIQUE,
      full_name VARCHAR(120) NOT NULL,
      mobile VARCHAR(20),
      email VARCHAR(150),

      role VARCHAR(20) NOT NULL
        CHECK (role IN ('CHEF', 'DELIVERY')),

      password_hash TEXT NOT NULL,
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS staff_shifts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      staff_id UUID NOT NULL
        REFERENCES staff_accounts(id) ON DELETE CASCADE,

      work_date DATE NOT NULL,
      assigned_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      UNIQUE (staff_id, work_date)
    );

    CREATE INDEX IF NOT EXISTS idx_staff_shifts_date
      ON staff_shifts(work_date);

    -- Which hostel the chef / delivery partner lives in.
    -- Delivery is cheaper when an on-duty chef is in the customer's hostel.
    ALTER TABLE staff_applications
      ADD COLUMN IF NOT EXISTS hostel VARCHAR(20);

    ALTER TABLE staff_accounts
      ADD COLUMN IF NOT EXISTS hostel VARCHAR(20);
  `);
}
