import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer({ isOpen, onClose, onProceedToCheckout }) {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    deliveryFee,
    packagingFee,
    total
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Slide-in Drawer */}
      <div className="relative z-10 w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-brand-cream/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-yellow flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5 text-brand-black" />
            </div>
            <div>
              <h2 className="text-lg font-black text-brand-black leading-none">Your Cravings Cart</h2>
              <span className="text-xs text-gray-500 font-semibold">{items.length} unique items</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Item List */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-brand-yellowLight rounded-3xl flex items-center justify-center mb-4 text-3xl shadow-inner">
              🍜
            </div>
            <h3 className="text-lg font-extrabold text-brand-black mb-1">Your cart is feeling lonely</h3>
            <p className="text-xs text-gray-500 max-w-xs mb-6">
              Bhook_Lgi has fresh bhel, cooked maggie, chips, and snacks ready for late night cravings!
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-brand-yellow text-brand-black font-bold text-xs rounded-2xl shadow-yellow-glow hover:bg-brand-yellowHover transition-all"
            >
              Explore Hostel Menu
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-brand-cream/50 rounded-2xl p-3.5 border border-gray-100 flex items-start gap-3 shadow-xs"
              >
                {/* Thumb */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 bg-white border border-gray-100"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-extrabold text-brand-black text-sm leading-snug">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeItem(item.cartItemId)}
                      className="text-gray-400 hover:text-brand-chili p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Portion & Customizations */}
                  <div className="text-[11px] text-gray-500 mt-0.5 space-y-0.5">
                    {item.variantName && (
                      <div className="font-semibold text-gray-700">{item.variantName}</div>
                    )}
                    {item.spiceLevel && (
                      <div className="flex items-center gap-1 font-bold">
                        <span>{item.spiceLevel === 'spicy' ? '🌶️ Spicy' : '🙂 Non-Spicy'}</span>
                      </div>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div className="text-[10px] text-gray-600 font-medium">
                        + {item.addons.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/60">
                    <div className="flex items-center bg-white border border-gray-200 rounded-xl p-0.5 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-brand-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-brand-black">
                        ₹{item.itemTotal}
                      </span>
                      <span className="block text-[9px] text-gray-400">
                        ₹{item.unitPrice} each
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart link */}
            <div className="text-right pt-1">
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-gray-400 hover:text-brand-chili transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}

        {/* Bill Summary & Proceed Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 space-y-3">
            {/* Bill Details */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-brand-black">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Hostel Delivery Charge</span>
                <span className="font-bold text-brand-black">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-extrabold uppercase">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Late Night Packaging</span>
                <span className="font-bold text-brand-black">₹{packagingFee}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-black text-brand-black">
                <span>To Pay</span>
                <span className="text-base text-brand-black">₹{total}</span>
              </div>
            </div>

            {/* Free Delivery Banner */}
            {subtotal < 120 && (
              <p className="text-[11px] text-center font-bold text-brand-yellowHover bg-brand-yellowLight/80 py-1.5 px-2 rounded-xl">
                Add ₹{120 - subtotal} more for <strong className="text-brand-black">FREE Hostel Delivery</strong>!
              </p>
            )}

            {/* Proceed to Order Button */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 px-5 bg-brand-yellow hover:bg-brand-yellowHover text-brand-black font-black text-sm rounded-2xl shadow-yellow-glow flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-2">
                <span>Proceed to Order</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="bg-brand-black text-brand-yellow px-3 py-1 rounded-xl text-xs font-black">
                ₹{total}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
