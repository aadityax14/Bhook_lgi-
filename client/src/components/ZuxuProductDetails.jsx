
import React, { useMemo, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Heart,
  Truck,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const formatPrice = (value) => `₹${Number(value || 0).toFixed(0)}`;

const getVariantId = (variant) =>
  variant?.id || variant?.name || String(variant?.price || '');

export default function ZuxuProductDetails({ product, onClose }) {
  const { addToCart } = useCart();

  const images = useMemo(() => {
    const allImages = [
      ...(Array.isArray(product?.images) ? product.images : []),
      product?.imageUrl,
      product?.image
    ];

    return [...new Set(
      allImages.filter(image => typeof image === 'string' && image.trim())
    )];
  }, [product]);

  const variants = Array.isArray(product?.variants)
    ? product.variants
    : [];

  const customizationFields = Array.isArray(product?.customization?.fields)
    ? product.customization.fields
    : Array.isArray(product?.customizationOptions)
      ? product.customizationOptions
      : [];

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants.length ? getVariantId(variants[0]) : ''
  );
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState({});
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) return null;

  const selectedVariant = variants.find(
    variant => getVariantId(variant) === selectedVariantId
  ) || null;

  const currentPrice = Number(
    selectedVariant?.price ?? product.price ?? 0
  );

  const mrp = Number(product.mrp || product.price || 0);

  const discount = mrp > currentPrice
    ? Math.round(((mrp - currentPrice) / mrp) * 100)
    : 0;

  const stock = Number(product.stockQuantity ?? 0);

  const isOutOfStock =
    product.isAvailable === false ||
    product.isActive === false ||
    (product.stockQuantity !== undefined && stock <= 0);

  const changeCustomization = (fieldName, value) => {
    setCustomization(previous => ({
      ...previous,
      [fieldName]: value
    }));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    const missingRequired = customizationFields.find(field => {
      if (!field.required) return false;

      const value = customization[field.name];

      return value === undefined || value === null || value === '';
    });

    if (missingRequired) {
      alert(`Please select ${missingRequired.label || missingRequired.name}`);
      return;
    }

    const finalCustomization = {
      ...customization,
      ...(note.trim() ? { customerNote: note.trim() } : {})
    };

    addToCart(product, {
      variant: selectedVariant,
      quantity,
      customization: finalCustomization,
      productType: 'zuxu'
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const nextImage = () => {
    setActiveImage(current =>
      images.length ? (current + 1) % images.length : 0
    );
  };

  const previousImage = () => {
    setActiveImage(current =>
      images.length ? (current - 1 + images.length) % images.length : 0
    );
  };

  const delivery = product.delivery || {};
  const deliveryDays =
    delivery.estimatedDays || product.deliveryEstimate || '3–7 days';

  const deliveryCharge = Number(delivery.charge ?? 0);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl my-auto">

          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] font-bold text-pink-600">
                ZUXU
              </p>
              <p className="text-sm text-gray-500">Handmade with love</p>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              aria-label="Close product details"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-7">

            {/* Product Gallery */}
            <div>
              <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[activeImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={42} />
                    <span className="mt-2 text-sm">No product image</span>
                  </div>
                )}

                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-pink-600 text-white text-xs font-bold px-3 py-2 rounded-full">
                    {discount}% OFF
                  </span>
                )}

                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow"
                  aria-label="Add to wishlist"
                >
                  <Heart
                    size={20}
                    className={isWishlisted ? 'fill-pink-500 text-pink-500' : 'text-gray-700'}
                  />
                </button>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setActiveImage(index)}
                      className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 ${
                        activeImage === index
                          ? 'border-pink-500'
                          : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="flex flex-col">
              <div className="mb-2">
                <p className="text-xs uppercase tracking-widest text-pink-600 font-bold">
                  {product.brand || 'Zuxu Collection'}
                </p>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {product.name}
                </h1>

                {product.categoryName && (
                  <p className="text-sm text-gray-500 mt-1">
                    {product.categoryName}
                  </p>
                )}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mt-2">
                {product.description || 'A handmade creation, carefully made with love.'}
              </p>

              {/* Price */}
              <div className="flex items-center gap-3 mt-5">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(currentPrice)}
                </span>

                {mrp > currentPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(mrp)}
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      Save {formatPrice(mrp - currentPrice)}
                    </span>
                  </>
                )}
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Choose your variant
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant, index) => {
                      const id = getVariantId(variant);
                      const selected = selectedVariantId === id;
                      const unavailable =
                        variant.isAvailable === false ||
                        variant.stockQuantity === 0;

                      return (
                        <button
                          key={id || index}
                          disabled={unavailable}
                          onClick={() => setSelectedVariantId(id)}
                          className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                            selected
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-200 text-gray-700 hover:border-pink-300'
                          } ${unavailable ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                        >
                          {variant.name || variant.label || `Option ${index + 1}`}
                          {variant.price !== undefined && (
                            <span className="ml-2">
                              {formatPrice(variant.price)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customization Fields */}
              {customizationFields.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Customize your product
                  </h3>

                  {customizationFields.map((field, index) => {
                    const fieldName = field.name || `field_${index}`;
                    const fieldType = field.type || 'text';
                    const options = field.options || [];

                    return (
                      <div key={fieldName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label || field.name}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>

                        {fieldType === 'select' || fieldType === 'dropdown' ? (
                          <select
                            value={customization[fieldName] || ''}
                            onChange={event =>
                              changeCustomization(fieldName, event.target.value)
                            }
                            className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-pink-500"
                          >
                            <option value="">Select an option</option>
                            {options.map((option, optionIndex) => (
                              <option
                                key={optionIndex}
                                value={typeof option === 'string' ? option : option.value || option.name}
                              >
                                {typeof option === 'string' ? option : option.label || option.name}
                              </option>
                            ))}
                          </select>
                        ) : fieldType === 'textarea' ? (
                          <textarea
                            value={customization[fieldName] || ''}
                            onChange={event =>
                              changeCustomization(fieldName, event.target.value)
                            }
                            placeholder={field.placeholder || 'Enter details'}
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-pink-500"
                          />
                        ) : fieldType === 'checkbox' ? (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={Boolean(customization[fieldName])}
                              onChange={event =>
                                changeCustomization(fieldName, event.target.checked)
                              }
                              className="accent-pink-600"
                            />
                            {field.checkboxLabel || 'Yes, I want this'}
                          </label>
                        ) : fieldType === 'radio' ? (
                          <div className="flex flex-wrap gap-3">
                            {options.map((option, optionIndex) => {
                              const value = typeof option === 'string'
                                ? option
                                : option.value || option.name;

                              return (
                                <label
                                  key={optionIndex}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <input
                                    type="radio"
                                    name={fieldName}
                                    value={value}
                                    checked={customization[fieldName] === value}
                                    onChange={() =>
                                      changeCustomization(fieldName, value)
                                    }
                                    className="accent-pink-600"
                                  />
                                  {typeof option === 'string'
                                    ? option
                                    : option.label || option.name}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={customization[fieldName] || ''}
                            onChange={event =>
                              changeCustomization(fieldName, event.target.value)
                            }
                            placeholder={field.placeholder || 'Enter your preference'}
                            className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-pink-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Customer Note */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Special instructions (optional)
                </label>
                <textarea
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  rows={2}
                  placeholder="Any special message or request?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-pink-500"
                />
              </div>

              {/* Delivery */}
              <div className="mt-5 p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Truck size={17} className="text-pink-600" />
                  Estimated delivery: <strong>{deliveryDays}</strong>
                </div>

                <p className="text-xs text-gray-500">
                  {deliveryCharge > 0
                    ? `Delivery charge: ${formatPrice(deliveryCharge)}`
                    : 'Delivery charges will be calculated at checkout.'}
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between mt-6">
                <span className="font-semibold text-gray-800">Quantity</span>

                <div className="flex items-center gap-4 border rounded-xl px-3 py-2">
                  <button
                    onClick={() => setQuantity(value => Math.max(1, value - 1))}
                    disabled={quantity <= 1}
                    className="disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="font-semibold w-5 text-center">
                    {quantity}
                  </span>

                  <button
                    onClick={() => setQuantity(value => value + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full mt-5 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : added
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-900 text-white hover:bg-pink-600'
                }`}
              >
                {isOutOfStock ? (
                  'Currently unavailable'
                ) : added ? (
                  <>
                    <Check size={19} />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={19} />
                    Add to Cart · {formatPrice(currentPrice * quantity)}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Handmade especially for you ❤️
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
