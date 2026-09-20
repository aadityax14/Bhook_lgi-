import React from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🔥' },
  { id: 'bhel', label: 'Bhel', icon: '🥗' },
  { id: 'maggie', label: 'Maggie', icon: '🍜' },
  { id: 'snacks', label: 'Snacks', icon: '🍿' },
  { id: 'biscuits', label: 'Biscuits', icon: '🍪' },
  { id: 'cooked', label: 'Cooked', icon: '🥡' },
  { id: 'uncooked', label: 'Uncooked', icon: '📦' }
];

export default function CategoryTabs({ activeCategory, onSelectCategory }) {
  return (
    <div className="sticky top-[61px] sm:top-[65px] z-20 bg-brand-cream/95 backdrop-blur-md py-2.5 -mx-4 px-4 border-b border-gray-200/60 mb-5 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all select-none active:scale-95 ${
                isActive
                  ? 'bg-brand-black text-brand-yellow shadow-md shadow-black/10'
                  : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
