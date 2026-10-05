import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/postgres.js';

const router = express.Router();

/*
  CUSTOMER AUTHENTICATION
  -----------------------
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me
*/

// --------------------------------------------------
// CREATE ACCOUNT
// --------------------------------------------------
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
        error: 'Name, phone, password, hostel and room number are required.'
      });
    }

    // Basic password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.'
      });
    }

    // Check whether phone already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1 LIMIT 1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Account already exists. Please sign in.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create customer
    const result = await pool.query(
      `
      INSERT INTO users
  (name, phone, email, hostel, room_number, role, password_hash)
VALUES
  ($1, $2, $3, $4, $5, 'CUSTOMER', $6)
      RETURNING
        id,
        name,
        phone,
        email,
        hostel,
        room_number,
        role,
        created_at
      `,
      [
         name.trim(),
  phone.trim(),
  email?.trim() || null,
  hostel.trim(),
  roomNumber.trim(),
  passwordHash
      ]
    );

    const user = result.rows[0];
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

    /*
      NOTE:
      We are temporarily storing the password hash separately
      until we add a proper password column to the database.
    */

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        hostel: user.hostel,
        roomNumber: user.room_number,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      success: false,
      error: 'Unable to create account.'
    });
  }
});


// --------------------------------------------------
// SIGN IN
// --------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and password are required.'
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        phone,
        email,
        hostel,
        room_number,
        role,
        password_hash
      FROM users
      WHERE phone = $1
      LIMIT 1
      `,
      [phone.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Account not found. Please create an account first.'
      });
    }

    const user = result.rows[0];

    /*
      Password verification will be connected after
      we add the password_hash column.
    */

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        hostel: user.hostel,
        roomNumber: user.room_number,
        role: user.role
      },
      token: `bhook_token_${user.id}`
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      error: 'Unable to sign in.'
    });
  }
});


// --------------------------------------------------
// CURRENT USER
// --------------------------------------------------
router.get('/me', async (req, res) => {
  try {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });

  } catch (error) {
    console.error('Auth check error:', error);

    return res.status(500).json({
      success: false,
      error: 'Unable to verify authentication.'
    });
  }
});


export default router;