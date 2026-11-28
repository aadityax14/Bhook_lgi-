import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  MapPinOff,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { resolveMediaUrl } from '../../services/api';
import { isAvailableInHostel, availableHostelsOf } from '../../utils/availability';
import { computeFees } from '../../utils/fees';
import ProductReviews from '../zuxu/ProductReviews';
import { Lightbox } from '../zuxu/ZuxuShared';

const MAX_QTY = 20;

/*
 * Full-screen product page for Bhook_Lgi items (like food apps):
 * photo gallery, details, size, spice, extras, quantity, Add to cart,
 * delivery info and customer reviews with photos.
 */
export default function ProductDetailsPage({ product, onClose, onOpenCart }) {
  const { addToCart, items, feeSettings } = useCart();
  const { user } = useAuth();

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const addons = Array.isArray(product?.addons) ? product.addons : [];

  const images = useMemo(() => {
    const all = [...(Array.isArray(product?.images) ? product.images : []), product?.imageUrl];
    return [...new Set(all.filter((src) => typeof src === 'string' && src.trim()))];
  }, [product]);

  const [activeImage, setActiveImage] = useState(0);
  // Width ÷ height of the photo on show (frame follows it)
  const [imageRatio, setImageRatio] = useState(4 / 3);
  const [lightboxAt, setLightboxAt] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [spiceLevel, setSpiceLevel] = useState('spicy');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [rating, setRating] = useState(null);
  const reviewsRef = useRef(null);
  const touchX = useRef(0);

  if (!product) return null;

  // ---- Availability ----
  const inStock = product.isAvailable !== false;
  const inMyHostel = isAvailableInHostel(product, user?.hostel);
  const kitchenClosed = feeSettings?.kitchenOpen === false;
  const canAdd = inStock && inMyHostel;

  // ---- Live price ----
  const basePrice = Number(selectedVariant?.price ?? product.price ?? 0);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  // Delivery to the customer's hostel (same rule as checkout)
  const { deliveryFee, sameHostel } = computeFees({
    settings: feeSettings,
    subtotal: Math.max(totalPrice, 1),
    hostel: user?.hostel,
    deliveryType: 'room_delivery',
    orderType: 'food',
  });

  const inCart = items
    .filter((item) => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => (a.id || a.name) === (addon.id || addon.name))
        ? prev.filter((a) => (a.id || a.name) !== (addon.id || addon.name))
        : [...prev, addon]
    );
  };

  const go = (delta) => {
    if (images.length < 2) return;
    setActiveImage((i) => (i + delta + images.length) % images.length);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    addToCart(product, {
      variant: selectedVariant,
      spiceLevel: product.allowsSpiceCustomization ? spiceLevel : null,
      addons: selectedAddons,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-brand-cream overflow-y-auto" role="dialog" aria-modal="true" aria-label={product.name}>
      {/* ================= TOP BAR ================= */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-bold hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <p className="font-black text-sm truncate">{product.name}</p>
          <button
            onClick={() => {
              onClose();
              onOpenCart?.();
            }}
            className="relative w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-brand-black text-brand-yellow text-[10px] font-black flex items-center justify-center px-1">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pb-32">
        {/* ================= GALLERY ================= */}
        <div className="sm:px-4 sm:pt-4">
          <div
            // The frame takes the photo's own shape (no empty / blurred
            // box around it). Very tall photos are limited to 70% of the
            // screen height and centred.
            className="relative mx-auto bg-gray-100 sm:rounded-3xl overflow-hidden"
            style={{
              aspectRatio: String(imageRatio),
              width: `min(100%, calc(70vh * ${imageRatio}))`,
            }}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const diff = touchX.current - e.changedTouches[0].clientX;
              if (diff > 50) go(1);
              if (diff < -50) go(-1);
            }}
          >
            {images.length > 0 ? (
              <button
                type="button"
                className="block w-full h-full"
                onClick={() => setLightboxAt(activeImage)}
                aria-label="View photo full screen"
              >
                {/* Fills the frame (enlarged if the photo is smaller) */}
                <img
                  src={resolveMediaUrl(images[activeImage])}
                  alt={product.name}
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight } = e.currentTarget;
                    if (naturalWidth && naturalHeight) {
                      setImageRatio(naturalWidth / naturalHeight);
                    }
                  }}
                  className={`w-full h-full object-contain ${canAdd ? '' : 'grayscale-[40%]'}`}
                />
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🍜</div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${i === activeImage ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Status badge */}
            <div className="absolute top-3 left-3">
              {!inStock ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-black/90 px-3 py-1 text-xs font-black text-brand-chili">
                  <Ban className="w-3.5 h-3.5" /> Out of stock
                </span>
              ) : !inMyHostel ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-gray-700">
                  <MapPinOff className="w-3.5 h-3.5" /> Not available in {user?.hostel || 'your hostel'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Available
                </span>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 sm:px-0 pt-3">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 ${
                    i === activeImage ? 'border-brand-yellow' : 'border-transparent'
                  }`}
                >
                  <img src={resolveMediaUrl(src)} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 space-y-4 mt-4">
          {/* ================= INFO ================= */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-yellowHover">
                {product.categoryId || 'Snack'}
              </span>
              {product.isCooked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-black">
                  <Flame className="w-3 h-3" /> Cooked fresh
                </span>
              )}
              {product.allowsSpiceCustomization && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black">🌶️ Spice of your choice</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-brand-black leading-tight">{product.name}</h1>

            {rating?.count > 0 && (
              <button
                type="button"
                onClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-black text-white"
              >
                <Star className="w-3.5 h-3.5 fill-white" /> {rating.average}
                <span className="font-semibold text-white/85">· {rating.count} review{rating.count === 1 ? '' : 's'}</span>
              </button>
            )}

            <p className="mt-3 text-2xl font-black text-brand-black">
              ₹{basePrice}
              {selectedVariant && variants.length > 1 && (
                <span className="ml-2 text-sm font-bold text-gray-500">{selectedVariant.name}</span>
              )}
            </p>

            {product.description && (
              <p className="mt-3 text-sm leading-relaxed text-gray-600 whitespace-pre-line">{product.description}</p>
            )}

            {/* Notices */}
            <div className="mt-4 space-y-2">
              {!inStock && (
                <p className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700">
                  Out of stock right now — check back soon.
                </p>
              )}
              {inStock && !inMyHostel && (
                <p className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700">
                  Only available in {availableHostelsOf(product).join(', ')}.
                </p>
              )}
              {kitchenClosed && canAdd && (
                <p className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                  <Lock className="w-3.5 h-3.5" /> Kitchen is closed right now — you can add it to your cart and order when it opens.
                </p>
              )}
              {canAdd && (
                <p className="flex items-center gap-2 rounded-xl bg-brand-yellowLight/70 px-3 py-2 text-xs font-bold text-brand-black">
                  <Truck className="w-3.5 h-3.5" />
                  {deliveryFee === 0
                    ? `Free delivery to ${user?.hostel || 'your hostel'}`
                    : `Delivery ₹${deliveryFee} to ${user?.hostel || 'your hostel'}`}
                  {sameHostel && ' · chef in your hostel today 🎉'}
                </p>
              )}
            </div>
          </section>

          {/* ================= REVIEWS =================
              Right under the product (before the options) so customers
              see ratings and real customer photos first. */}
          <section ref={reviewsRef} className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
            <ProductReviews productId={product.id} onSummary={setRating} limit={2} />
          </section>

          {/* ================= SIZE ================= */}
          {variants.length > 1 && (
            <section className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3">Choose size / portion</h2>
              <div className="space-y-2">
                {variants.map((variant) => {
                  const on = (selectedVariant?.id || selectedVariant?.name) === (variant.id || variant.name);
                  return (
                    <button
                      key={variant.id || variant.name}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                        on ? 'border-brand-yellow bg-brand-yellowLight/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${on ? 'border-brand-black' : 'border-gray-300'}`}>
                          {on && <span className="w-2.5 h-2.5 rounded-full bg-brand-black" />}
                        </span>
                        <span className="text-sm font-bold">{variant.name}</span>
                      </span>
                      <span className="text-sm font-black">₹{variant.price}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= SPICE ================= */}
          {product.allowsSpiceCustomization && (
            <section className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3">Spice preference</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['spicy', '🌶️', 'Spicy', 'Kick of masala & chili', 'border-red-500 bg-red-50/70'],
                  ['non-spicy', '🙂', 'Non-spicy', 'Mild, sweet & tangy', 'border-emerald-500 bg-emerald-50/70'],
                ].map(([value, emoji, label, hint, activeClass]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSpiceLevel(value)}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition ${
                      spiceLevel === value ? activeClass : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span>
                      <span className="block text-sm font-extrabold">{label}</span>
                      <span className="block text-[10px] text-gray-500">{hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ================= EXTRAS ================= */}
          {addons.length > 0 && (
            <section className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3">Add extras (optional)</h2>
              <div className="space-y-2">
                {addons.map((addon) => {
                  const on = selectedAddons.some((a) => (a.id || a.name) === (addon.id || addon.name));
                  return (
                    <button
                      key={addon.id || addon.name}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      aria-pressed={on}
                      className={`w-full flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                        on ? 'border-brand-yellow bg-brand-yellowLight/40' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center ${on ? 'bg-brand-yellow' : 'border border-gray-300'}`}>
                          {on && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span className="text-sm font-bold">{addon.name}</span>
                      </span>
                      <span className="text-sm font-extrabold">+₹{addon.price}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>

      {/* ================= STICKY ADD TO CART ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
        <div
          className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {canAdd && (
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-7 text-center font-black">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
                disabled={quantity >= MAX_QTY}
                className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {!canAdd ? (
            <button
              type="button"
              disabled
              className="flex-1 py-3.5 rounded-2xl bg-gray-200 text-gray-500 font-black text-sm cursor-not-allowed"
            >
              {inStock ? `Not available in ${user?.hostel || 'your hostel'}` : 'Out of stock'}
            </button>
          ) : added ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCart?.();
              }}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-between"
            >
              <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Added · {inCart} in cart</span>
              <span className="underline">View cart</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-brand-yellow hover:bg-brand-yellowHover text-brand-black font-black text-sm shadow-yellow-glow flex items-center justify-between active:scale-[0.99]"
            >
              <span>Add to cart{inCart > 0 ? ` (${inCart} in cart)` : ''}</span>
              <span className="bg-brand-black text-brand-yellow px-2.5 py-1 rounded-xl text-xs font-black">₹{totalPrice}</span>
            </button>
          )}
        </div>
      </div>

      {lightboxAt !== null && (
        <Lightbox images={images} startIndex={lightboxAt} onClose={() => setLightboxAt(null)} />
      )}
    </div>
  );
}
