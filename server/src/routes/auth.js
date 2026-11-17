import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/postgres.js';
import {
  requireAuth,
  requireRole,
  signToken,
  normalizeRole
} from '../middleware/auth.js';
import { store } from '../db/store.js';

const router = express.Router();

// Staff log in with the ID the admin's approval created, e.g. BL-CHEF-001.
const STAFF_LOGIN_ID = /^BL-(CHEF|DLV)-\d+$/i;


// ==================================================
// HELPERS — format accounts for frontend
// ==================================================

function formatUser(user) {
  return {
    id: user.id,
    kind: 'user',
    name: user.name,
    phone: user.phone,
    email: user.email,
    hostel: user.hostel,
    roomNumber: user.room_number,
    deliveryNote: user.delivery_note || '',
    createdAt: user.created_at || null,
    role: normalizeRole(user.role)
  };
}

// Columns used by formatUser (never the password hash).
const USER_COLUMNS = `
  id, name, phone, email, hostel, room_number, role, delivery_note, created_at
`;

// Accepts "98765 43210", "+91-9876543210", "09876543210" → "9876543210".
function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

const isValidPhone = (digits) => /^[6-9]\d{9}$/.test(digits);
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function formatStaff(staff, onDutyToday = false) {
  return {
    id: staff.id,
    kind: 'staff',
    name: staff.full_name,
    phone: staff.mobile,
    email: staff.email,
    loginId: staff.login_id,
    role: normalizeRole(staff.role),
    mustChangePassword: Boolean(staff.must_change_password),
    onDutyToday: Boolean(onDutyToday)
  };
}

async function isStaffOnDutyToday(staffId) {
  const result = await pool.query(
    `SELECT 1 FROM staff_shifts
      WHERE staff_id = $1
        AND work_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
    [staffId]
  );
  return result.rowCount > 0;
}


// ==================================================
// CREATE ACCOUNT (customers only)
// POST /api/auth/register
// ==================================================

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      hostel,
      roomNumber
    } = req.body;

    // Required fields
    if (!name || !phone || !password || !hostel || !roomNumber) {
      return res.status(400).json({
        success: false,
        error:
          'Name, phone, password, hostel and room number are required.'
      });
    }

    // Password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.'
      });
    }

    const cleanPhone = phone.trim();

    // Check existing account
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE phone = $1
      LIMIT 1
      `,
      [cleanPhone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Account already exists. Please sign in.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create customer — the role is always CUSTOMER here and can
    // never be chosen by the person signing up.
    const result = await pool.query(
      `
      INSERT INTO users
        (
          name,
          phone,
          email,
          hostel,
          room_number,
          role,
          password_hash
        )
      VALUES
        ($1, $2, $3, $4, $5, 'CUSTOMER', $6)
      RETURNING ${USER_COLUMNS}
      `,
      [
        name.trim(),
        cleanPhone,
        email?.trim() || null,
        hostel.trim(),
        roomNumber.trim(),
        passwordHash
      ]
    );

    const user = result.rows[0];

    const token = signToken({ id: user.id, role: user.role, kind: 'user' });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: formatUser(user),
      token
    });

  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      success: false,
      error: 'Unable to create account.'
    });
  }
});


// ==================================================
// LOGIN (customers, admin, chef, delivery)
// POST /api/auth/login
//
// The account's role is read from the database and returned with
// the user, so the app can open the right dashboard.
// ==================================================

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Login ID and password are required.'
      });
    }

    const cleanIdentifier = String(identifier).trim();

    // ---------- Chef / delivery staff ----------
    if (STAFF_LOGIN_ID.test(cleanIdentifier)) {
      const result = await pool.query(
        `SELECT id, login_id, full_name, mobile, email, role,
                password_hash, must_change_password, is_active
           FROM staff_accounts
          WHERE UPPER(login_id) = UPPER($1)
          LIMIT 1`,
        [cleanIdentifier]
      );

      const staff = result.rows[0];
      const passwordMatches = staff
        ? await bcrypt.compare(password, staff.password_hash)
        : false;

      if (!staff || !passwordMatches) {
        return res.status(401).json({
          success: false,
          error: 'Incorrect login ID or password.'
        });
      }

      if (!staff.is_active) {
        return res.status(403).json({
          success: false,
          error: 'This staff account is disabled. Please contact the admin.'
        });
      }

      const token = signToken({ id: staff.id, role: staff.role, kind: 'staff' });

      return res.json({
        success: true,
        message: 'Signed in successfully.',
        user: formatStaff(staff, await isStaffOnDutyToday(staff.id)),
        token
      });
    }

    // ---------- Customers & admin ----------
    const result = await pool.query(
      `
      SELECT ${USER_COLUMNS}, password_hash
      FROM users
      WHERE phone = $1 OR LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [cleanIdentifier]
    );

    // Account doesn't exist
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Account not found. Please create an account first.'
      });
    }

    const user = result.rows[0];

    // Check password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password.'
      });
    }

    const token = signToken({ id: user.id, role: user.role, kind: 'user' });

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      user: formatUser(user),
      token
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      error: 'Unable to sign in.'
    });
  }
});


// ==================================================
// VERIFY LOGIN — returns the account's CURRENT role from the DB
// GET /api/auth/me
// ==================================================

router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.user.kind === 'staff') {
      const result = await pool.query(
        `SELECT id, login_id, full_name, mobile, email, role,
                must_change_password, is_active
           FROM staff_accounts WHERE id = $1`,
        [req.user.userId]
      );

      const staff = result.rows[0];

      if (!staff || !staff.is_active) {
        return res.status(401).json({
          success: false,
          error: 'This staff account is no longer active.'
        });
      }

      return res.json({
        success: true,
        user: formatStaff(staff, await isStaffOnDutyToday(staff.id))
      });
    }

    const result = await pool.query(
      `
      SELECT ${USER_COLUMNS}
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.'
      });
    }

    return res.json({
      success: true,
      user: formatUser(result.rows[0])
    });

  } catch (error) {
    console.error('Auth verification error:', error);

    return res.status(500).json({
      success: false,
      error: 'Could not verify login.'
    });
  }
});


