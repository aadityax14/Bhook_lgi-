import React, { useEffect } from 'react';
import { Check, Clock, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';

const STAGES = [
  {
    key: 'placed',
    title: 'Order Placed',
    desc: 'Sent to hostel kitchen',
    icon: '📝'
  },
  {
    key: 'accepted',
    title: 'Order Accepted',
    desc: 'Confirmed by kitchen manager',
    icon: '🔥'
  },
  {
    key: 'preparing',
    title: 'Preparing Food',
    desc: 'Cooking spicy Bhel & Maggie',
    icon: '🍜'
  },
  {
    key: 'ready',
    title: 'Food Ready',
    desc: 'Freshly packed in kitchen',
    icon: '🥡'
  },
  {
    key: 'out_for_delivery',
    title: 'Out for Delivery',
    desc: 'Delivery partner on the way',
    icon: '🛵'
  },
  {
    key: 'delivered',
    title: 'Delivered',
    desc: 'Enjoy your cravings!',
    icon: '🎉'
  }
];

export default function OrderTrackingView({ onBackToMenu, onOpenAllOrders }) {
  const { activeOrder, fetchOrders } = useOrder();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2500);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (!activeOrder) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-brand-yellowLight rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
          📦
        </div>
        <h3 className="text-base font-black text-brand-black mb-1">No Active Order</h3>
        <p className="text-xs text-gray-500 mb-4">You haven't placed any order yet.</p>
        <button
          onClick={onBackToMenu}
          className="px-5 py-2.5 bg-brand-yellow text-brand-black font-extrabold text-xs rounded-2xl shadow-yellow-glow"
        >
          Order Food Now
        </button>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex(s => s.key === activeOrder.status);
  const activeStage = STAGES[currentStageIndex] || STAGES[0];
  const isDelivered = activeOrder.status === 'delivered';
  const isCancelled = activeOrder.status === 'cancelled';

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Top Bar with Back & All Orders button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-brand-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>

        <button
          onClick={onOpenAllOrders}
          className="text-xs font-extrabold text-brand-black bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs hover:bg-gray-50"
        >
          View All Orders
        </button>
      </div>

      {/* Main Status Header Card */}
      <div className="bg-brand-black text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-yellow/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
            <span>ORDER {activeOrder.orderNumber}</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Tracking
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{activeStage.icon}</span>
            <span className="text-brand-yellow">
              {isCancelled ? 'Order Cancelled' : activeStage.title}
            </span>
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-gray-300 font-medium">
            {isCancelled
              ? 'This order was cancelled by the kitchen or customer.'
              : isDelivered
              ? 'Your Bhook_Lgi food has been delivered! Enjoy your meal.'
              : activeStage.desc}
          </p>

          {/* Delivery & ETA Badges */}
          <div className="mt-5 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gray-800 text-brand-yellow">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">Destination</div>
                <div className="font-extrabold text-white">
                  {activeOrder.hostel}, Room {activeOrder.roomNumber}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gray-800 text-brand-yellow">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">Est. Arrival</div>
                <div className="font-extrabold text-white">
                  {isDelivered ? 'Delivered 🎉' : `~${activeOrder.etaMinutes || 15} mins`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-5">
          Order Progress Timeline
        </h3>

        <div className="relative pl-3 space-y-6">
          {/* Vertical Track Line */}
          <div className="absolute left-[23px] top-3 bottom-3 w-0.5 bg-gray-200"></div>

          {STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <div key={stage.key} className="relative flex items-start gap-4">
                {/* Step Circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                    isCompleted
                      ? 'bg-brand-yellow text-brand-black font-black text-xs ring-4 ring-brand-yellowLight'
                      : isCurrent
                      ? 'bg-brand-yellow text-brand-black ring-4 ring-brand-yellow/40 animate-pulse-glow shadow-yellow-glow'
                      : 'bg-gray-100 border border-gray-300 text-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-black"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  )}
                </div>

                {/* Step Label & Details */}
                <div
                  className={`flex-1 transition-all ${
                    isCurrent
                      ? 'p-3 rounded-2xl bg-brand-yellowLight/70 border border-brand-yellow/40 -mt-2 shadow-xs'
                      : 'pt-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        isCurrent
                          ? 'font-black text-brand-black flex items-center gap-1.5'
                          : isCompleted
                          ? 'font-extrabold text-brand-black'
                          : 'font-semibold text-gray-400'
                      }`}
                    >
                      <span>{stage.title}</span>
                      {isCurrent && <span className="text-base">{stage.icon}</span>}
                    </span>

                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-yellow text-brand-black">
                        Current
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs mt-0.5 ${
                      isCurrent ? 'text-brand-black/80 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Item Details Card */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
          Items in this Order
        </h3>

        <div className="divide-y divide-gray-100 space-y-2">
          {activeOrder.items?.map((item, i) => (
            <div key={i} className="pt-2 flex items-center justify-between text-xs">
              <div>
                <div className="font-extrabold text-brand-black">
                  {item.quantity}x {item.productName || item.name}
                </div>
                <div className="text-[11px] text-gray-500">
                  {item.variant && <span>{item.variant} • </span>}
                  {item.spiceLevel && (
                    <span>{item.spiceLevel === 'spicy' ? '🌶️ Spicy' : '🙂 Non-Spicy'}</span>
                  )}
                  {item.addons && item.addons.length > 0 && (
                    <span> • +{item.addons.join(', ')}</span>
                  )}
                </div>
              </div>
              <div className="font-black text-brand-black">
                ₹{item.itemTotal || item.priceAtOrder * item.quantity}
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span className="font-bold text-gray-800">₹{activeOrder.subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Delivery & Packaging</span>
            <span className="font-bold text-gray-800">
              ₹{(activeOrder.deliveryFee || 0) + (activeOrder.packagingFee || 0)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-black text-brand-black">
            <span>Total Amount Paid/COD</span>
            <span className="text-base text-brand-black">₹{activeOrder.total}</span>
          </div>
        </div>

        {/* Hostel delivery note preview */}
        {activeOrder.deliveryNotes && (
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
            <span className="font-bold text-gray-800">Note: </span>
            "{activeOrder.deliveryNotes}"
          </div>
        )}

        {/* Contact Kitchen / Help Button */}
        <div className="pt-2">
          <a
            href="tel:9999988888"
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-brand-black font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Hostel Kitchen / Delivery Guy</span>
          </a>
        </div>
      </div>
    </div>
  );
}
