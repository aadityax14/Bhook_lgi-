import { Plus, Trash2 } from 'lucide-react';

/*
 * Admin editor for every price on a product besides the main price:
 *   - Sizes / variants  (e.g. "Half Bhel" ₹35, "Full Bhel" ₹65)
 *   - Extras / add-ons  (e.g. "Extra Crispy Sev" +₹5)
 *
 * Rows are kept as strings while typing; use cleanPriceOptions()
 * before sending to the server.
 */

// Turn product data into editable rows.
export function toPriceOptionRows(product) {
  const variants = Array.isArray(product?.variants)
    ? product.variants
        .filter(v => v && typeof v === 'object')
        .map(v => ({ ...v, name: v.name || '', price: String(v.price ?? '') }))
    : [];

  const addons = Array.isArray(product?.addons)
    ? product.addons
        .filter(a => a && typeof a === 'object')
        .map(a => ({ ...a, name: a.name || '', price: String(a.price ?? '') }))
    : [];

  return { variants, addons };
}

// Validate rows and convert them back to product data.
// Returns { error } or { variants, addons }.
export function cleanPriceOptions({ variants = [], addons = [] }) {
  const clean = (rows, label) => {
    const result = [];

    for (const row of rows) {
      const name = String(row.name || '').trim();
      const priceText = String(row.price ?? '').trim();

      // Skip completely empty rows.
      if (!name && !priceText) continue;

      if (!name) {
        return { error: `Every ${label} needs a name` };
      }

      const price = Number(priceText);

      if (priceText === '' || !Number.isFinite(price) || price < 0) {
        return { error: `Enter a valid price for "${name}"` };
      }

      result.push({ ...row, name, price });
    }

    return { rows: result };
  };

  const v = clean(variants, 'size');
  if (v.error) return { error: v.error };

  const a = clean(addons, 'extra');
  if (a.error) return { error: a.error };

  return { variants: v.rows, addons: a.rows };
}

function OptionRows({ title, hint, rows, onChange, namePlaceholder, pricePrefix, addLabel }) {
  const updateRow = (index, field, value) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const removeRow = (index) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { name: '', price: '' }]);
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-3 sm:p-4 space-y-3">
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>

      {rows.length === 0 && (
        <p className="text-xs text-gray-400 italic">None added yet.</p>
      )}

      {rows.map((row, index) => (
        <div key={row.id || index} className="flex items-center gap-2">
          <input
            type="text"
            value={row.name}
            onChange={(e) => updateRow(index, 'name', e.target.value)}
            placeholder={namePlaceholder}
            aria-label={`${title} name`}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-yellow"
          />

          <div className="relative w-24 shrink-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500">
              {pricePrefix}
            </span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={row.price}
              onChange={(e) => updateRow(index, 'price', e.target.value)}
              placeholder="0"
              aria-label={`${title} price`}
              className="w-full pl-8 pr-2 py-2.5 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </div>

          <button
            type="button"
            onClick={() => removeRow(index)}
            className="p-2 rounded-xl text-red-500 hover:bg-red-50 shrink-0"
            aria-label="Remove"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs font-black text-brand-black bg-brand-yellow/30 hover:bg-brand-yellow/50 px-3 py-2 rounded-xl"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

export default function PriceOptionsEditor({ value, onChange }) {
  const variants = value?.variants || [];
  const addons = value?.addons || [];

  return (
    <div className="space-y-3">
      <OptionRows
        title="Sizes / Portions"
        hint={
          variants.length > 0
            ? 'Customers pay the size price, not the main price above.'
            : 'Optional. e.g. Half ₹35, Full ₹65. If empty, the main price is used.'
        }
        rows={variants}
        onChange={(rows) => onChange({ variants: rows, addons })}
        namePlaceholder="e.g. Half Bhel"
        pricePrefix="₹"
        addLabel="Add size"
      />

      <OptionRows
        title="Extras / Add-ons"
        hint="Charged on top, e.g. Extra Crispy Sev +₹5, Extra Crunch +₹10."
        rows={addons}
        onChange={(rows) => onChange({ variants, addons: rows })}
        namePlaceholder="e.g. Extra Crispy Sev"
        pricePrefix="+₹"
        addLabel="Add extra"
      />
    </div>
  );
}
