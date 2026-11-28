import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../db/postgres.js';
import { store } from '../db/store.js';
import { replanWaitingOrders } from '../services/kitchenPlan.js';
import {
  requireAuth,
  requireRole,
  getTodayIST
} from '../middleware/auth.js';

const router = express.Router();

const MIN_STAFF_PASSWORD = 8;

const ROLE_MAP = {
  'delivery': 'delivery',
  'delivery partner': 'delivery',
  'delivery_partner': 'delivery',
  'chef': 'chef',
  'cook': 'chef',
  'kitchen': 'chef'
};

const LOGIN_PREFIX = { chef: 'BL-CHEF', delivery: 'BL-DLV' };

// Application columns that are safe to send to the browser
// (never the password hash).
const APPLICATION_COLUMNS = `
  a.id, a.full_name, a.mobile, a.email, a.student_id, a.hostel,
  a.days_per_week, a.role, a.status, a.reviewed_at, a.created_at
`;

const cleanHostel = (value) => String(value || '').trim().toUpperCase().slice(0, 20);

// Earnings summary for a delivery partner (delivery charge per order delivered).
function summarizeEarnings(staffId, today) {
  const orders = store.getDeliveryEarnings(staffId);
  const fee = (o) => Number(o.deliveryFee) || 0;
  const istDate = (iso) =>
    iso ? new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10) : '';

  const todays = orders.filter(o => istDate(o.deliveredAt) === today);

  // Earnings from orders the admin deleted are kept here.
  const archive = Object.entries(store.getArchivedEarnings(staffId));
  const archivedCount = archive.reduce((s, [, d]) => s + d.deliveries, 0);
  const archivedAmount = archive.reduce((s, [, d]) => s + d.amount, 0);
  const archivedToday = archive.find(([date]) => date === today)?.[1] || { deliveries: 0, amount: 0 };

  return {
    totalDeliveries: orders.length + archivedCount,
    totalEarnings: Math.round((orders.reduce((s, o) => s + fee(o), 0) + archivedAmount) * 100) / 100,
    todayDeliveries: todays.length + archivedToday.deliveries,
    todayEarnings: Math.round((todays.reduce((s, o) => s + fee(o), 0) + archivedToday.amount) * 100) / 100,
    recent: orders.slice(0, 20).map(o => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      hostel: o.hostel,
      roomNumber: o.roomNumber,
      deliveryFee: fee(o),
      deliveredAt: o.deliveredAt
    }))
  };
}

// Readable temporary password, e.g. "kq7m-x2pd-9wfa".
function generateTempPassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i === 3 || i === 7) out += '-';
  }
  return out;
}

