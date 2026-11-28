import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bike, ChefHat, Package, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

/*
 * Admin → Kitchen Plan (set it before opening Bhook_Lgi)
 *   1. Chefs: who is on duty, and which chefs also deliver orders.
 *   2. Who makes what: pick a chef for every item. One chef can make
 *      many items. New orders go to the planned chef (if on duty);
 *      items with no chef can be made by any chef on duty.
 */
export default function KitchenPlan({ products, onSaved, showToast }) {
  const [chefs, setChefs] = useState([]);
  const [loadingChefs, setLoadingChefs] = useState(true);
  const [drafts, setDrafts] = useState({}); // productId → chefId | ''
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // showToast changes on every admin render; don't refetch because of it.
  const toastRef = useRef(showToast);
  useEffect(() => {
    toastRef.current = showToast;
  });

  const loadChefs = useCallback(async () => {
    try {
      const res = await api.getStaffAccounts();
      setChefs((res.data || []).filter((a) => a.role === 'CHEF' && a.is_active));
    } catch (error) {
      toastRef.current?.('error', error.message || 'Could not load chefs');
    } finally {
      setLoadingChefs(false);
    }
  }, []);

  useEffect(() => {
    loadChefs();
  }, [loadChefs]);

  const chefById = useMemo(() => new Map(chefs.map((c) => [String(c.id), c])), [chefs]);

  const currentChef = (product) =>
    drafts[product.id] !== undefined ? drafts[product.id] : String(product.chefId || '');

  const dirty = Object.entries(drafts).some(([id, chefId]) => {
    const product = products.find((p) => p.id === id);
    return product && String(product.chefId || '') !== chefId;
  });

  const itemsPerChef = useMemo(() => {
    const counts = new Map();
    for (const product of products) {
      const chefId = currentChef(product);
      if (chefId) counts.set(chefId, (counts.get(chefId) || 0) + 1);
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, drafts]);

  const unplanned = products.filter((p) => !currentChef(p)).length;

  const setAllTo = (chefId) => {
    setDrafts(Object.fromEntries(products.map((p) => [p.id, chefId])));
  };

  const save = async () => {
    try {
      setSaving(true);
      const assignments = Object.fromEntries(
        Object.entries(drafts).map(([id, chefId]) => [id, chefId || null])
      );
      const res = await api.saveKitchenPlan(assignments);
      setDrafts({});
      onSaved?.(res.data);
      showToast?.('success', res?.rerouted > 0
        ? `Kitchen plan saved ✓ ${res.rerouted} waiting order${res.rerouted === 1 ? '' : 's'} moved to the new chef`
        : 'Kitchen plan saved ✓ New orders go to these chefs');
    } catch (error) {
      showToast?.('error', error.message || 'Could not save the kitchen plan');
    } finally {
      setSaving(false);
    }
  };

  const toggleDelivery = async (chef) => {
    try {
      setTogglingId(chef.id);
      await api.setChefCanDeliver(chef.id, !chef.can_deliver);
      await loadChefs();
      showToast?.(
        'success',
        !chef.can_deliver
          ? `${chef.full_name} can now deliver orders too ✓`
          : `${chef.full_name} only cooks now`
      );
    } catch (error) {
      showToast?.('error', error.message || 'Could not update the chef');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <ChefHat size={22} /> Kitchen Plan
          </h2>
          <p className="text-sm text-gray-500">
            Before opening, choose which chef makes which item and which chefs also deliver.
          </p>
        </div>
        <button
          onClick={() => {
            setLoadingChefs(true);
            loadChefs();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 font-bold text-sm"
        >
          <RefreshCw size={16} className={loadingChefs ? 'animate-spin' : ''} /> Refresh chefs
        </button>
      </div>

      {/* ---------------- CHEFS ---------------- */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-lg font-black">Chefs</h3>
        <p className="text-sm text-gray-500 mt-1">
          Put chefs on today's duty in the Staff tab. Turn on <b>Also delivers</b> for a chef who
          delivers orders too — they'll see deliveries in their chef panel.
        </p>

        {loadingChefs && chefs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Loading chefs...</p>
        ) : chefs.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No chef accounts yet. Approve chef applications in the Staff tab.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chefs.map((chef) => (
              <div key={chef.id} className="rounded-2xl bg-gray-50 p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-black truncate">{chef.full_name}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-mono">{chef.login_id}</span>
                    {chef.hostel ? ` · ${chef.hostel}` : ''}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        chef.on_duty_today ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {chef.on_duty_today ? 'ON DUTY TODAY' : 'OFF DUTY'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-800">
                      {itemsPerChef.get(String(chef.id)) || 0} item
                      {(itemsPerChef.get(String(chef.id)) || 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={togglingId === chef.id}
                  onClick={() => toggleDelivery(chef)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black disabled:opacity-50 ${
                    chef.can_deliver ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
                  }`}
                  aria-pressed={Boolean(chef.can_deliver)}
                >
                  <Bike size={14} />
                  {chef.can_deliver ? 'Also delivers ✓' : 'Also delivers'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- WHO MAKES WHAT ---------------- */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Who makes what</h3>
            <p className="text-sm text-gray-500 mt-1">
              {unplanned > 0
                ? `${unplanned} item${unplanned === 1 ? '' : 's'} with no chef — any chef on duty can make ${unplanned === 1 ? 'it' : 'them'}.`
                : 'Every item has a chef.'}{' '}
              An order goes only to its planned chef (items with no chef in that order go to them too).
              If the planned chef isn't on duty, the order is open to every chef on duty — and moves to
              them as soon as you put them on duty, if nobody accepted it yet.
            </p>
          </div>

          {chefs.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value === '__none') setAllTo('');
                else if (e.target.value) setAllTo(e.target.value);
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold"
            >
              <option value="">Set all items to…</option>
              {chefs.map((chef) => (
                <option key={chef.id} value={chef.id}>{chef.full_name}</option>
              ))}
              <option value="__none">Any chef on duty</option>
            </select>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {products.length === 0 && <p className="text-sm text-gray-500">No products yet.</p>}

          {products.map((product) => {
            const chefId = currentChef(product);
            const missing = chefId && !chefById.has(chefId);

            return (
              <div key={product.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-2.5">
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

                <select
                  value={chefId}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [product.id]: e.target.value }))}
                  className={`w-40 sm:w-56 px-3 py-2 rounded-xl border bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-brand-yellow ${
                    chefId ? 'border-yellow-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">Any chef on duty</option>
                  {chefs.map((chef) => (
                    <option key={chef.id} value={chef.id}>
                      {chef.full_name} ({chef.login_id})
                    </option>
                  ))}
                  {missing && <option value={chefId}>Disabled chef</option>}
                </select>
              </div>
            );
          })}
        </div>

        {products.length > 0 && (
          <div className="flex justify-end gap-2 pt-4">
            {dirty && (
              <button
                onClick={() => setDrafts({})}
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
              {saving ? 'Saving...' : 'Save kitchen plan'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
