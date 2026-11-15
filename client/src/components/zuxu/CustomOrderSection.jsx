import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';
import { PhotoPicker, PhotoStrip, formatDate } from './ZuxuShared';

const MAX_PHOTOS = 3;

const STATUS_STYLES = {
  pending: ['Waiting for Zuxu', 'bg-amber-100 text-amber-800'],
  quoted: ['Price ready — please confirm', 'bg-pink-100 text-pink-700'],
  ordered: ['Ordered ✓', 'bg-emerald-100 text-emerald-800'],
  rejected: ["Zuxu can't make this", 'bg-red-100 text-red-700'],
  declined: ['You declined', 'bg-gray-100 text-gray-600'],
};

function RequestForm({ onClose, onSent }) {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (images.length === 0) {
      setError('Please add at least one photo of what you want.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please describe it in a bit more detail (colour, size, name to add…).');
      return;
    }

    setSending(true);
    try {
      await api.createCustomRequest(description.trim(), images);
      onSent();
    } catch (err) {
      setError(err.message || 'Could not send your request.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black tracking-widest text-pink-600">ZUXU</p>
            <h3 className="text-lg font-black">Customise your order</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Share a photo of what you'd like made and describe it. Zuxu will reply with a
            <b> price</b> and <b>estimated delivery date</b>. You only order if you agree.
          </p>

          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Reference photos</p>
            <PhotoPicker images={images} onChange={setImages} max={MAX_PHOTOS} />
          </div>

          <label className="block">
            <span className="block text-xs font-bold text-gray-700 mb-1">Describe what you want</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="e.g. A crochet keychain like this in pink and white, with the letter 'A'."
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-pink-500"
            />
            <span className="block text-[11px] text-gray-400 text-right">{description.length}/1000</span>
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-pink-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {sending ? 'Sending…' : 'Send request to Zuxu'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CustomOrderSection({ onOpenSignIn, onOrderPlaced }) {
  const { isAuthenticated, role } = useAuth();
  const { fetchOrders, setActiveOrderId } = useOrder();

  const canRequest = isAuthenticated && ['CUSTOMER', 'ADMIN', 'CHEF', 'DELIVERY'].includes(role);

  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [workingId, setWorkingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    if (!canRequest) {
      setRequests([]);
      return;
    }
    try {
      const res = await api.getMyCustomRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.warn('Could not load custom requests:', err.message);
    }
  }, [canRequest]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const confirm = async (request) => {
    setWorkingId(request.id);
    setNotice(null);
    try {
      const res = await api.confirmCustomRequest(request.id);
      await fetchOrders();
      if (res.data?.order?.id) setActiveOrderId(res.data.order.id);
      setNotice({ type: 'success', text: `Order placed for ₹${request.quotedPrice} 🎉 You can track it in My Orders.` });
      await load();
      if (onOrderPlaced && res.data?.order) onOrderPlaced(res.data.order);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Could not place the order.' });
    } finally {
      setWorkingId(null);
    }
  };

  const decline = async (request) => {
    setWorkingId(request.id);
    setNotice(null);
    try {
      await api.declineCustomRequest(request.id);
      await load();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Could not update the request.' });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="mb-6 space-y-3">
      {/* Call to action */}
      <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-white to-rose-100 border border-pink-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-pink-600">
            <Sparkles className="w-3.5 h-3.5" /> MADE JUST FOR YOU
          </p>
          <h2 className="mt-1 text-xl font-black text-brand-black">Customise your order</h2>
          <p className="mt-1 text-xs text-gray-600">
            Upload a photo of what you want, describe it, and get a price & delivery date from Zuxu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (canRequest ? setShowForm(true) : onOpenSignIn?.())}
          className="shrink-0 px-5 py-3 rounded-2xl bg-gray-900 hover:bg-pink-600 text-white text-sm font-black flex items-center justify-center gap-2"
        >
          <Wand2 className="w-4 h-4" />
          {canRequest ? 'Start a custom order' : 'Sign in to customise'}
        </button>
      </div>

      {notice && (
        <div
          className={`rounded-xl px-3 py-2.5 text-xs font-bold ${
            notice.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* My requests */}
      {requests.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-4 space-y-3">
          <h3 className="font-black text-brand-black">My custom requests</h3>

          {requests.map((request) => {
            const [label, style] = STATUS_STYLES[request.status] || [request.status, 'bg-gray-100'];

            return (
              <div key={request.id} className="rounded-2xl border border-gray-100 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-500">{request.requestNumber}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${style}`}>
                    {label}
                  </span>
                </div>

                <PhotoStrip images={request.images} size="w-14 h-14" />

                {request.status === 'quoted' && (
                  <div className="rounded-xl bg-pink-50 border border-pink-100 p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                      <p className="text-lg font-black">₹{request.quotedPrice}</p>
                      <p className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                        <CalendarDays className="w-4 h-4 text-pink-600" />
                        Delivery by {formatDate(request.estimatedDeliveryDate)}
                      </p>
                    </div>
                    {request.adminNote && (
                      <p className="text-xs text-gray-600">“{request.adminNote}”</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={workingId === request.id}
                        onClick={() => confirm(request)}
                        className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Accept & place order
                      </button>
                      <button
                        type="button"
                        disabled={workingId === request.id}
                        onClick={() => decline(request)}
                        className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold disabled:opacity-50"
                      >
                        No thanks
                      </button>
                    </div>
                  </div>
                )}

                {request.status === 'rejected' && request.adminNote && (
                  <p className="text-xs text-red-700">Zuxu: “{request.adminNote}”</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <RequestForm
          onClose={() => setShowForm(false)}
          onSent={async () => {
            setShowForm(false);
            setNotice({ type: 'success', text: "Request sent! You'll get a notification when Zuxu replies with a price." });
            await load();
          }}
        />
      )}
    </section>
  );
}