async function nextLoginId(client, role) {
  const prefix = LOGIN_PREFIX[role];
  const result = await client.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(login_id FROM '[0-9]+$') AS INT)), 0) AS max
       FROM staff_accounts
      WHERE login_id LIKE $1`,
    [`${prefix}-%`]
  );
  const next = Number(result.rows[0].max) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}


// ==================================================
// PUBLIC: submit an application
// POST /api/staff/applications
// ==================================================

router.post('/applications', async (req, res) => {
  try {
    const {
      fullName,
      name,
      mobile,
      email,
      studentId,
      daysPerWeek,
      role,
      password,
      hostel
    } = req.body || {};

    const applicantHostel = cleanHostel(hostel);

    const applicantName = String(fullName || name || '').trim();
    const applicantRole = ROLE_MAP[String(role || 'delivery').trim().toLowerCase()];
    const days = Number(daysPerWeek);

    if (!applicantName || !mobile || !email || !studentId || !daysPerWeek || !applicantHostel) {
      return res.status(400).json({
        success: false,
        error: 'Please fill all required fields, including your hostel.'
      });
    }

    if (!Number.isInteger(days) || days < 1 || days > 7) {
      return res.status(400).json({
        success: false,
        error: 'Days per week must be between 1 and 7.'
      });
    }

    if (!applicantRole) {
      return res.status(400).json({
        success: false,
        error: 'Please choose Chef or Delivery Partner.'
      });
    }

    if (!password || String(password).length < MIN_STAFF_PASSWORD) {
      return res.status(400).json({
        success: false,
        error: `Please choose a password of at least ${MIN_STAFF_PASSWORD} characters.`
      });
    }

    const cleanMobile = String(mobile).trim();
    const cleanStudentId = String(studentId).trim();

    // One open application per person and role.
    const existing = await pool.query(
      `SELECT status FROM staff_applications
        WHERE role = $1
          AND status IN ('pending', 'approved')
          AND (mobile = $2 OR LOWER(student_id) = LOWER($3))
        LIMIT 1`,
      [applicantRole, cleanMobile, cleanStudentId]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({
        success: false,
        error:
          existing.rows[0].status === 'approved'
            ? 'You are already approved for this role. Check your application status for your login ID.'
            : 'You already have a pending application for this role.'
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const result = await pool.query(
      `INSERT INTO staff_applications AS a
         (full_name, mobile, email, student_id, days_per_week, role, status, password_hash, hostel)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
       RETURNING ${APPLICATION_COLUMNS}`,
      [
        applicantName,
        cleanMobile,
        String(email).trim(),
        cleanStudentId,
        days,
        applicantRole,
        passwordHash,
        applicantHostel
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully!',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('STAFF APPLICATION ERROR:', error);

    return res.status(500).json({
      success: false,
      error: 'Unable to submit application. Please try again.'
    });
  }
});


// ==================================================
// PUBLIC: check application status
// GET /api/staff/applications/status?mobile=..&studentId=..
// Shows the login ID once approved. Never shows a password.
// ==================================================

router.get('/applications/status', async (req, res) => {
  try {
    const mobile = String(req.query.mobile || '').trim();
    const studentId = String(req.query.studentId || '').trim();

    if (!mobile || !studentId) {
      return res.status(400).json({
        success: false,
        error: 'Mobile and student ID are required.'
      });
    }

    const result = await pool.query(
      `SELECT a.role, a.status, a.created_at, a.reviewed_at, s.login_id
         FROM staff_applications a
         LEFT JOIN staff_accounts s ON s.application_id = a.id
        WHERE a.mobile = $1 AND LOWER(a.student_id) = LOWER($2)
        ORDER BY a.created_at DESC
        LIMIT 1`,
      [mobile, studentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'No application found.'
      });
    }

    const row = result.rows[0];

    return res.json({
      success: true,
      data: {
        role: row.role,
        status: row.status,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at,
        loginId: row.status === 'approved' ? row.login_id : null
      }
    });
  } catch (error) {
    console.error('STAFF STATUS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Could not check application status.'
    });
  }
});


// ==================================================
// STAFF: am I on duty today?
// GET /api/staff/me/duty
// ==================================================

router.get('/me/duty', requireAuth, async (req, res) => {
  try {
    if (req.user.kind !== 'staff') {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const today = await getTodayIST();
    const result = await pool.query(
      `SELECT s.is_active,
              EXISTS (
                SELECT 1 FROM staff_shifts sh
                 WHERE sh.staff_id = s.id AND sh.work_date = $2::date
              ) AS on_duty
         FROM staff_accounts s
        WHERE s.id = $1`,
      [req.user.userId, today]
    );

    const row = result.rows[0];

    if (!row || !row.is_active) {
      return res.status(401).json({
        success: false,
        error: 'This staff account is disabled. Please contact the admin.'
      });
    }

    return res.json({ success: true, data: { date: today, onDuty: row.on_duty } });
  } catch (error) {
    console.error('STAFF DUTY ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not check duty.' });
  }
});


// ==================================================
// DELIVERY PARTNER: my earnings
// GET /api/staff/me/earnings
// Only deliveries this partner made count.
// ==================================================

router.get('/me/earnings', requireRole('DELIVERY'), async (req, res) => {
  try {
    const today = await getTodayIST();
    return res.json({ success: true, data: { date: today, ...summarizeEarnings(req.user.userId, today) } });
  } catch (error) {
    console.error('STAFF EARNINGS ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not load earnings.' });
  }
});


// ==================================================
// ADMIN ONLY below this line
// ==================================================

const adminOnly = requireRole('ADMIN');

// GET /api/staff/applications
router.get('/applications', adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${APPLICATION_COLUMNS},
              (a.password_hash IS NOT NULL) AS has_password,
              s.login_id
         FROM staff_applications a
         LEFT JOIN staff_accounts s ON s.application_id = a.id
        ORDER BY (a.status = 'pending') DESC, a.created_at DESC`
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('LIST APPLICATIONS ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not load applications.' });
  }
});


