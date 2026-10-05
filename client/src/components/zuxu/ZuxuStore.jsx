import React, { useMemo, useState } from 'react';
import { ArrowLeft, Heart, Sparkles, ShoppingBag } from 'lucide-react';

const ZUXU_PRODUCTS = [
  {
    id: 'zuxu-demo-1',
    name: 'Crochet Rose',
    description: 'Handmade crochet rose, perfect for gifting.',
    price: 99,
    image: '',
    category: 'Flowers',
  },
  {
    id: 'zuxu-demo-2',
    name: 'Cute Crochet Octopus',
    description: 'Small handmade octopus for your desk or gift box.',
    price: 149,
    image: '',
    category: 'Cute Gifts',
  },
  {
    id: 'zuxu-demo-3',
    name: 'Handmade Hairpin',
    description: 'Cute handmade accessory for everyday styling.',
    price: 55,
    image: '',
    category: 'Accessories',
  },
];

const PRICE_FILTERS = [
  { id: 'under99', label: 'Under ₹99' },
  { id: 'under199', label: 'Under ₹199' },
  { id: 'under299', label: 'Under ₹299' },
  { id: 'all', label: 'All Products' },
];

export default function ZuxuStore({ onBack }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    switch (activeFilter) {
      case 'under99':
        return ZUXU_PRODUCTS.filter(product => product.price <= 99);

      case 'under199':
        return ZUXU_PRODUCTS.filter(product => product.price <= 199);

      case 'under299':
        return ZUXU_PRODUCTS.filter(product => product.price <= 299);

      default:
        return ZUXU_PRODUCTS;
    }
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-brand-cream pb-24">

      {/* Header */}
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

        {/* Hero */}
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

        {/* Store Info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-4 mb-6">

          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-brand-yellow flex items-center justify-center text-2xl">
                🧶
              </div>

              <div>
                <h2 className="font-black text-brand-black">
                  Zuxu
                </h2>

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

        {/* Price Filters */}
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

        {/* Products */}
        {filteredProducts.length === 0 ? (

          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
            <div className="text-4xl mb-3">🎁</div>

            <h3 className="font-black text-brand-black">
              No products here yet
            </h3>

            <p className="text-xs text-gray-400 mt-1">
              Zuxu will add more cute products soon.
            </p>
          </div>

        ) : (

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">

            {filteredProducts.map(product => (

              <div
                key={product.id}
                className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-soft hover:shadow-card-lift transition-all"
              >

                {/* Product Image */}
                <div className="relative aspect-square bg-brand-creamDark overflow-hidden">

                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">

                      <div className="text-5xl mb-2">
                        🎁
                      </div>

                      <span className="text-[10px] font-bold text-gray-400">
                        Zuxu
                      </span>

                    </div>
                  )}

                  <button
                    type="button"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm"
                  >
                    <Heart className="w-4 h-4 text-gray-600" />
                  </button>

                </div>

                {/* Product Details */}
                <div className="p-3">

                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                    {product.category}
                  </span>

                  <h3 className="font-black text-sm text-brand-black mt-1 leading-tight">
                    {product.name}
                  </h3>

                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-3">

                    <div>
                      <span className="text-lg font-black text-brand-black">
                        ₹{product.price}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="w-9 h-9 rounded-xl bg-brand-yellow text-brand-black flex items-center justify-center hover:bg-brand-yellowHover active:scale-95 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* Bottom Note */}
        <div className="mt-8 bg-brand-yellowLight rounded-3xl p-5 text-center border border-brand-yellow/20">

          <div className="text-2xl mb-2">
            💛
          </div>

          <h3 className="font-black text-brand-black">
            More cute things are coming
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Zuxu is growing its handmade collection.
          </p>

        </div>

      </main>
    </div>
  );
}