// ==================================================
// UPDATE MY PROFILE (customers & admin)
// PATCH /api/auth/profile
// Body: any of { name, phone, email, hostel, roomNumber,
//                deliveryNote, currentPassword }
// Phone and email are also used to log in, so changing either
// requires the current password.
// ==================================================

router.patch('/profile', requireRole('CUSTOMER', 'ADMIN'), async (req, res) => {
  try {
    const body = req.body || {};

    const currentResult = await pool.query(
      `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE id = $1`,
      [req.user.userId]
    );
    const current = currentResult.rows[0];

    if (!current) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    const updates = {};

    // ---- Name ----
    if (body.name !== undefined) {
      const name = String(body.name).trim().replace(/\s+/g, ' ');
      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ success: false, error: 'Please enter your name (2–100 characters).' });
      }
      updates.name = name;
    }

    // ---- Phone (also the login) ----
    if (body.phone !== undefined) {
      const phone = normalizePhone(body.phone);
      if (!isValidPhone(phone)) {
        return res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number.' });
      }
      if (phone !== current.phone) updates.phone = phone;
    }

    // ---- Email (optional, also a login) ----
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (email && !isValidEmail(email)) {
        return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
      }
      if ((email || null) !== (current.email ? current.email.toLowerCase() : null)) {
        updates.email = email || null;
      }
    }

    // ---- Hostel & room ----
    if (body.hostel !== undefined) {
      const hostel = String(body.hostel).trim();
      if (!hostel || hostel.length > 20) {
        return res.status(400).json({ success: false, error: 'Please choose your hostel.' });
      }
      updates.hostel = hostel;
    }

    if (body.roomNumber !== undefined) {
      const room = String(body.roomNumber).trim();
      if (!room || room.length > 20) {
        return res.status(400).json({ success: false, error: 'Please enter your room number (max 20 characters).' });
      }
      updates.room_number = room;
    }

    // ---- Default delivery note ----
    if (body.deliveryNote !== undefined) {
      const note = String(body.deliveryNote).trim();
      if (note.length > 200) {
        return res.status(400).json({ success: false, error: 'Delivery note can be at most 200 characters.' });
      }
      updates.delivery_note = note || null;
    }

    // ---- Login details need the current password ----
    if (updates.phone !== undefined || updates.email !== undefined) {
      const ok =
        body.currentPassword &&
        (await bcrypt.compare(String(body.currentPassword), current.password_hash));

      if (!ok) {
        return res.status(401).json({
          success: false,
          code: 'PASSWORD_REQUIRED',
          error: 'Enter your current password to change your phone or email.'
        });
      }
    }

    if (updates.phone !== undefined) {
      const taken = await pool.query(
        'SELECT 1 FROM users WHERE phone = $1 AND id <> $2',
        [updates.phone, current.id]
      );
      if (taken.rowCount > 0) {
        return res.status(409).json({ success: false, error: 'This mobile number is already used by another account.' });
      }
    }

    if (updates.email) {
      const taken = await pool.query(
        'SELECT 1 FROM users WHERE LOWER(email) = $1 AND id <> $2',
        [updates.email, current.id]
      );
      if (taken.rowCount > 0) {
        return res.status(409).json({ success: false, error: 'This email is already used by another account.' });
      }
    }

    const fields = Object.keys(updates);

    if (fields.length === 0) {
      return res.json({ success: true, message: 'Nothing to update.', user: formatUser(current) });
    }

    // Column names come from the fixed list above, never from the client.
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW()
        WHERE id = $${fields.length + 1}
        RETURNING ${USER_COLUMNS}`,
      [...fields.map(f => updates[f]), current.id]
    );

    const updatedUser = result.rows[0];

    // Orders still on their way should use the new contact details,
    // so the delivery partner / admin call the right number.
    if (updates.name !== undefined || updates.phone !== undefined) {
      store.updateActiveOrderContact(updatedUser.id, {
        customerName: updatedUser.name,
        customerPhone: updatedUser.phone
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated.',
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, error: 'Could not update your profile.' });
  }
});


// ==================================================
// CHANGE PASSWORD (any signed-in account)
// POST /api/auth/change-password
// ==================================================

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new password are required.'
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters.'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from the current one.'
      });
    }

    const isStaff = req.user.kind === 'staff';
    const table = isStaff ? 'staff_accounts' : 'users';

    const result = await pool.query(
      `SELECT password_hash FROM ${table} WHERE id = $1`,
      [req.user.userId]
    );

    const account = result.rows[0];

    if (!account || !(await bcrypt.compare(currentPassword, account.password_hash))) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    if (isStaff) {
      await pool.query(
        `UPDATE staff_accounts
            SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
          WHERE id = $2`,
        [newHash, req.user.userId]
      );
    } else {
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newHash, req.user.userId]
      );
    }

    return res.json({
      success: true,
      message: 'Password updated.'
    });
  } catch (error) {
    console.error('Change password error:', error);

    return res.status(500).json({
      success: false,
      error: 'Could not change password.'
    });
  }
});


export default router;