// PATCH /api/staff/applications/:id/decision  { decision: 'approved' | 'rejected' }
router.patch('/applications/:id/decision', adminOnly, async (req, res) => {
  const decision = String(req.body?.decision || '').toLowerCase();

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({
      success: false,
      error: "Decision must be 'approved' or 'rejected'."
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const appResult = await client.query(
      'SELECT * FROM staff_applications WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );

    const application = appResult.rows[0];

    if (!application) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (application.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: `This application was already ${application.status}.`
      });
    }

    if (decision === 'rejected') {
      await client.query(
        `UPDATE staff_applications
            SET status = 'rejected', reviewed_at = NOW(), password_hash = NULL
          WHERE id = $1`,
        [application.id]
      );
      await client.query('COMMIT');
      return res.json({ success: true, message: 'Application rejected.' });
    }

    // ---------- Approve: create the staff login ----------
    const role = ROLE_MAP[String(application.role || '').toLowerCase()] || 'delivery';
    const loginId = await nextLoginId(client, role);

    // Normally the applicant chose a password on the form.
    // Older applications without one get a temporary password
    // (shown to the admin once) that must be changed at first login.
    let passwordHash = application.password_hash;
    let tempPassword = null;

    if (!passwordHash) {
      tempPassword = generateTempPassword();
      passwordHash = await bcrypt.hash(tempPassword, 10);
    }

    const accountResult = await client.query(
      `INSERT INTO staff_accounts
         (application_id, login_id, full_name, mobile, email, role,
          password_hash, must_change_password, hostel)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, login_id, full_name, role`,
      [
        application.id,
        loginId,
        application.full_name,
        application.mobile,
        application.email,
        role.toUpperCase(),
        passwordHash,
        Boolean(tempPassword),
        application.hostel || null
      ]
    );

    // The hash now lives on the account only.
    await client.query(
      `UPDATE staff_applications
          SET status = 'approved', reviewed_at = NOW(), password_hash = NULL
        WHERE id = $1`,
      [application.id]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Approved. Login ID: ${loginId}`,
      data: {
        account: accountResult.rows[0],
        loginId,
        // Only present for old applications without a password.
        tempPassword
      }
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('APPLICATION DECISION ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not update application.' });
  } finally {
    client.release();
  }
});


// GET /api/staff/accounts — all approved staff, with today's duty
router.get('/accounts', adminOnly, async (req, res) => {
  try {
    const today = await getTodayIST();
    const result = await pool.query(
      `SELECT s.id, s.login_id, s.full_name, s.mobile, s.email, s.role, s.hostel,
              s.is_active, s.must_change_password, s.created_at, s.can_deliver,
              EXISTS (
                SELECT 1 FROM staff_shifts sh
                 WHERE sh.staff_id = s.id AND sh.work_date = $1::date
              ) AS on_duty_today
         FROM staff_accounts s
        ORDER BY s.role, s.login_id`,
      [today]
    );

    // Delivery partners: earnings from the orders they delivered.
    // (Chefs have no earnings shown.)
    const data = result.rows.map(row =>
      row.role === 'DELIVERY'
        ? (({ recent, ...summary }) => ({ ...row, earnings: summary }))(summarizeEarnings(row.id, today))
        : row
    );

    return res.json({ success: true, date: today, data });
  } catch (error) {
    console.error('LIST STAFF ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not load staff.' });
  }
});


// POST /api/staff/accounts/:id/reset-password
// Returns a new temporary password ONCE. The staff member must
// change it when they next log in.
router.post('/accounts/:id/reset-password', adminOnly, async (req, res) => {
  try {
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `UPDATE staff_accounts
          SET password_hash = $1, must_change_password = TRUE, updated_at = NOW()
        WHERE id = $2
        RETURNING login_id, full_name`,
      [passwordHash, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Staff account not found.' });
    }

    return res.json({
      success: true,
      data: { ...result.rows[0], tempPassword }
    });
  } catch (error) {
    console.error('RESET STAFF PASSWORD ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not reset password.' });
  }
});


// PATCH /api/staff/accounts/:id/active  { isActive: boolean }
router.patch('/accounts/:id/active', adminOnly, async (req, res) => {
  try {
    const isActive = Boolean(req.body?.isActive);

    const result = await pool.query(
      `UPDATE staff_accounts SET is_active = $1, updated_at = NOW()
        WHERE id = $2 RETURNING id, is_active`,
      [isActive, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Staff account not found.' });
    }

    // A disabled account can't stay on today's duty list.
    if (!isActive) {
      await pool.query(
        `DELETE FROM staff_shifts
          WHERE staff_id = $1
            AND work_date >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
        [req.params.id]
      );
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('SET STAFF ACTIVE ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not update staff account.' });
  }
});


