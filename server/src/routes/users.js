import express from 'express';
import { pool } from '../db/postgres.js';
import { store } from '../db/store.js';
import { requireRole, normalizeRole } from '../middleware/auth.js';

// =============================================================
// CUSTOMER ACCOUNTS (admin only)
//   • how many people are signed in / using the app right now
//   • block an account (can be undone) or terminate it for good
// =============================================================

const router = express.Router();

router.use(requireRole('ADMIN'));

// "Online now" = used the app in the last few minutes.
const ONLINE_MINUTES = 5;
// Sign-ins last 7 days (same as the login token).
const SESSION_DAYS = 7;

function formatAccount(row, orderStats) {
  const stats = orderStats.get(String(row.id)) || { total: 0, cancelled: 0 };

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    hostel: row.hostel,
    roomNumber: row.room_number,
    role: normalizeRole(row.role),
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    lastLoginAt: row.last_login_at,
    isOnline: row.is_online,
    isSignedIn: row.is_signed_in,
    isBlocked: Boolean(row.is_blocked),
    blockedAt: row.blocked_at,
    blockedReason: row.blocked_reason || '',
    isTerminated: Boolean(row.terminated_at),
    terminatedAt: row.terminated_at,
    orders: stats.total,
    cancelledOrders: stats.cancelled
  };
}

// Orders per customer (from the order store).
function getOrderStats() {
  const stats = new Map();

  for (const order of store.getOrders()) {
    if (!order.userId) continue;
    const entry = stats.get(String(order.userId)) || { total: 0, cancelled: 0 };
    entry.total += 1;
    if (order.status === 'cancelled') entry.cancelled += 1;
    stats.set(String(order.userId), entry);
  }

  return stats;
}

async function findCustomer(id) {
  const result = await pool.query(
    'SELECT id, name, role, is_blocked, terminated_at FROM users WHERE id::text = $1',
    [String(id)]
  );
  return result.rows[0] || null;
}

// GET /api/users → { summary, data: [accounts] }
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, phone, email, hostel, room_number, role, created_at,
              last_seen_at, last_login_at, is_blocked, blocked_at, blocked_reason, terminated_at,
              (last_seen_at > NOW() - make_interval(mins => $1::int)
                 AND NOT is_blocked AND terminated_at IS NULL) AS is_online,
              (last_seen_at > NOW() - make_interval(days => $2::int)
                 AND NOT is_blocked AND terminated_at IS NULL) AS is_signed_in
         FROM users
        ORDER BY (terminated_at IS NULL) DESC,
                 is_online DESC NULLS LAST,
                 last_seen_at DESC NULLS LAST,
                 created_at DESC`,
      [ONLINE_MINUTES, SESSION_DAYS]
    );

    const orderStats = getOrderStats();
    const accounts = result.rows.map((row) => formatAccount(row, orderStats));
    const customers = accounts.filter((a) => a.role === 'CUSTOMER');

    return res.json({
      success: true,
      summary: {
        totalCustomers: customers.filter((a) => !a.isTerminated).length,
        signedIn: accounts.filter((a) => a.isSignedIn).length,
        onlineNow: accounts.filter((a) => a.isOnline).length,
        blocked: customers.filter((a) => a.isBlocked && !a.isTerminated).length,
        terminated: customers.filter((a) => a.isTerminated).length,
        onlineMinutes: ONLINE_MINUTES
      },
      data: accounts
    });
  } catch (error) {
    console.error('LIST USERS ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not load users.' });
  }
});

// PATCH /api/users/:id/block  { blocked: boolean, reason }
// Blocked customers are signed out at once and can't sign in
// until the admin unblocks them.
router.patch('/:id/block', async (req, res) => {
  try {
    const account = await findCustomer(req.params.id);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    if (normalizeRole(account.role) !== 'CUSTOMER') {
      return res.status(403).json({ success: false, error: 'Only customer accounts can be blocked.' });
    }

    if (account.terminated_at) {
      return res.status(409).json({ success: false, error: 'This account was terminated permanently.' });
    }

    const blocked = Boolean(req.body?.blocked);
    const reason = String(req.body?.reason || '').trim().slice(0, 300);

    await pool.query(
      `UPDATE users
          SET is_blocked = $1::boolean,
              blocked_at = CASE WHEN $1::boolean THEN NOW() ELSE NULL END,
              blocked_reason = CASE WHEN $1::boolean THEN $2::text ELSE NULL END,
              last_seen_at = CASE WHEN $1::boolean THEN NULL ELSE last_seen_at END,
              updated_at = NOW()
        WHERE id = $3`,
      [blocked, reason || null, account.id]
    );

    return res.json({
      success: true,
      message: blocked ? `${account.name} is blocked.` : `${account.name} is unblocked.`
    });
  } catch (error) {
    console.error('BLOCK USER ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not update the account.' });
  }
});

// POST /api/users/:id/terminate  { reason }
// Permanent: signed out, can never sign in again, and the same
// phone / email can't create a new account. Cannot be undone.
router.post('/:id/terminate', async (req, res) => {
  try {
    const account = await findCustomer(req.params.id);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    if (normalizeRole(account.role) !== 'CUSTOMER') {
      return res.status(403).json({ success: false, error: 'Only customer accounts can be terminated.' });
    }

    if (account.terminated_at) {
      return res.json({ success: true, message: 'This account was already terminated.' });
    }

    const reason = String(req.body?.reason || '').trim().slice(0, 300);

    await pool.query(
      `UPDATE users
          SET terminated_at = NOW(),
              is_blocked = TRUE,
              blocked_at = COALESCE(blocked_at, NOW()),
              blocked_reason = COALESCE($1::text, blocked_reason),
              last_seen_at = NULL,
              updated_at = NOW()
        WHERE id = $2`,
      [reason || null, account.id]
    );

    return res.json({ success: true, message: `${account.name} was removed from Bhook_Lgi permanently.` });
  } catch (error) {
    console.error('TERMINATE USER ERROR:', error);
    return res.status(500).json({ success: false, error: 'Could not terminate the account.' });
  }
});

export default router;
