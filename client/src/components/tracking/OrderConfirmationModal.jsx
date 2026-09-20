import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Clock, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OrderConfirmationModal({ order, onTrackOrder }) {
  useEffect(() => {
    // Fire festive confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB800', '#121212', '#EF4444', '#10B981', '#FFFFFF']
      });
    } catch (e) {
      console.log(e);
    }
  }, []);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center border border-brand-yellow/30 animate-bounce-in">
        {/* Animated Celebration Icon */}
        <div className="w-20 h-20 mx-auto bg-brand-yellowLight border-4 border-brand-yellow rounded-full flex items-center justify-center mb-4 shadow-yellow-glow animate-pulse">
          <span className="text-4xl">🎉</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-black text-brand-black tracking-tight mb-1">
          Order Placed! 🎉
        </h2>
        <p className="text-xs text-gray-500 font-semibold mb-6">
          Your Bhook_Lgi order is on its way to the kitchen.
        </p>

        {/* Key Order Info Card */}
        <div className="bg-brand-cream/80 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs text-left mb-6">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500 font-bold uppercase text-[10px]">Order ID</span>
            <span className="font-black text-brand-black text-sm bg-white px-2 py-0.5 rounded-lg border border-gray-200">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-yellow" />
              Est. Preparation Time:
            </span>
            <span className="font-extrabold text-brand-black">~{order.etaMinutes || 15} Mins</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-brand-yellow" />
              Delivering To:
            </span>
            <span className="font-extrabold text-brand-black">{order.hostel}, Room {order.roomNumber}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-700">Total Paid/COD:</span>
            <span className="font-black text-brand-black text-sm">₹{order.total}</span>
          </div>
        </div>

        {/* Track Order Action Button */}
        <button
          onClick={onTrackOrder}
          className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-brand-black font-black text-sm rounded-2xl shadow-yellow-glow flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <span>Track Order</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
