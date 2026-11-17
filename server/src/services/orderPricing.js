// =============================================================
// SERVER-SIDE ORDER PRICING
//
// The prices saved by the admin are the final prices. The browser's
// prices are never trusted: every item, size, extra and fee is
// recalculated here from the product data in the store.
// =============================================================

// Delivery & packing charges come from the admin's settings and the
// hostel rule in services/fees.js (the cart uses the same rules).
import { computeDeliveryFee } from './fees.js';

const MAX_QUANTITY_PER_ITEM = 50;

const norm = (value) => String(value ?? '').trim().toLowerCase();
const money = (value) => Math.round(Number(value) * 100) / 100;

function findVariant(product, item) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  const wantedId = item.variantId ?? item.variant?.id;
  const wantedName =
    typeof item.variant === 'string'
      ? item.variant
      : item.variantName ?? item.variant?.name ?? item.variant?.label;

  // No size picked: the main price is used (same as the cart).
  if (!wantedId && !wantedName) {
    return { variant: null };
  }

  const match = variants.find(
    (v) =>
      v &&
      ((wantedId && v.id && norm(v.id) === norm(wantedId)) ||
        (wantedName && norm(v.name ?? v.label) === norm(wantedName)))
  );

  if (!match) {
    return {
      error: `The size "${wantedName || wantedId}" of ${product.name} is no longer available.`
    };
  }

  return { variant: match };
}

function findAddons(product, item) {
  const productAddons = Array.isArray(product.addons) ? product.addons : [];
  const requested = Array.isArray(item.addons) ? item.addons : [];
  const result = [];

  for (const wanted of requested) {
    const wantedId = typeof wanted === 'object' ? wanted?.id : null;
    const wantedName = typeof wanted === 'string' ? wanted : wanted?.name;

    const match = productAddons.find(
      (a) =>
        a &&
        ((wantedId && a.id && norm(a.id) === norm(wantedId)) ||
          (wantedName && norm(a.name) === norm(wantedName)))
    );

    if (!match) {
      return {
        error: `The extra "${wantedName || wantedId}" for ${product.name} is no longer available.`
      };
    }

    result.push({
      id: match.id || null,
      name: match.name,
      price: money(match.price || 0)
    });
  }

  return { addons: result };
}

/**
 * Recalculate an order from saved product prices.
 *
 * @returns {{ ok: true, items, subtotal, deliveryFee, packagingFee, total }
 *         | { ok: false, error }}
 */
export function priceOrder(store, { items, deliveryType, hostel, kitchenHostels = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'Your cart is empty.' };
  }

  const pricedItems = [];

  for (const item of items) {
    const product = store.getProductById(item?.productId);

    if (!product) {
      return {
        ok: false,
        error: `${item?.productName || 'An item in your cart'} is no longer on the menu.`
      };
    }

    if (product.isAvailable === false || product.isActive === false) {
      return { ok: false, error: `${product.name} is currently unavailable.` };
    }

    // Some items are only sold in certain hostels (set by the admin).
    // Compared without spaces/case: "gh 2" = "GH2".
    const squash = (h) => String(h || '').replace(/\s+/g, '').toUpperCase();
    const allowedHostels = Array.isArray(product.availableHostels)
      ? product.availableHostels.map(squash).filter(Boolean)
      : [];
    if (
      allowedHostels.length > 0 &&
      !allowedHostels.includes(squash(hostel))
    ) {
      return {
        ok: false,
        code: 'NOT_IN_HOSTEL',
        error: `${product.name} is not available in ${hostel || 'your hostel'}. Available in: ${allowedHostels.join(', ')}.`
      };
    }

    const quantity = Math.floor(Number(item.quantity));

    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
      return {
        ok: false,
        error: `Quantity for ${product.name} must be between 1 and ${MAX_QUANTITY_PER_ITEM}.`
      };
    }

    const variantResult = findVariant(product, item);
    if (variantResult.error) return { ok: false, error: variantResult.error };

    const addonResult = findAddons(product, item);
    if (addonResult.error) return { ok: false, error: addonResult.error };

    const { variant } = variantResult;
    const basePrice = money(variant?.price ?? product.price ?? 0);
    const addonsTotal = addonResult.addons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = money(basePrice + addonsTotal);

    pricedItems.push({
      ...item,
      productId: product.id,
      productName: product.name,
      variant: variant ? variant.name ?? variant.label ?? null : null,
      variantId: variant?.id ?? null,
      addons: addonResult.addons,
      quantity,
      priceAtOrder: unitPrice,
      itemTotal: money(unitPrice * quantity)
    });
  }

  const subtotal = money(pricedItems.reduce((sum, i) => sum + i.itemTotal, 0));

  const settings = store.getSettings();

  const isZuxuOrder = pricedItems.every(i => {
    const product = store.getProductById(i.productId);
    return product?.storeId === 'store-zuxu' || String(product?.categoryId || '').toLowerCase() === 'zuxu';
  });

  const deliveryFee = money(
    computeDeliveryFee({
      settings,
      kitchenHostels,
      hostel,
      deliveryType,
      subtotal,
      orderType: isZuxuOrder ? 'zuxu' : 'food'
    })
  );

  const packagingFee = money(settings.packagingFee);
  const total = money(subtotal + deliveryFee + packagingFee);

  return {
    ok: true,
    items: pricedItems,
    subtotal,
    deliveryFee,
    packagingFee,
    total
  };
}
