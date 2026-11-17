
-- Bhook_Lgi Staff Application System
-- Safe additive migration: does not delete existing tables or data.
-- The server applies the same statements automatically on start
-- (see src/db/staffSchema.js).

CREATE TABLE IF NOT EXISTS staff_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(120) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    student_id VARCHAR(80) NOT NULL,

<<<<<<< HEAD
    role VARCHAR(20) DEFAULT 'delivery',        -- 'chef' | 'delivery'
    days_per_week SMALLINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',       -- 'pending' | 'approved' | 'rejected'
=======
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('chef', 'delivery')),
>>>>>>> main

    -- Password chosen by the applicant (bcrypt hash). Moved to
    -- staff_accounts and cleared here when the admin approves.
    password_hash TEXT,

    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Login accounts for approved chefs / delivery partners.
-- Kept separate from `users` so a student can be both a customer
-- and a staff member.
CREATE TABLE IF NOT EXISTS staff_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID UNIQUE
        REFERENCES staff_applications(id) ON DELETE SET NULL,

    login_id VARCHAR(20) NOT NULL UNIQUE,       -- e.g. BL-CHEF-001, BL-DLV-001
    full_name VARCHAR(120) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(150),

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('chef', 'delivery')),

    password_hash TEXT NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Who is on duty on each date (chosen by the admin).
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
