import { useEffect, useState } from 'react';
import { Bike, ChefHat, Package, Save } from 'lucide-react';
import { api } from '../../services/api';

/*
 * Admin → Delivery & Packing charges.
 * Delivery: same-hostel charge when a chef on today's duty list lives
 * in the customer's hostel, otherwise the other-hostel charge.
 * Every delivery charge counts as the delivering partner's earning.
 */

const FIELDS = [
  ['sameHostelDeliveryFee', 'Delivery — chef in same hostel', 'Charged when a chef on duty today lives in the customer’s hostel.', ChefHat],
  ['otherHostelDeliveryFee', 'Delivery — other hostel', 'Charged for every other delivery (and all Zuxu orders).', Bike],
  ['packagingFee', 'Packing charge', 'Added to every order.', Package],
  ['freeDeliveryFrom', 'Free delivery from (₹)', 'Order amount for free delivery. Keep 0 to turn free delivery off (delivery partners then always earn).', Bike],
];

export default function ChargesSettings() {
  const [form, setForm] = useState(null);
  const [kitchenHostels, setKitchenHostels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        const { kitchenHostels: hostels = [], ...settings } = res.data || {};
        setForm(Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, String(v)])));
        setKitchenHostels(hostels);
      })
      .catch((err) => setMessage({ type: 'error', text: err.message || 'Could not load charges.' }));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.saveSettings(
        Object.fromEntries(FIELDS.map(([key]) => [key, Number(form[key])]))
      );
      setForm(Object.fromEntries(Object.entries(res.data).map(([k, v]) => [k, String(v)])));
      setMessage({ type: 'success', text: 'Charges saved ✓ New orders use them right away.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save charges.' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return <p className="p-6 text-sm font-semibold text-gray-500">{message?.text || 'Loading charges…'}</p>;
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-black">Delivery & Packing</h2>
        <p className="text-sm text-gray-500">
          Each delivery charge is added to the earnings of the delivery partner who delivered that order.
        </p>
      </div>

      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-sm">
        <b>Chefs on duty today in:</b>{' '}
        {kitchenHostels.length ? kitchenHostels.join(', ') : 'none yet (or their hostel isn’t set) — everyone pays the other-hostel charge'}
        <p className="text-xs text-emerald-800 mt-1">Set chef hostels and today’s duty in the Staff tab.</p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm font-semibold ${
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map(([key, label, hint, Icon]) => (
          <label key={key} className="block rounded-2xl border bg-white p-4">
            <span className="flex items-center gap-2 text-sm font-black">
              <Icon className="w-4 h-4 text-brand-yellow" /> {label}
            </span>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-500">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form[key] ?? ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2.5 font-bold outline-none focus:ring-2 focus:ring-brand-yellow"
              />
            </div>
            <span className="mt-1.5 block text-[11px] text-gray-500">{hint}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save charges'}
      </button>
    </form>
  );
}
