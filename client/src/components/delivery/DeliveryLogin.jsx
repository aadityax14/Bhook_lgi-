import React, { useState } from 'react';
import { Bike, LockKeyhole, ArrowRight, ShieldCheck } from 'lucide-react';

export default function DeliveryLogin({ onLogin }) {
  const [deliveryId, setDeliveryId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // DEMO DELIVERY PARTNERS
  const DEMO_DELIVERY_IDS = [
    'BL-DLV-001',
    'BL-DLV-002',
    'BL-DLV-003',
  ];

  const handleLogin = (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    const enteredId = deliveryId.trim().toUpperCase();

    setTimeout(() => {
      if (DEMO_DELIVERY_IDS.includes(enteredId)) {
        // For now we only send the ID.
        // Later this will come from the backend.
        onLogin({
          deliveryId: enteredId,
        });
      } else {
        setError('Invalid Delivery ID. Please check your ID.');
      }

      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-brand-yellow flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-xl mb-4">
            <Bike className="w-10 h-10 text-brand-black" />
          </div>

          <h1 className="text-3xl font-black text-brand-black">
            Bhook<span className="text-white">_</span>Lgi
          </h1>

          <p className="mt-2 text-brand-black/70 font-medium">
            Delivery Partner Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">

          <div className="mb-6">
            <h2 className="text-2xl font-black text-brand-black">
              Delivery Login
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Enter your unique Delivery ID to continue.
            </p>
          </div>

          <form onSubmit={handleLogin}>

            {/* Delivery ID */}
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Delivery ID
            </label>

            <div className="relative mb-4">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type="text"
                value={deliveryId}
                onChange={(e) => {
                  setDeliveryId(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="BL-DLV-001"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 outline-none font-bold tracking-wide focus:border-brand-yellow transition-all"
                autoComplete="off"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!deliveryId.trim() || loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-yellow text-brand-black font-black text-lg hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                'Checking...'
              ) : (
                <>
                  Login
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

          </form>

          {/* Demo IDs */}
          <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-green-600" />

              <span className="text-sm font-bold text-gray-700">
                Demo Delivery IDs
              </span>
            </div>

            <div className="space-y-2">
              {DEMO_DELIVERY_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setDeliveryId(id);
                    setError('');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-mono font-bold hover:border-brand-yellow transition-all"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Security Note */}
        <p className="text-center text-xs text-brand-black/60 mt-5">
          🔒 Delivery access is restricted to authorized partners.
        </p>

      </div>
    </div>
  );
}