// PATCH /api/staff/accounts/:id/can-deliver  { canDeliver: boolean }
// A chef who also delivers orders (from the same chef panel).
router.patch('/accounts/:id/can-deliver', adminOnly, async (req, res) => {
  try {
    const canDeliver = Boolean(req.body?.canDeliver);

    const result = await pool.query(
      `UPDATE staff_accounts SET can_deliver = $1, updated_at = NOW()
        WHERE id = $2 AND role = 'CHEF'
        RETURNING id, can_deliver`,
      [canDeliver, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Chef account not found.' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('SET CHEF DELIVERY ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not update the chef.' });
  }
});


// PATCH /api/staff/accounts/:id/hostel  { hostel }
router.patch('/accounts/:id/hostel', adminOnly, async (req, res) => {
  try {
    const hostel = cleanHostel(req.body?.hostel);

    if (!hostel) {
      return res.status(400).json({ success: false, error: 'Choose a hostel.' });
    }

    const result = await pool.query(
      `UPDATE staff_accounts SET hostel = $1, updated_at = NOW()
        WHERE id = $2 RETURNING id, hostel`,
      [hostel, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Staff account not found.' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('SET STAFF HOSTEL ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not update hostel.' });
  }
});


// PUT /api/staff/duty/today  { staffIds: [...] }
// Replaces today's duty list.
router.put('/duty/today', adminOnly, async (req, res) => {
  const staffIds = Array.isArray(req.body?.staffIds)
    ? [...new Set(req.body.staffIds.map(String))]
    : null;

  if (!staffIds) {
    return res.status(400).json({ success: false, error: 'staffIds must be a list.' });
  }

  const client = await pool.connect();

  try {
    const today = await getTodayIST();

    await client.query('BEGIN');

    await client.query('DELETE FROM staff_shifts WHERE work_date = $1::date', [today]);

    if (staffIds.length > 0) {
      // Only active accounts can be put on duty.
      await client.query(
        `INSERT INTO staff_shifts (staff_id, work_date, assigned_by)
         SELECT s.id, $1::date, $2
           FROM staff_accounts s
          WHERE s.is_active = TRUE AND s.id::text = ANY($3::text[])`,
        [today, req.user.userId, staffIds]
      );
    }

    await client.query('COMMIT');

    const onDuty = await pool.query(
      'SELECT staff_id FROM staff_shifts WHERE work_date = $1::date',
      [today]
    );

    // A planned chef who just came on duty gets their waiting orders.
    await replanWaitingOrders().catch((error) => {
      console.error('REPLAN ORDERS ERROR:', error);
    });

    return res.json({
      success: true,
      date: today,
      data: onDuty.rows.map(r => r.staff_id)
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('SET DUTY ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not save duty list.' });
  } finally {
    client.release();
  }
});

export default router;
