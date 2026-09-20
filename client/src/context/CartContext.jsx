import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

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
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  const addToCart = (product, customization = {}) => {
    const {
      variant = null,
      spiceLevel = product.allowsSpiceCustomization ? 'spicy' : null,
      addons = [],
      quantity = 1
    } = customization;

    const basePrice = variant ? variant.price : product.price;
    const addonsPrice = addons.reduce((sum, a) => sum + (a.price || 0), 0);
    const unitPrice = basePrice + addonsPrice;

    // Generate unique signature for customized item
    const addonKey = addons.map(a => a.id || a.name).sort().join('_');
    const cartItemId = `${product.id}-${variant?.name || 'def'}-${spiceLevel || 'none'}-${addonKey}`;

    setItems(prevItems => {
      const existingIdx = prevItems.findIndex(i => i.cartItemId === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prevItems];
        updated[existingIdx].quantity += quantity;
        updated[existingIdx].itemTotal = updated[existingIdx].quantity * unitPrice;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            cartItemId,
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            variantName: variant?.name || null,
            spiceLevel,
            addons: addons.map(a => a.name),
            unitPrice,
            quantity,
            itemTotal: quantity * unitPrice
          }
        ];
      }
    });

    showToast(`Added ${quantity}x ${product.name} to cravings cart! 😋`);
  };

  const updateQuantity = (cartItemId, delta) => {
    setItems(prevItems => {
      return prevItems
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              itemTotal: newQty * item.unitPrice
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeItem = (cartItemId) => {
    setItems(prevItems => prevItems.filter(i => i.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const deliveryFee = subtotal === 0 ? 0 : (subtotal >= 120 ? 0 : 10);
  const packagingFee = subtotal === 0 ? 0 : 5;
  const total = subtotal + deliveryFee + packagingFee;

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
