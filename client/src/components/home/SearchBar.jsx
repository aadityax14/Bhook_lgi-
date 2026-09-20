import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ search, setSearch }) {
  const quickTags = ['Half Bhel', 'Cooked Maggie', "Lay's", 'Bingo', 'Oreo'];

  return (
    <div className="mb-4 space-y-2">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bhel, maggie, chips, biscuits..."
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-brand-black placeholder-gray-400 focus:outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 transition-all shadow-xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick suggestions */}
      {!search && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">Try:</span>
          {quickTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSearch(tag)}
              className="text-[11px] font-medium bg-white text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 hover:border-brand-yellow hover:text-brand-black transition-colors whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
