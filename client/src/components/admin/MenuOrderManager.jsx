import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUp, ListOrdered, Package } from 'lucide-react';
import { api } from '../../services/api';

/*
 * Admin → Inventory → "Customer menu order"
 * Choose which Bhook_Lgi products customers see first on the menu.
 * Move items up / down, then Save.
 */
export default function MenuOrderManager({ products, onSaved, showToast }) {
  // Products arrive already sorted in the current menu order.
  const savedIds = useMemo(() => products.map((p) => p.id), [products]);
  const [orderIds, setOrderIds] = useState(savedIds);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = orderIds.join('|') !== savedIds.join('|');

  // Products added / removed elsewhere: keep the list in sync
  // (unless the admin is in the middle of re-ordering).
  useEffect(() => {
    if (!dirty) setOrderIds(savedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedIds.join('|')]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const rows = orderIds.map((id) => byId.get(id)).filter(Boolean);

  const move = (index, to) => {
    setOrderIds((previous) => {
      const next = previous.filter((id) => byId.has(id));
      const target = Math.max(0, Math.min(next.length - 1, to));
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      const res = await api.saveMenuOrder(rows.map((p) => p.id));
      onSaved?.(res.data);
      showToast?.('success', 'Menu order saved ✓ Customers now see this order');
    } catch (error) {
      showToast?.('error', error.message || 'Could not save the menu order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black flex items-center gap-2">
            <ListOrdered size={20} /> Customer menu order
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Choose which products customers see first. #1 is shown at the top of the menu.
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-gray-100 font-bold text-sm"
        >
          {open ? 'Hide' : 'Change order'}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-2">
          {rows.length === 0 && (
            <p className="text-sm text-gray-500">No products yet.</p>
          )}

          {rows.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2.5"
            >
              <span className="w-8 text-center font-black text-gray-500">#{index + 1}</span>

              <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package size={18} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-sm truncate">{product.name}</p>
                <p className="text-xs text-gray-500">₹{product.price}</p>
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => move(index, 0)}
                  disabled={index === 0}
                  className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center disabled:opacity-30"
                  title="Show first"
                  aria-label={`Show ${product.name} first`}
                >
                  <ChevronsUp size={16} />
                </button>
                <button
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center disabled:opacity-30"
                  title="Move up"
                  aria-label={`Move ${product.name} up`}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => move(index, index + 1)}
                  disabled={index === rows.length - 1}
                  className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center disabled:opacity-30"
                  title="Move down"
                  aria-label={`Move ${product.name} down`}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </div>
          ))}

          {rows.length > 0 && (
            <div className="flex justify-end gap-2 pt-2">
              {dirty && (
                <button
                  onClick={() => setOrderIds(savedIds)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 font-bold text-sm"
                >
                  Undo changes
                </button>
              )}
              <button
                onClick={save}
                disabled={saving || !dirty}
                className="px-5 py-2.5 rounded-xl bg-black text-white font-black text-sm disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save order'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
