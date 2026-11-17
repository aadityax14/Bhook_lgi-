import { useState } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import { HOSTELS } from '../../utils/fees';
import { normalizeHostel } from '../../utils/availability';

/*
 * Admin: choose the hostels where a Bhook_Lgi item can be ordered.
 * Nothing ticked = available in every hostel.
 * Any hostel can be typed in (e.g. "gh 2" → GH2).
 * Customers in other hostels see "Not available in your hostel"
 * (not "Out of stock").
 */
export default function HostelAvailabilityPicker({ value = [], onChange }) {
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');

  const selected = new Set(value.map(normalizeHostel).filter(Boolean));
  const preset = HOSTELS.filter((h) => h.toLowerCase() !== 'other').map(normalizeHostel);
  const options = [...new Set([...preset, ...selected])];

  const toggle = (hostel) => {
    const next = new Set(selected);
    if (next.has(hostel)) next.delete(hostel);
    else next.add(hostel);
    onChange([...next]);
  };

  const addCustom = () => {
    const hostel = normalizeHostel(custom);

    if (!hostel) {
      setError('Type a hostel, e.g. GH2 or GS2.');
      return;
    }
    if (hostel.length > 20) {
      setError('Hostel name is too long.');
      return;
    }

    setError('');
    setCustom('');
    onChange([...new Set([...selected, hostel])]);
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-3 sm:p-4 space-y-3">
      <div>
        <p className="flex items-center gap-2 text-sm font-black">
          <MapPin className="w-4 h-4 text-brand-yellow" /> Available in hostels
        </p>
        <p className="text-xs text-gray-500">
          {selected.size === 0
            ? 'Available in every hostel. Tick hostels to sell it only there.'
            : `Only customers in ${[...selected].join(', ')} can order this. Others see “Not available in your hostel”.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((hostel) => {
          const on = selected.has(hostel);
          const isCustom = !preset.includes(hostel);
          return (
            <button
              key={hostel}
              type="button"
              onClick={() => toggle(hostel)}
              aria-pressed={on}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-black transition ${
                on
                  ? 'bg-brand-black text-brand-yellow border-brand-black'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
              title={isCustom ? 'Click to remove' : undefined}
            >
              {hostel}
              {isCustom && on && <X className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Any other hostel */}
      <div>
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Other hostel, e.g. GH2 or GS 2"
            maxLength={24}
            aria-label="Add another hostel"
            className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-yellow"
          />
          <button
            type="button"
            onClick={addCustom}
            className="flex items-center gap-1 rounded-xl bg-brand-yellow/40 hover:bg-brand-yellow/60 px-3 py-2 text-xs font-black"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {custom.trim() && !error && (
          <p className="mt-1 text-[11px] text-gray-500">Will be saved as <b>{normalizeHostel(custom)}</b></p>
        )}
        {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
      </div>

      {selected.size > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs font-bold text-gray-500 underline"
        >
          Make available in all hostels
        </button>
      )}
    </div>
  );
}
