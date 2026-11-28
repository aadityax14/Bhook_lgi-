import { resolveMediaUrl } from '../../services/api';

/*
 * Everything the customer chose for one order item, shown the same way
 * on the Admin, Chef and Delivery screens:
 *   size · spice · extras · Zuxu choices · note · photos
 *
 * Safe for any data shape: add-ons can be strings or { name, price }
 * objects, customization can hold text, numbers, yes/no or lists.
 */

const SPICE_LABELS = {
  spicy: '🌶️ Spicy',
  'non-spicy': '🙂 Non-spicy',
  'non_spicy': '🙂 Non-spicy',
  mild: '🙂 Mild',
  medium: '🌶️ Medium',
  hot: '🌶️🌶️ Extra spicy',
};

// Customization keys shown on their own line (not as chips)
const NOTE_KEYS = new Set(['customerNote', 'note', 'notes', 'instructions', 'specialInstructions']);
const DESCRIPTION_KEYS = new Set(['description']);

const toText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : '';
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ');
  if (typeof value === 'object') return String(value.name ?? value.label ?? value.value ?? '');
  return String(value).trim();
};

// "giftWrap" / "gift_wrap" → "Gift wrap"
const prettyKey = (key) => {
  const words = String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export function spiceLabel(level) {
  if (!level) return '';
  const key = String(level).toLowerCase().trim();
  return SPICE_LABELS[key] || `🌶️ ${level}`;
}

export function addonNamesOf(addons) {
  if (!Array.isArray(addons)) return [];
  return addons.map((addon) => toText(addon)).filter(Boolean);
}

const looksLikeImage = (value) =>
  typeof value === 'string' &&
  (value.startsWith('/api/uploads/') || value.startsWith('data:image/') || /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(value));

// { chips: [{ label, value, tone }], note, description, images }
export function describeOrderItem(item = {}) {
  const chips = [];

  const variant = toText(item.variant ?? item.variantName);
  if (variant) chips.push({ label: 'Size', value: variant, tone: 'gray' });

  if (item.spiceLevel) {
    const spicy = String(item.spiceLevel).toLowerCase() === 'spicy';
    chips.push({ label: 'Spice', value: spiceLabel(item.spiceLevel), tone: spicy ? 'red' : 'green' });
  }

  const extras = addonNamesOf(item.addons);
  if (extras.length > 0) chips.push({ label: 'Extras', value: extras.join(', '), tone: 'yellow' });

  let note = '';
  let description = '';
  const images = Array.isArray(item.images) ? item.images.filter(looksLikeImage) : [];

  const customization = item.customization && typeof item.customization === 'object'
    ? item.customization
    : {};

  for (const [key, raw] of Object.entries(customization)) {
    if (looksLikeImage(raw)) {
      images.push(raw);
      continue;
    }
    if (Array.isArray(raw) && raw.every(looksLikeImage) && raw.length > 0) {
      images.push(...raw);
      continue;
    }

    const value = toText(raw);
    if (!value) continue;

    if (NOTE_KEYS.has(key)) note = value;
    else if (DESCRIPTION_KEYS.has(key)) description = value;
    else chips.push({ label: prettyKey(key), value, tone: 'pink' });
  }

  return { chips, note, description, images: [...new Set(images)] };
}

const TONES = {
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  pink: 'bg-pink-50 text-pink-800 border-pink-200',
};

/**
 * The customer's choices for one item.
 * compact: smaller text (used in short lists).
 */
export default function OrderItemDetails({ item, compact = false }) {
  const { chips, note, description, images } = describeOrderItem(item);

  if (chips.length === 0 && !note && !description && images.length === 0) {
    return null;
  }

  const text = compact ? 'text-[10px]' : 'text-xs';

  return (
    <div className="mt-1.5 space-y-1.5">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={`${chip.label}-${chip.value}`}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 ${text} font-bold ${TONES[chip.tone] || TONES.gray}`}
            >
              <span className="opacity-60 font-semibold">{chip.label}:</span>
              {chip.value}
            </span>
          ))}
        </div>
      )}

      {description && (
        <p className={`${text} text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 whitespace-pre-line`}>
          “{description}”
        </p>
      )}

      {note && (
        <p className={`${text} font-bold text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1`}>
          📝 Note: {note}
        </p>
      )}

      {images.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {images.map((src) => (
            <a
              key={src}
              href={resolveMediaUrl(src) || src}
              target="_blank"
              rel="noreferrer"
              className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
            >
              <img src={resolveMediaUrl(src) || src} alt="Customer photo" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
