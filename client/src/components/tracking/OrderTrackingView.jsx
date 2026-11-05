
import React, { useEffect, useRef, useState } from 'react';
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

export default function OrderTrackingView({
  onBackToMenu,
  onOpenAllOrders,
  onExploreZuxu
}) {
  const { activeOrder, fetchOrders } = useOrder();

  // Slider state
  const sliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Detect currently visible slide
  const handleSliderScroll = () => {
    if (!sliderRef.current) return;

    const slideWidth = sliderRef.current.clientWidth;

    if (!slideWidth) return;

    const index = Math.round(
      sliderRef.current.scrollLeft / slideWidth
    );

    setActiveSlide(index);
  };

  // Navigate using pagination dots
  const goToSlide = (index) => {
    if (!sliderRef.current) return;

    sliderRef.current.scrollTo({
      left: index * sliderRef.current.clientWidth,
      behavior: 'smooth'
    });

    setActiveSlide(index);
  };

  // Refresh order status
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

        <h3 className="text-base font-black text-brand-black mb-1">
          No Active Order
        </h3>

        <p className="text-xs text-gray-500 mb-4">
          You haven't placed any order yet.
        </p>

        <button
          onClick={onBackToMenu}
          className="px-5 py-2.5 bg-brand-yellow text-brand-black font-extrabold text-xs rounded-2xl shadow-yellow-glow"
        >
          Order Food Now
        </button>

      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex(
    stage => stage.key === activeOrder.status
  );

  const activeStage = STAGES[currentStageIndex] || STAGES[0];

  const isDelivered = activeOrder.status === 'delivered';
  const isCancelled = activeOrder.status === 'cancelled';

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">

      {/* TOP NAVIGATION */}
      <div className="flex items-center justify-between">

        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-brand-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>

        <button
          onClick={onOpenAllOrders}
          className="text-xs font-extrabold text-brand-black bg-white px-3 py-1.5 rounded-xl border border-gray-200"
        >
          View All Orders
        </button>

      </div>

      {/* ZUXU + ORDER STATUS SLIDER */}
      <div className="relative">

        <div
          ref={sliderRef}
          onScroll={handleSliderScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-3xl"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >

          {/* SLIDE 1 - ZUXU ADVERTISEMENT */}
          <div className="w-full flex-none snap-center">

            <div className="relative overflow-hidden min-h-[220px] bg-gradient-to-br from-pink-50 via-white to-rose-100 rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-soft">

              <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-200/50 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex items-center gap-3 sm:gap-5">

                <div className="flex-1">

                  <span className="inline-block px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 text-[9px] sm:text-[10px] font-black tracking-wide mb-3">
                    🎁 HANDMADE WITH LOVE
                  </span>

                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                    Make Someone Smile ❤️
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Discover handmade gifts, crochet, rings and cute accessories.
                  </p>

                  <button
                    onClick={onExploreZuxu}
                    className="mt-4 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-gray-800 active:scale-95 transition-all"
                  >
                    Explore Zuxu →
                  </button>

                </div>

                {/* ZUXU LOGO */}
                <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden flex items-center justify-center">

                  <img
                    src="/zuxu.png"
                    alt="Zuxu Handmade Gifts"
                    className="w-full h-full object-contain"
                  />

                </div>

              </div>

              <div className="mt-4 text-center text-[9px] font-bold text-pink-500">
                ADVERTISEMENT
              </div>

            </div>
          </div>

          {/* SLIDE 2 - LIVE ORDER STATUS */}
          <div className="w-full flex-none snap-center">

            <div className="bg-brand-black text-white rounded-3xl p-6 shadow-xl relative overflow-hidden min-h-[220px]">

              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-yellow/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">

                <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-4">

                  <span>ORDER {activeOrder.orderNumber}</span>

                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Live Tracking
                  </span>

                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-brand-yellow flex items-center gap-2">

                  <span>{activeStage.icon}</span>

                  {isCancelled
                    ? 'Order Cancelled'
                    : activeStage.title}

                </h2>

                <p className="mt-2 text-xs sm:text-sm text-gray-300 font-medium">

                  {isCancelled
                    ? 'This order was cancelled by the kitchen or customer.'
                    : isDelivered
                    ? 'Your Bhook_Lgi food has been delivered! Enjoy your meal.'
                    : activeStage.desc}

                </p>

                {/* DELIVERY DETAILS */}
                <div className="mt-5 pt-4 border-t border-gray-800 flex flex-wrap justify-between gap-4 text-xs">

                  <div className="flex items-center gap-2">

                    <div className="p-2 rounded-xl bg-gray-800 text-brand-yellow">
                      <MapPin className="w-4 h-4" />
                    </div>

                    <div>

                      <div className="text-[10px] text-gray-400 font-bold uppercase">
                        Destination
                      </div>

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

                      <div className="text-[10px] text-gray-400 font-bold uppercase">
                        Est. Arrival
                      </div>

                      <div className="font-extrabold text-white">
                        {isDelivered
                          ? 'Delivered 🎉'
                          : `~${activeOrder.etaMinutes || 15} mins`}
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>

        {/* CLICKABLE SLIDER DOTS */}
        <div className="flex justify-center items-center gap-2 mt-3">

          {[0, 1].map((index) => (

            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeSlide === index ? 'true' : undefined}
              className={`rounded-full transition-all duration-300 ${
                activeSlide === index
                  ? 'w-6 h-2 bg-brand-yellow'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />

          ))}

        </div>

      </div>

      {/* ORDER PROGRESS TIMELINE */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">

        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-5">
          Order Progress Timeline
        </h3>

        <div className="relative pl-3 space-y-6">

          <div className="absolute left-[23px] top-3 bottom-3 w-0.5 bg-gray-200" />

          {STAGES.map((stage, idx) => {

            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <div
                key={stage.key}
                className="relative flex items-start gap-4"
              >

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
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-black" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}

                </div>

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

                      {isCurrent && (
                        <span>{stage.icon}</span>
                      )}

                    </span>

                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-yellow text-brand-black">
                        Current
                      </span>
                    )}

                  </div>

                  <p
                    className={`text-xs mt-0.5 ${
                      isCurrent
                        ? 'text-brand-black/80 font-medium'
                        : 'text-gray-400'
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

      {/* ORDER ITEM DETAILS */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-4">

        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
          Items in this Order
        </h3>

        <div className="divide-y divide-gray-100 space-y-2">

          {activeOrder.items?.map((item, i) => (

            <div
              key={i}
              className="pt-2 flex items-center justify-between text-xs"
            >

              <div>

                <div className="font-extrabold text-brand-black">
                  {item.quantity}x {item.productName || item.name}
                </div>

                <div className="text-[11px] text-gray-500">

                  {item.variant && (
                    <span>{item.variant} • </span>
                  )}

                  {item.spiceLevel && (
                    <span>
                      {item.spiceLevel === 'spicy'
                        ? '🌶️ Spicy'
                        : '🙂 Non-Spicy'}
                    </span>
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

        {/* TOTAL SUMMARY */}
        <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">

          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>

            <span className="font-bold text-gray-800">
              ₹{activeOrder.subtotal}
            </span>
          </div>

          <div className="flex justify-between text-gray-500">
            <span>Delivery & Packaging</span>

            <span className="font-bold text-gray-800">
              ₹{(activeOrder.deliveryFee || 0) + (activeOrder.packagingFee || 0)}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-black text-brand-black">

            <span>Total Amount Paid/COD</span>

            <span className="text-base text-brand-black">
              ₹{activeOrder.total}
            </span>

          </div>

        </div>

        {/* DELIVERY NOTE */}
        {activeOrder.deliveryNotes && (
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
            <span className="font-bold text-gray-800">Note: </span>
            "{activeOrder.deliveryNotes}"
          </div>
        )}

        {/* CONTACT KITCHEN */}
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
