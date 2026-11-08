
-- Bhook_Lgi Staff Application System
-- Safe additive migration: does not delete existing tables or data.

CREATE TABLE IF NOT EXISTS staff_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(120) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    student_id VARCHAR(80) NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('chef', 'delivery')),

    days_per_week SMALLINT NOT NULL
        CHECK (days_per_week BETWEEN 1 AND 7),

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),

    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_applications_status
ON staff_applications(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_applications_role
ON staff_applications(role);

-- Staff accounts will be created after admin approval.
CREATE TABLE IF NOT EXISTS staff_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL UNIQUE
        REFERENCES staff_applications(id) ON DELETE RESTRICT,

    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('chef', 'delivery')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin will assign approved staff to individual working dates.
CREATE TABLE IF NOT EXISTS staff_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    staff_id UUID NOT NULL
        REFERENCES staff_accounts(id) ON DELETE CASCADE,

    work_date DATE NOT NULL,

    assigned_by VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (staff_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_shifts_date
ON staff_shifts(work_date);
