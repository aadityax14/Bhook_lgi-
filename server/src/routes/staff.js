import express from 'express';
import { pool } from '../db/postgres.js';

const router = express.Router();

// POST /api/staff/applications
// Submit a staff application

router.post('/applications', async (req, res) => {
  try {
    const {
      fullName,
      name,
      mobile,
      email,
      studentId,
      daysPerWeek,
      role
    } = req.body;

    const applicantName = fullName || name;
    const rawRole = String(role || 'delivery')
  .trim()
  .toLowerCase();

const roleMap = {
  'delivery': 'delivery',
  'delivery partner': 'delivery',
  'delivery_partner': 'delivery',
  'chef': 'chef',
  'cook': 'chef',
  'kitchen': 'chef'
};

const applicantRole = roleMap[rawRole];
    const days = Number(daysPerWeek);

    // Validate required fields
    if (
      !applicantName ||
      !mobile ||
      !email ||
      !studentId ||
      !daysPerWeek
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please fill all required fields.'
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
    error: `Invalid application role: ${role}`
  });
}

    // Save application in PostgreSQL
    const result = await pool.query(
      `INSERT INTO staff_applications
        (full_name, mobile, email, student_id, days_per_week, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        applicantName.trim(),
        mobile.trim(),
        email.trim(),
        studentId.trim(),
        days,
        applicantRole
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

export default router;