// Delivery & packing charges — same rules as server/src/services/fees.js.
//   • Pickup → no delivery charge
//   • Subtotal ≥ freeDeliveryFrom (when > 0) → free delivery
//   • A chef on duty today lives in your hostel → same-hostel charge
//   • Otherwise (and all Zuxu orders) → other-hostel charge

export const DEFAULT_FEE_SETTINGS = {
  sameHostelDeliveryFee: 5,
  otherHostelDeliveryFee: 10,
  packagingFee: 5,
  freeDeliveryFrom: 0,
  kitchenHostels: [],
  kitchenOpen: true,
};

// Hostels used across the app (customers, chefs, delivery partners).
export const HOSTELS = ['GH1', 'GH3', 'GH4', 'GH11', 'GH12', 'GS11', 'GS12', 'BH1', 'BH2', 'Other'];

// "gh 2" → "GH2" (same as the server)
const norm = (value) => String(value || '').replace(/\s+/g, '').toUpperCase();

export function computeFees({ settings = DEFAULT_FEE_SETTINGS, subtotal, hostel, deliveryType, orderType }) {
  if (!subtotal) {
    return { deliveryFee: 0, packagingFee: 0, total: 0, sameHostel: false };
  }

  const kitchenHostels = (settings.kitchenHostels || []).map(norm);
  const sameHostel = orderType !== 'zuxu' && norm(hostel) !== '' && kitchenHostels.includes(norm(hostel));
  const freeFrom = Number(settings.freeDeliveryFrom) || 0;

  let deliveryFee = sameHostel
    ? Number(settings.sameHostelDeliveryFee) || 0
    : Number(settings.otherHostelDeliveryFee) || 0;

  if (deliveryType === 'pickup' || (freeFrom > 0 && subtotal >= freeFrom)) {
    deliveryFee = 0;
  }

  const packagingFee = Number(settings.packagingFee) || 0;

  return {
    deliveryFee,
    packagingFee,
    total: Math.round((subtotal + deliveryFee + packagingFee) * 100) / 100,
    sameHostel,
  };
}
