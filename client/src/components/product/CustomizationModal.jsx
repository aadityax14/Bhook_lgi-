import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CustomizationModal({ product, onClose }) {
  const { addToCart } = useCart();

  // Selection states
  const [selectedVariant, setSelectedVariant] = useState(() => {
    return product?.variants && product.variants.length > 0 ? product.variants[0] : null;
  });

  const [spiceLevel, setSpiceLevel] = useState('spicy'); // 'spicy' or 'non-spicy'
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  // Calculate live dynamic price
  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const addonsTotal = selectedAddons.reduce((sum, item) => sum + item.price, 0);
  const liveUnitPrice = basePrice + addonsTotal;
  const liveTotalPrice = liveUnitPrice * quantity;

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.some(a => a.id === addon.id || a.name === addon.name);
      if (exists) {
        return prev.filter(a => a.id !== addon.id && a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = () => {
    addToCart(product, {
      variant: selectedVariant,
      spiceLevel: product.allowsSpiceCustomization ? spiceLevel : null,
      addons: selectedAddons,
      quantity
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal / Bottom Sheet */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-bounce-in">
        {/* Header Bar */}
        <div className="relative h-44 sm:h-52 w-full bg-gray-100 shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Product Banner Info */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-yellow">
              {product.categoryId?.toUpperCase() || 'SNACK'}
            </span>
            <h2 className="text-2xl font-black leading-tight text-white mt-0.5">
              {product.name}
            </h2>
            <div className="text-xs text-gray-200 line-clamp-1 mt-1 font-medium">
              {product.description}
            </div>
          </div>
        </div>

        {/* Customization Options Scrollable Area */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Portion / Variant Selector if applicable */}
          {product.variants && product.variants.length > 1 && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                Choose Size / Portion
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.name === variant.name;
                  return (
                    <button
                      key={variant.name}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-brand-yellow bg-brand-yellowLight/50 text-brand-black shadow-xs font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-xs">{variant.name}</span>
                      <span className="text-xs font-black">₹{variant.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spice Preference */}
          {product.allowsSpiceCustomization && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500">
                  Spice Preference
                </label>
                <span className="text-[11px] font-bold text-brand-yellowHover bg-brand-yellowLight px-2 py-0.5 rounded-full">
                  Hostel Style
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSpiceLevel('spicy')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                    spiceLevel === 'spicy'
                      ? 'border-red-500 bg-red-50/70 text-red-900 font-bold shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-2xl">🌶️</span>
                  <div className="text-left">
                    <div className="text-sm font-extrabold">Spicy</div>
                    <div className="text-[10px] text-gray-500">Kick of masala & chili</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSpiceLevel('non-spicy')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                    spiceLevel === 'non-spicy'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-2xl">🙂</span>
                  <div className="text-left">
                    <div className="text-sm font-extrabold">Non-Spicy</div>
                    <div className="text-[10px] text-gray-500">Mild, sweet & tangy</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Add-ons Checklist */}
          {product.addons && product.addons.length > 0 && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                Craving Add-ons (Optional)
              </label>
              <div className="space-y-2">
                {product.addons.map((addon) => {
                  const isChecked = selectedAddons.some(a => a.id === addon.id || a.name === addon.name);
                  return (
                    <div
                      key={addon.id || addon.name}
                      onClick={() => toggleAddon(addon)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-brand-yellow bg-brand-yellowLight/40'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                            isChecked
                              ? 'bg-brand-yellow text-brand-black'
                              : 'border border-gray-300 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-brand-black">
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-gray-800">
                        +₹{addon.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Quantity Stepper and Live Price Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 disabled:opacity-40"
              disabled={quantity <= 1}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-black text-brand-black">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3.5 px-4 bg-brand-yellow hover:bg-brand-yellowHover text-brand-black font-black text-sm rounded-2xl shadow-yellow-glow flex items-center justify-between transition-all active:scale-98"
          >
            <span>Add to Cart</span>
            <span className="bg-brand-black text-brand-yellow px-2.5 py-0.5 rounded-xl text-xs font-black">
              ₹{liveTotalPrice}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
