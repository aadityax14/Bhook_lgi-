import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/postgres.js';

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || 'bhook_lgi_development_secret_change_later';


// ==================================================
// HELPER — format user for frontend
// ==================================================

function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    hostel: user.hostel,
    roomNumber: user.room_number,
    role: user.role
  };
}


// ==================================================
// CREATE ACCOUNT
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

    // Create customer
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
      RETURNING
        id,
        name,
        phone,
        email,
        hostel,
        room_number,
        role
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

    // Create authentication token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

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
// LOGIN
// POST /api/auth/login
// ==================================================

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
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
      WHERE phone = $1 OR LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [identifier.trim()]
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

    // Create authentication token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

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
// VERIFY LOGIN
// GET /api/auth/me
// ==================================================

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        phone,
        email,
        hostel,
        room_number,
        role
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [decoded.userId]
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

    return res.status(401).json({
      success: false,
      error: 'Invalid or expired login session.'
    });
  }
});


export default router;