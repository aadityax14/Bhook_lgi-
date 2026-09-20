import React from 'react';
import { Plus, Flame, Ban } from 'lucide-react';

export default function ProductCard({ product, onSelectProduct, onQuickAdd }) {
  const isAvailable = product.isAvailable !== false;

  const handleAction = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;

    // If product has variants, spice choices, or addons, open customization bottom sheet
    if (product.allowsSpiceCustomization || (product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0)) {
      onSelectProduct(product);
    } else {
      // Quick add for simple items like chips/packets
      onQuickAdd(product);
    }
  };

  return (
    <div
      onClick={() => isAvailable && onSelectProduct(product)}
      className={`group relative bg-white rounded-3xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
        isAvailable
          ? 'border-gray-100 shadow-soft hover:shadow-card-lift hover:border-brand-yellow/50 cursor-pointer active:scale-[0.99]'
          : 'border-gray-100 opacity-65 bg-gray-50/80 cursor-not-allowed'
      }`}
    >
      {/* Top Image & Badge Section */}
      <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden bg-gray-100 mb-3">
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isAvailable ? 'group-hover:scale-105' : 'grayscale contrast-75'
          }`}
          loading="lazy"
        />

        {/* Availability Badge */}
        <div className="absolute top-2.5 left-2.5">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-brand-black/90 backdrop-blur-md text-brand-chili text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
              <Ban className="w-2.5 h-2.5" />
              Out of Stock
            </span>
          )}
        </div>

        {/* Cooked / Fresh Tag */}
        {product.isCooked && isAvailable && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 bg-brand-yellow text-brand-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
              <Flame className="w-2.5 h-2.5 fill-brand-black" />
              Cooked
            </span>
          </div>
        )}

        {/* Spice indicator chip */}
        {product.allowsSpiceCustomization && isAvailable && (
          <div className="absolute bottom-2 left-2.5">
            <span className="bg-brand-black/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              🌶️ Customizable Spice
            </span>
          </div>
        )}
      </div>

      {/* Body Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-extrabold text-brand-black text-base sm:text-lg leading-tight group-hover:text-brand-yellowHover transition-colors">
              {product.name}
            </h3>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
            {product.description}
          </p>
        </div>

        {/* Footer: Price & Add Button */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Price</span>
            <div className="text-lg font-black text-brand-black tracking-tight">
              ₹{product.price}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAction}
            disabled={!isAvailable}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
              isAvailable
                ? 'bg-brand-yellow hover:bg-brand-yellowHover text-brand-black shadow-xs hover:shadow-yellow-glow active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAvailable ? (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>ADD</span>
              </>
            ) : (
              <span>Unavailable</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
