/*
 * Order pipeline at a glance, used by the Admin and Chef screens.
 * Each card shows how many orders are in that step; tapping it shows
 * only those orders. Orders move left → right:
 *
 *   To accept → Preparing → Ready → On the way → Completed
 */

export const ORDER_BUCKETS = {
  to_accept: {
    label: 'To accept',
    hint: 'New, waiting for you',
    emoji: '🔔',
    statuses: ['placed'],
    card: 'bg-red-50 border-red-200 text-red-700',
    active: 'bg-red-600 border-red-600 text-white',
  },
  preparing: {
    label: 'Preparing',
    hint: 'Accepted, being made',
    emoji: '👨‍🍳',
    statuses: ['accepted', 'preparing'],
    card: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    active: 'bg-yellow-400 border-yellow-400 text-black',
  },
  ready: {
    label: 'Ready',
    hint: 'Packed, waiting for pickup',
    emoji: '🥡',
    statuses: ['ready', 'ready_to_dispatch'],
    card: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    active: 'bg-emerald-600 border-emerald-600 text-white',
  },
  on_the_way: {
    label: 'On the way',
    hint: 'Out for delivery',
    emoji: '🛵',
    statuses: ['out_for_delivery'],
    card: 'bg-blue-50 border-blue-200 text-blue-700',
    active: 'bg-blue-600 border-blue-600 text-white',
  },
  completed: {
    label: 'Completed',
    hint: 'Delivered',
    emoji: '✅',
    statuses: ['delivered'],
    card: 'bg-gray-50 border-gray-200 text-gray-700',
    active: 'bg-gray-900 border-gray-900 text-white',
  },
  cancelled: {
    label: 'Cancelled',
    hint: 'Cancelled orders',
    emoji: '✖️',
    statuses: ['cancelled'],
    card: 'bg-gray-50 border-gray-200 text-gray-500',
    active: 'bg-gray-700 border-gray-700 text-white',
  },
};

export const ACTIVE_STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'ready_to_dispatch', 'out_for_delivery'];

// filter: a bucket key, 'active' (everything not finished) or 'all'
export function filterOrders(orders, filter) {
  if (filter === 'all') return orders;
  if (filter === 'active') return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const bucket = ORDER_BUCKETS[filter];
  return bucket ? orders.filter((o) => bucket.statuses.includes(o.status)) : orders;
}

export function countOrders(orders, filter) {
  return filterOrders(orders, filter).length;
}

// Oldest first while an order is still moving (serve in order),
// newest first for finished orders.
export function sortForFilter(orders, filter) {
  const oldestFirst = !['completed', 'cancelled', 'all'].includes(filter);
  return orders
    .slice()
    .sort((a, b) =>
      oldestFirst
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );
}

// Full class names so Tailwind keeps them in the build.
const SM_COLS = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5' };

export default function OrderStatusTabs({
  orders,
  value,
  onChange,
  buckets = ['to_accept', 'preparing', 'ready', 'on_the_way', 'completed'],
  showAll = true,
}) {
  const activeCount = countOrders(orders, 'active');

  return (
    <div className="space-y-3">
      <div className={`grid grid-cols-2 gap-2.5 ${SM_COLS[buckets.length] || 'sm:grid-cols-5'}`}>
        {buckets.map((key) => {
          const bucket = ORDER_BUCKETS[key];
          const count = countOrders(orders, key);
          const on = value === key;
          const urgent = key === 'to_accept' && count > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={on}
              className={`relative text-left rounded-2xl border-2 p-3.5 transition active:scale-[0.98] ${
                on ? `${bucket.active} shadow-md` : `${bucket.card} hover:shadow-sm`
              } ${key === buckets[buckets.length - 1] && buckets.length % 2 === 1 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              {urgent && !on && (
                <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                </span>
              )}
              <p className="text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5">
                <span>{bucket.emoji}</span> {bucket.label}
              </p>
              <p className="text-3xl font-black mt-1 leading-none">{count}</p>
              <p className={`text-[10px] font-semibold mt-1 ${on ? 'opacity-80' : 'opacity-70'}`}>{bucket.hint}</p>
            </button>
          );
        })}
      </div>

      {showAll && (
        <div className="flex flex-wrap gap-2">
          {[
            ['active', `All active (${activeCount})`],
            ['cancelled', `Cancelled (${countOrders(orders, 'cancelled')})`],
            ['all', `Every order (${orders.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-black border ${
                value === key ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
