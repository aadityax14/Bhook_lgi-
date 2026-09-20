import express from 'express';

const router = express.Router();

// Mock users database with demo accounts
const users = [
  {
    id: 'usr-student-demo',
    name: 'Aaditya Yadav',
    phone: '9876543210',
    email: 'aaditya@hostel.edu',
    hostel: 'GH4',
    roomNumber: '312',
    role: 'student'
  },
  {
    id: 'usr-admin-demo',
    name: 'Bhook_Lgi Kitchen Manager',
    phone: '9999988888',
    email: 'admin@bhooklgi.com',
    hostel: 'Mess / Kitchen HQ',
    roomNumber: 'HQ-1',
    role: 'admin'
  }
];

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { phone, password, role } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }

  let user = users.find(u => u.phone === phone);
  if (!user) {
    // Auto-create or login with simple token
    user = {
      id: `usr-${Date.now()}`,
      name: req.body.name || `Hostel Resident`,
      phone,
      email: req.body.email || `${phone}@student.hostel.in`,
      hostel: req.body.hostel || 'GH4',
      roomNumber: req.body.roomNumber || '101',
      role: role || (phone === '9999988888' ? 'admin' : 'student')
    };
    users.push(user);
  }

  res.json({
    success: true,
    message: 'Authenticated successfully',
    user,
    token: `bhook_token_${user.id}_${Date.now()}`
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  // Default to student demo user
  res.json({
    success: true,
    user: users[0]
  });
});

export default router;
