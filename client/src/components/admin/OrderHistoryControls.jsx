import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../../services/api';

/*
 * Admin → Orders: clear order history.
 *   • Finished orders = delivered + cancelled (safe default)
 *   • All orders = everything, including ones still in progress
 * The server saves a backup of the data first, and delivery partners
 * keep the earnings from deleted orders.
 */
export default function OrderHistoryControls({ orders, onDone }) {
  const [confirming, setConfirming] = useState(null); // 'finished' | 'all' | null
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState(null);

  const finishedCount = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled').length;
  const counts = { finished: finishedCount, all: orders.length };

  const run = async () => {
    setWorking(true);
    setMessage(null);
    try {
      const res = await api.clearOrderHistory(confirming);
      setMessage({ type: 'success', text: res.message || 'Orders deleted.' });
      setConfirming(null);
      await onDone?.();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not delete orders.' });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black">Order history</p>
          <p className="text-xs text-gray-500">
            {orders.length} orders · {finishedCount} delivered or cancelled
          </p>
        </div>

        {!confirming && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirming('finished')}
              disabled={finishedCount === 0}
              className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear finished orders
            </button>
            <button
              type="button"
              onClick={() => setConfirming('all')}
              disabled={orders.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete all orders
            </button>
          </div>
        )}
      </div>

      {confirming && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2" role="alert">
          <p className="text-sm font-black text-red-700">
            Delete {counts[confirming]} {confirming === 'all' ? 'orders (including ones still in progress)' : 'delivered / cancelled orders'}?
          </p>
          <p className="text-xs text-red-700/80">
            They disappear for customers, staff and Today&apos;s Business. A backup of the data is
            saved on the server first, and delivery partners keep their earnings.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={run}
              disabled={working}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              {working ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={working}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={`text-xs font-bold ${message.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
