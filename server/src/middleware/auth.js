import jwt from 'jsonwebtoken';
import { pool } from '../db/postgres.js';

// =============================================================
// ROLES
//   CUSTOMER  - users table (default for sign-ups)
//   ADMIN     - users table (created with `npm run create-admin`)
//   CHEF      - staff_accounts table (created when admin approves)
//   DELIVERY  - staff_accounts table (created when admin approves)
// =============================================================

export const STAFF_ROLES = ['CHEF', 'DELIVERY'];

export function getSecret() {
  return process.env.JWT_SECRET || 'bhook_lgi_development_secret_change_later';
}

export function normalizeRole(role) {
  const value = String(role || 'CUSTOMER').trim().toUpperCase();
  if (value === 'OWNER_ADMIN') return 'ADMIN';
  if (value === 'DELIVERY_PARTNER') return 'DELIVERY';
  return value;
}

// kind: 'user' (customers/admin) or 'staff' (chef/delivery)
export function signToken({ id, role, kind }) {
  return jwt.sign(
    { userId: String(id), role: normalizeRole(role), kind },
    getSecret(),
    { expiresIn: '7d' }
  );
}

// Today's date in India, as YYYY-MM-DD (used for duty lists).
export async function getTodayIST() {
  const result = await pool.query(
    "SELECT to_char((NOW() AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS today"
  );
  return result.rows[0].today;
}

function readToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], getSecret());
    return {
      userId: String(decoded.userId),
      role: normalizeRole(decoded.role),
      kind: decoded.kind === 'staff' ? 'staff' : 'user'
    };
  } catch {
    return null;
  }
}

// Valid token required. Sets req.user = { userId, role, kind }.
// The role here comes from the token; use requireRole() when the
// decision matters, so the role is re-checked in the database.
export function requireAuth(req, res, next) {
  const user = readToken(req);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Please sign in to continue.'
    });
  }

  req.user = user;
  next();
}

// Valid token AND the account's CURRENT role (from the database)
// must be one of `roles`. Disabled staff and demoted admins are
// rejected immediately, even if their token hasn't expired.
export function requireRole(...roles) {
  const allowed = roles.map(normalizeRole);

  return async (req, res, next) => {
    const tokenUser = readToken(req);

    if (!tokenUser) {
      return res.status(401).json({
        success: false,
        error: 'Please sign in to continue.'
      });
    }

    try {
      let current;

      if (tokenUser.kind === 'staff') {
        const result = await pool.query(
          `SELECT id, role, is_active, must_change_password
             FROM staff_accounts WHERE id = $1`,
          [tokenUser.userId]
        );
        const row = result.rows[0];

        if (!row || !row.is_active) {
          return res.status(401).json({
            success: false,
            error: 'This staff account is disabled. Please contact the admin.'
          });
        }

        if (row.must_change_password) {
          return res.status(403).json({
            success: false,
            code: 'PASSWORD_CHANGE_REQUIRED',
            error: 'Please set a new password first.'
          });
        }

        current = { userId: String(row.id), role: normalizeRole(row.role), kind: 'staff' };
      } else {
        const result = await pool.query(
          'SELECT id, role FROM users WHERE id = $1',
          [tokenUser.userId]
        );
        const row = result.rows[0];

        if (!row) {
          return res.status(401).json({
            success: false,
            error: 'Your account no longer exists. Please sign in again.'
          });
        }

        current = { userId: String(row.id), role: normalizeRole(row.role), kind: 'user' };
      }

      if (!allowed.includes(current.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied.'
        });
      }

      req.user = current;
      next();
    } catch (error) {
      console.error('AUTH CHECK ERROR:', error);
      return res.status(500).json({
        success: false,
        error: 'Could not verify your account.'
      });
    }
  };
}

// Use after requireRole(). Chef/delivery staff must be on today's
// duty list (chosen by the admin). Admins always pass.
export async function requireOnDuty(req, res, next) {
  if (!STAFF_ROLES.includes(req.user?.role)) {
    return next();
  }

  try {
    const result = await pool.query(
      `SELECT 1 FROM staff_shifts
        WHERE staff_id = $1
          AND work_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        success: false,
        code: 'NOT_ON_DUTY',
        error: "You're not on duty today."
      });
    }

    next();
  } catch (error) {
    console.error('DUTY CHECK ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Could not check your duty status.'
    });
  }
}
