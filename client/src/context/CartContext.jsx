
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect
} from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { computeFees, DEFAULT_FEE_SETTINGS } from '../utils/fees';
import { isAvailableInHostel } from '../utils/availability';

const CartContext = createContext();

// Creates a consistent string for customized cart items
const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bhook_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  const { user } = useAuth();
  const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE_SETTINGS);

  // Charges + which hostels have a chef on duty today (refreshed
  // every minute, and again if the server says prices changed).
  const refreshFeeSettings = useCallback(async () => {
    try {
      const res = await api.getSettings();
      if (res?.data) setFeeSettings({ ...DEFAULT_FEE_SETTINGS, ...res.data });
    } catch {
      // Keep the last known charges
    }
  }, []);

  useEffect(() => {
    refreshFeeSettings();
    const interval = setInterval(refreshFeeSettings, 60000);
    return () => clearInterval(interval);
  }, [refreshFeeSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('bhook_cart', JSON.stringify(items));
    } catch (error) {
      console.error('Cart storage error:', error);
    }
  }, [items]);

  const showToast = (msg) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage(current =>
        current === msg ? null : current
      );
    }, 2400);
  };

  // ADD PRODUCT TO CART
  const addToCart = (product, options = {}) => {
    if (!product?.id) {
      showToast('Invalid product!');
      return;
    }

    // Item only sold in some hostels (set by the admin)
    if (!isAvailableInHostel(product, user?.hostel)) {
      showToast(`${product.name} is not available in ${user?.hostel || 'your hostel'}.`);
      return;
    }

    const {
      variant = null,
      spiceLevel = product.allowsSpiceCustomization
        ? 'spicy'
        : null,
      addons = [],
      quantity = 1,
      customization = {},
      selectedOptions = {},
      productType = product.storeId === 'store-zuxu'
        || String(product.categoryId).toLowerCase() === 'zuxu'
        ? 'zuxu'
        : 'bhook_lgi'
    } = options;

    const safeQuantity = Math.max(1, Number(quantity) || 1);

    // Variant price takes priority over product price
    const basePrice = Number(
      variant?.price ?? product.price ?? 0
    );

    const addonsPrice = addons.reduce(
      (sum, addon) => sum + Number(addon.price || 0),
      0
    );

    const unitPrice = basePrice + addonsPrice;

    // Keep all selected options in the cart identity
    const customizationData = {
      ...customization,
      ...selectedOptions
    };

    const variantKey = variant
      ? variant.id || variant.name || stableStringify(variant)
      : 'default';

    const customizationKey = stableStringify({
      customization: customizationData,
      addons: addons.map(addon => ({
        id: addon.id || addon.name,
        name: addon.name,
        price: Number(addon.price || 0)
      })),
      spiceLevel
    });

    const cartItemId = [
      product.id,
      variantKey,
      customizationKey
    ].join('-');

    const primaryImage =
      product.imageUrl ||
      product.image ||
      product.images?.[0] ||
      '';

    const cartItem = {
      cartItemId,
      productId: product.id,

      name: product.name,
      imageUrl: primaryImage,
      images: product.images || [],

      productType,
      storeId: product.storeId || null,

      categoryId: product.categoryId || null,

      variant: variant,
      variantName: variant?.name || null,

      spiceLevel,

      addons: addons.map(addon => ({
        id: addon.id || null,
        name: addon.name,
        price: Number(addon.price || 0)
      })),

      customization: customizationData,

      unitPrice,
      mrp: Number(product.mrp || product.price || 0),

      quantity: safeQuantity,
      itemTotal: safeQuantity * unitPrice
    };

    setItems(prevItems => {
      const existingIdx = prevItems.findIndex(
        item => item.cartItemId === cartItemId
      );

      if (existingIdx > -1) {
        const updated = [...prevItems];

        const newQuantity =
          updated[existingIdx].quantity + safeQuantity;

        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQuantity,
          itemTotal: newQuantity * unitPrice
        };

        return updated;
      }

      return [...prevItems, cartItem];
    });

    showToast(
      `Added ${safeQuantity}x ${product.name} to your cart! 😋`
    );
  };

  // UPDATE QUANTITY
  const updateQuantity = (cartItemId, delta) => {
    setItems(prevItems =>
      prevItems
        .map(item => {
          if (item.cartItemId !== cartItemId) {
            return item;
          }

          const newQuantity = item.quantity + delta;

          if (newQuantity <= 0) {
            return null;
          }

          return {
            ...item,
            quantity: newQuantity,
            itemTotal: newQuantity * item.unitPrice
          };
        })
        .filter(Boolean)
    );
  };

  // REMOVE ITEM
  const removeItem = (cartItemId) => {
    setItems(prevItems =>
      prevItems.filter(
        item => item.cartItemId !== cartItemId
      )
    );
  };

  // CLEAR CART
  const clearCart = () => {
    setItems([]);
  };

  // APPLY SERVER PRICES
  // The server sends back the latest admin prices (same order as the
  // cart items it received) when a price changed before checkout.
  const applyServerPrices = (pricedItems) => {
    if (!Array.isArray(pricedItems)) return;

    setItems(prevItems =>
      prevItems.map((item, index) => {
        const priced = pricedItems[index];

        if (!priced || priced.productId !== item.productId) {
          return item;
        }

        const unitPrice = Number(priced.priceAtOrder) || 0;

        return {
          ...item,
          unitPrice,
          itemTotal: unitPrice * item.quantity,
          addons: Array.isArray(priced.addons) ? priced.addons : item.addons,
          variant: item.variant
            ? { ...item.variant, price: unitPrice - (priced.addons || []).reduce((s, a) => s + Number(a.price || 0), 0) }
            : item.variant
        };
      })
    );
  };

  // CART CALCULATIONS
  const itemsCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.itemTotal,
    0
  );

  // Delivery & packing charges set by the admin; delivery depends on
  // whether a chef on duty today is in the customer's hostel.
  const orderType =
    items.length > 0 && items.every(item => item.productType === 'zuxu') ? 'zuxu' : 'food';

  const { deliveryFee, packagingFee, total, sameHostel } = computeFees({
    settings: feeSettings,
    subtotal,
    hostel: user?.hostel,
    deliveryType: 'room_delivery',
    orderType
  });

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyServerPrices,

        itemsCount,
        subtotal,
        deliveryFee,
        packagingFee,
        total,
        sameHostel,
        orderType,

        feeSettings,
        refreshFeeSettings,

        toastMessage
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
