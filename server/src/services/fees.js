import { pool } from '../db/postgres.js';

// =============================================================
// DELIVERY CHARGE RULES
//   • Pickup                                   → free
//   • Subtotal ≥ "free delivery from" (if set)  → free
//   • A chef on duty today lives in the customer's hostel
//                                               → same-hostel charge (₹5)
//   • Otherwise (and all Zuxu orders)           → other-hostel charge (₹10)
// The client uses the same rules (client/src/utils/fees.js).
// =============================================================

// "gh 2" → "GH2"
export const normalizeHostel = (value) => String(value || '').replace(/\s+/g, '').toUpperCase();

// Hostels of active chefs on today's duty list (India date).
export async function getKitchenHostels() {
  try {
    const result = await pool.query(
      `SELECT DISTINCT UPPER(REGEXP_REPLACE(s.hostel, '[[:space:]]+', '', 'g')) AS hostel
         FROM staff_accounts s
         JOIN staff_shifts sh ON sh.staff_id = s.id
        WHERE s.role = 'CHEF'
          AND s.is_active = TRUE
          AND s.hostel IS NOT NULL
          AND TRIM(s.hostel) <> ''
          AND sh.work_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`
    );
    return result.rows.map(r => r.hostel);
  } catch (error) {
    // If the staff tables aren't reachable, fall back to the standard rate.
    console.warn('Could not load kitchen hostels:', error.message);
    return [];
  }
}

export function computeDeliveryFee({ settings, kitchenHostels = [], hostel, deliveryType, subtotal, orderType }) {
  if (deliveryType === 'pickup') return 0;

  const freeFrom = Number(settings.freeDeliveryFrom) || 0;
  if (freeFrom > 0 && subtotal >= freeFrom) return 0;

  const sameHostel =
    orderType !== 'zuxu' &&
    normalizeHostel(hostel) !== '' &&
    kitchenHostels.includes(normalizeHostel(hostel));

  return Number(sameHostel ? settings.sameHostelDeliveryFee : settings.otherHostelDeliveryFee) || 0;
}
