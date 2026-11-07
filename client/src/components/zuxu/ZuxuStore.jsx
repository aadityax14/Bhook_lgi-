
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  Eye,
  Tag
} from 'lucide-react';

import ZuxuProductDetails from '../ZuxuProductDetails';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';

const PRICE_FILTERS = [
  { id: 'under99', label: 'Under ₹99' },
  { id: 'under199', label: 'Under ₹199' },
  { id: 'under299', label: 'Under ₹299' },
  { id: 'all', label: 'All Products' },
];

export default function ZuxuStore({ onBack }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  const { addToCart } = useCart();

  // LOAD ZUXU PRODUCTS
  const loadProducts = async () => {
    try {
      setError('');

      const response = await api.getProducts();

      const allProducts = Array.isArray(response?.data)
        ? response.data
        : [];

      const zuxuProducts = allProducts.filter(product => {
        const isZuxu =
          String(product.categoryId || '').toLowerCase() === 'zuxu' ||
          product.storeId === 'store-zuxu';

        const isActive = product.isActive !== false;
        const isAvailable = product.isAvailable !== false;

        return isZuxu && isActive && isAvailable;
      });

      setProducts(zuxuProducts);
    } catch (err) {
      console.error('Could not load Zuxu products:', err);
      setError('Could not load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // PRICE FILTERS
  const filteredProducts = useMemo(() => {
    switch (activeFilter) {
      case 'under99':
        return products.filter(product => Number(product.price) <= 99);

      case 'under199':
        return products.filter(product => Number(product.price) <= 199);

      case 'under299':
        return products.filter(product => Number(product.price) <= 299);

      default:
        return products;
    }
  }, [activeFilter, products]);

  // QUICK ADD TO CART
  const handleAddToCart = (product, event) => {
    event?.stopPropagation();

    addToCart(product, {
      variant: null,
      spiceLevel: null,
      addons: [],
      quantity: 1,
      productType: 'zuxu'
    });
  };

  // WISHLIST
  const toggleWishlist = (productId, event) => {
    event?.stopPropagation();

    setWishlist(previous =>
      previous.includes(productId)
        ? previous.filter(id => id !== productId)
        : [...previous, productId]
    );
  };

  // PRODUCT DETAIL VIEW
  const openProductDetails = (product) => {
    setSelectedProduct(product);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-brand-cream pb-24">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back</span>
          </button>

          <div className="text-center">
            <div className="font-black text-lg text-brand-black">
              Zuxu<span className="text-brand-yellow">.</span>
            </div>

            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Handmade Gifts
            </div>
          </div>

          <div className="w-20" />
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] bg-brand-black text-white p-6 sm:p-8 mb-6">

          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand-yellow/20 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-pink-400/10 blur-2xl" />

          <div className="relative">

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-brand-yellow text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Handmade with love
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Something cute,
              <br />
              <span className="text-brand-yellow">just for you.</span>
            </h1>

            <p className="text-sm text-gray-300 mt-3 max-w-md leading-relaxed">
              Discover handmade gifts, crochet creations and cute accessories
              from Zuxu.
            </p>

            <div className="flex items-center gap-2 mt-5 text-xs font-bold text-gray-300">
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              Made by students, made with love.
            </div>

          </div>
        </section>

        {/* STORE INFO */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-4 mb-6">

          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow flex items-center justify-center text-2xl">
                🧶
              </div>

              <div>
                <h2 className="font-black text-brand-black">Zuxu</h2>
                <p className="text-xs text-gray-500">
                  Handmade Gifts & Accessories
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-emerald-600">
                ● Open
              </div>

              <div className="text-[10px] text-gray-400">
                Student Seller
              </div>
            </div>

          </div>
        </div>

        {/* FEATURED PRODUCTS */}
        {!loading && !error && products.some(product => product.isFeatured) && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-pink-500" />
              <h2 className="font-black text-lg text-brand-black">
                Featured Creations
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {products
                .filter(product => product.isFeatured)
                .map(product => {
                  const image =
                    product.images?.[0] ||
                    product.imageUrl ||
                    product.image;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openProductDetails(product)}
                      className="relative shrink-0 w-36 sm:w-44 text-left bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-soft"
                    >
                      <div className="aspect-square bg-brand-creamDark">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-4xl">
                            🎁
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <p className="text-xs font-black text-brand-black line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-sm font-black mt-1">
                          ₹{product.price}
                        </p>
                      </div>

                      <span className="absolute top-2 left-2 bg-brand-yellow text-brand-black text-[9px] font-black px-2 py-1 rounded-full">
                        FEATURED
                      </span>
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {/* PRICE FILTERS */}
        <div className="mb-6">

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-lg text-brand-black">
              Shop by Price
            </h2>

            <span className="text-xs text-gray-400 font-semibold">
              {filteredProducts.length} products
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {PRICE_FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  activeFilter === filter.id
                    ? 'bg-brand-black text-brand-yellow shadow-md'
                    : 'bg-white text-gray-600 border border-gray-100 hover:border-brand-yellow'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
            <RefreshCw className="w-7 h-7 mx-auto animate-spin text-brand-yellow" />
            <p className="text-sm text-gray-500 mt-3">
              Loading Zuxu products...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="bg-white rounded-3xl p-10 text-center border border-red-100">
            <p className="text-sm text-red-500">{error}</p>

            <button
              onClick={() => {
                setLoading(true);
                loadProducts();
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-brand-black text-white text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
            <div className="text-4xl mb-3">🎁</div>

            <h3 className="font-black text-brand-black">
              No products here yet
            </h3>

            <p className="text-xs text-gray-400 mt-1">
              Zuxu will add more cute products soon.
            </p>
          </div>
        )}

        {/* PRODUCTS GRID */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">

            {filteredProducts.map(product => {
              const image =
                product.images?.[0] ||
                product.image ||
                product.imageUrl;

              const category =
                product.category || 'Handmade Gifts';

              const price = Number(product.price || 0);
              const mrp = Number(product.mrp || price);

              const discount = mrp > price
                ? Math.round(((mrp - price) / mrp) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => openProductDetails(product)}
                  className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-soft hover:shadow-card-lift transition-all cursor-pointer"
                >

                  {/* PRODUCT IMAGE */}
                  <div className="relative aspect-square bg-brand-creamDark overflow-hidden">

                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="text-5xl mb-2">🎁</div>
                        <span className="text-[10px] font-bold text-gray-400">
                          Zuxu
                        </span>
                      </div>
                    )}

                    {discount > 0 && (
                      <div className="absolute top-2 left-2 bg-pink-600 text-white text-[9px] font-black px-2 py-1 rounded-full">
                        {discount}% OFF
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={event => toggleWishlist(product.id, event)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm"
                      aria-label="Toggle wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          wishlist.includes(product.id)
                            ? 'text-pink-500 fill-pink-500'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>

                    {product.isFeatured && (
                      <div className="absolute bottom-2 left-2 bg-brand-yellow text-brand-black text-[9px] font-black px-2 py-1 rounded-full">
                        FEATURED
                      </div>
                    )}

                  </div>

                  {/* PRODUCT DETAILS */}
                  <div className="p-3">

                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                      {category}
                    </span>

                    <h3 className="font-black text-sm text-brand-black mt-1 leading-tight line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="flex items-center flex-wrap gap-1.5 mt-3">

                      <span className="text-lg font-black text-brand-black">
                        ₹{price}
                      </span>

                      {mrp > price && (
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{mrp}
                        </span>
                      )}

                    </div>

                    <div className="flex gap-2 mt-3">

                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          openProductDetails(product);
                        }}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-brand-black text-[10px] font-black flex items-center justify-center gap-1 hover:border-brand-yellow transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>

                      <button
                        type="button"
                        onClick={event => handleAddToCart(product, event)}
                        className="w-9 h-9 shrink-0 rounded-xl bg-brand-yellow text-brand-black flex items-center justify-center hover:bg-brand-yellowHover active:scale-95 transition-all"
                        aria-label={`Quick add ${product.name} to cart`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* BOTTOM NOTE */}
        <div className="mt-8 bg-brand-yellowLight rounded-3xl p-5 text-center border border-brand-yellow/20">
          <div className="text-2xl mb-2">💛</div>

          <h3 className="font-black text-brand-black">
            More cute things are coming
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Zuxu is growing its handmade collection.
          </p>
        </div>

      </main>

      {/* PRODUCT DETAIL POPUP */}
      {selectedProduct && (
        <ZuxuProductDetails
          product={selectedProduct}
          onClose={closeProductDetails}
        />
      )}

    </div>
  );
}
