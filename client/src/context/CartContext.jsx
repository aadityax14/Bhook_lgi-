
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

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

  // CART CALCULATIONS
  const itemsCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.itemTotal,
    0
  );

  // Existing Bhook_Lgi fee logic preserved
  const deliveryFee =
    subtotal === 0 ? 0 : subtotal >= 120 ? 0 : 10;

  const packagingFee =
    subtotal === 0 ? 0 : 5;

  const total =
    subtotal + deliveryFee + packagingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,

        itemsCount,
        subtotal,
        deliveryFee,
        packagingFee,
        total,

        toastMessage
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
