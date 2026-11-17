import { useEffect, useState } from 'react';
import { ChefHat, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

/*
 * Admin → Inventory: open / close the Bhook_Lgi kitchen.
 * While closed, customers can browse and fill their cart, but food
 * orders are refused with "Kitchen is closed right now".
 * Zuxu (handmade gifts) is never affected.
 */
export default function KitchenStatusCard() {
  const [open, setOpen] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSettings()
      .then((res) => setOpen(res.data?.kitchenOpen !== false))
      .catch(() => setError('Could not load kitchen status.'));
  }, []);

  const toggle = async () => {
    const next = !open;
    setSaving(true);
    setError('');
    try {
      const res = await api.saveSettings({ kitchenOpen: next });
      setOpen(res.data?.kitchenOpen !== false);
    } catch (err) {
      setError(err.message || 'Could not update kitchen status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-3xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        open === false ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            open === false ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          <ChefHat className="w-5 h-5" />
        </div>
        <div>
          <p className="font-black text-lg">
            {open === null ? 'Kitchen status…' : open ? '🟢 Kitchen is OPEN' : '🔴 Kitchen is CLOSED'}
          </p>
          <p className="text-sm text-gray-600">
            {open === false
              ? 'Customers can browse, but Bhook_Lgi food orders are refused until you open it. Zuxu still works.'
              : 'Customers can place Bhook_Lgi food orders. Close it when the kitchen stops taking orders.'}
          </p>
          {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={open === null || saving}
        role="switch"
        aria-checked={Boolean(open)}
        className={`shrink-0 flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white disabled:opacity-50 ${
          open ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {open ? 'Close kitchen' : 'Open kitchen'}
      </button>
    </div>
  );
}
