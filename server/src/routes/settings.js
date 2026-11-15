import express from 'express';
import { store } from '../db/store.js';
import { requireRole } from '../middleware/auth.js';
import { getKitchenHostels } from '../services/fees.js';

// =============================================================
// DELIVERY & PACKING CHARGES
// GET is public (the cart needs it); only the admin can change.
// =============================================================

const router = express.Router();

const LIMITS = {
  sameHostelDeliveryFee: ['Same-hostel delivery charge', 500],
  otherHostelDeliveryFee: ['Other-hostel delivery charge', 500],
  packagingFee: ['Packing charge', 500],
  freeDeliveryFrom: ['Free delivery amount', 10000]
};

// GET /api/settings
// → { sameHostelDeliveryFee, otherHostelDeliveryFee, packagingFee,
//     freeDeliveryFrom, kitchenHostels: ['GH4', ...] }
// kitchenHostels = hostels with a chef on duty today (no names).
router.get('/', async (req, res) => {
  res.json({
    success: true,
    data: { ...store.getSettings(), kitchenHostels: await getKitchenHostels() }
  });
});

// PUT /api/settings  (admin)
router.put('/', requireRole('ADMIN'), (req, res) => {
  const updates = {};

  for (const [field, [label, max]] of Object.entries(LIMITS)) {
    if (req.body?.[field] === undefined || req.body[field] === '') continue;

    const value = Number(req.body[field]);

    if (!Number.isFinite(value) || value < 0 || value > max) {
      return res.status(400).json({
        success: false,
        error: `${label} must be between ₹0 and ₹${max}.`
      });
    }

    updates[field] = Math.round(value * 100) / 100;
  }

  // Kitchen open / closed switch (Bhook_Lgi food only)
  if (req.body?.kitchenOpen !== undefined) {
    if (typeof req.body.kitchenOpen !== 'boolean') {
      return res.status(400).json({ success: false, error: 'kitchenOpen must be true or false.' });
    }
    updates.kitchenOpen = req.body.kitchenOpen;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'Nothing to update.' });
  }

  res.json({ success: true, data: store.updateSettings(updates) });
});

export default router;
