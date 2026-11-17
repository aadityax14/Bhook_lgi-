// Some Bhook_Lgi items are only sold in certain hostels (set by the admin).
// An empty list means the item is sold in every hostel.
// The server checks the same rule when an order is placed.

// "gh 2", "Gh2", " GH2 " → "GH2" (same rule as the server)
export const normalizeHostel = (value) =>
  String(value || '').replace(/\s+/g, '').toUpperCase();

export function availableHostelsOf(product) {
  return Array.isArray(product?.availableHostels)
    ? product.availableHostels.map(normalizeHostel).filter(Boolean)
    : [];
}

export function isAvailableInHostel(product, hostel) {
  const hostels = availableHostelsOf(product);
  if (hostels.length === 0) return true;
  return hostels.includes(normalizeHostel(hostel));
}
