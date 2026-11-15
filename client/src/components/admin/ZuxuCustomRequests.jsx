import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Phone, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { PhotoStrip, formatDate } from '../zuxu/ZuxuShared';

/*
 * Admin → Zuxu custom orders.
 * Customer sends photos + description → admin quotes a price and an
 * estimated delivery date (or rejects) → customer accepts → it becomes
 * a normal Zuxu order in the Orders tab.
 */

const STATUS_LABEL = {
  pending: ['New', 'bg-amber-100 text-amber-800'],
  quoted: ['Quoted — waiting for customer', 'bg-pink-100 text-pink-700'],
  ordered: ['Ordered ✓', 'bg-emerald-100 text-emerald-800'],
  rejected: ['Rejected', 'bg-red-100 text-red-700'],
  declined: ['Customer declined', 'bg-gray-100 text-gray-600'],
};

const FILTERS = [
  ['open', 'Needs action'],
  ['quoted', 'Quoted'],
  ['ordered', 'Ordered'],
  ['closed', 'Closed'],
  ['all', 'All'],
];

// YYYY-MM-DD in the browser's local time
const todayLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function QuoteForm({ request, onDone }) {
  const [price, setPrice] = useState(request.quotedPrice ?? '');
  const [date, setDate] = useState(request.estimatedDeliveryDate || '');
  const [note, setNote] = useState(request.adminNote || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submitQuote = async (e) => {
    e.preventDefault();
    setError('');

    if (!(Number(price) > 0)) {
      setError('Enter a price.');
      return;
    }
    if (!date) {
      setError('Pick an estimated delivery date.');
      return;
    }

    setSaving(true);
    try {
      await api.quoteCustomRequest(request.id, Number(price), date, note);
      onDone(`Quote sent for ${request.requestNumber} ✓`);
    } catch (err) {
      setError(err.message || 'Could not send the quote.');
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    setSaving(true);
    setError('');
    try {
      await api.rejectCustomRequest(request.id, note);
      onDone(`${request.requestNumber} rejected.`);
    } catch (err) {
      setError(err.message || 'Could not reject.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submitQuote} className="rounded-2xl bg-gray-50 p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-xs font-bold text-gray-600 mb-1">Price (₹)</span>
          <input
            type="number"
            min="1"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-pink-500"
            placeholder="e.g. 249"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-gray-600 mb-1">Estimated delivery date</span>
          <input
            type="date"
            min={todayLocal()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-pink-500"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-bold text-gray-600 mb-1">Note to customer (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-pink-500"
          placeholder="e.g. Pink yarn is available, size will be about 8 cm."
        />
      </label>

      {error && <p className="text-xs font-bold text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-pink-600 py-2.5 text-sm font-black text-white disabled:opacity-50"
        >
          {request.status === 'quoted' ? 'Update quote' : 'Accept & send quote'}
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={saving}
          className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </form>
  );
}

export default function ZuxuCustomRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getAllCustomRequests();
      setRequests(res.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not load requests.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const shown = useMemo(() => {
    switch (filter) {
      case 'open':
        return requests.filter((r) => r.status === 'pending');
      case 'quoted':
        return requests.filter((r) => r.status === 'quoted');
      case 'ordered':
        return requests.filter((r) => r.status === 'ordered');
      case 'closed':
        return requests.filter((r) => r.status === 'rejected' || r.status === 'declined');
      default:
        return requests;
    }
  }, [filter, requests]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (loading) {
    return <p className="p-6 text-sm font-semibold text-gray-500">Loading custom orders…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Zuxu custom orders</h2>
          <p className="text-sm text-gray-500">
            Customers send a photo and description. Quote a price and delivery date — they confirm to order.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${
              filter === id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {label}
            {id === 'open' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500">Nothing here.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((request) => {
            const [label, style] = STATUS_LABEL[request.status] || [request.status, 'bg-gray-100'];

            return (
              <article key={request.id} className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{request.requestNumber}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>{label}</span>
                </div>

                <div className="text-sm space-y-0.5">
                  <p className="font-bold">{request.customerName}</p>
                  <p className="text-gray-600">
                    {request.hostel}, Room {request.roomNumber}
                  </p>
                  {request.customerPhone && (
                    <a
                      href={`tel:${request.customerPhone}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-black text-green-700"
                    >
                      <Phone className="w-3.5 h-3.5" /> {request.customerPhone}
                    </a>
                  )}
                </div>

                <PhotoStrip images={request.images} size="w-20 h-20" />

                <p className="rounded-xl bg-pink-50/60 p-3 text-sm text-gray-800 whitespace-pre-line">
                  {request.description}
                </p>

                {(request.status === 'quoted' || request.status === 'ordered') && (
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-black">₹{request.quotedPrice}</span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <CalendarDays className="w-4 h-4" /> by {formatDate(request.estimatedDeliveryDate)}
                    </span>
                    {request.status === 'ordered' && (
                      <span className="text-xs font-bold text-emerald-700">→ now in the Orders tab</span>
                    )}
                  </p>
                )}

                {(request.status === 'pending' || request.status === 'quoted') && (
                  <QuoteForm
                    request={request}
                    onDone={async (text) => {
                      setMessage({ type: 'success', text });
                      await load();
                    }}
                  />
                )}

                {request.adminNote && request.status !== 'pending' && request.status !== 'quoted' && (
                  <p className="text-xs text-gray-500">Note: {request.adminNote}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
