import React from 'react';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { Bell, CheckCircle2 } from 'lucide-react';

export default function Toast({ onOpenOrders }) {
  const { toastMessage } = useCart();
  const { latestToast, markAsRead } = useNotification();

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm flex flex-col gap-2 pointer-events-none">
      {/* Notification Toast */}
      {latestToast && (
        <div className="pointer-events-auto bg-brand-black text-white p-3.5 rounded-2xl shadow-2xl border border-brand-yellow/40 flex items-start justify-between gap-3 animate-bounce-in">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-brand-yellow/20 rounded-xl text-brand-yellow">
              <Bell className="w-4 h-4 text-brand-yellow animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-bold text-brand-yellow">{latestToast.title}</div>
              <div className="text-[11px] text-gray-200 line-clamp-2">{latestToast.message}</div>
            </div>
          </div>
          <button
            onClick={() => {
              markAsRead(latestToast.id);
              onOpenOrders();
            }}
            className="text-[10px] font-extrabold uppercase tracking-wide bg-brand-yellow text-brand-black px-2.5 py-1 rounded-lg hover:bg-yellow-400 shrink-0"
          >
            Track
          </button>
        </div>
      )}

      {/* Cart Add Confirmation Toast */}
      {toastMessage && (
        <div className="pointer-events-auto bg-brand-yellow text-brand-black px-4 py-2.5 rounded-2xl shadow-yellow-glow font-bold text-xs flex items-center justify-center gap-2 border border-brand-yellowHover animate-bounce-in">
          <CheckCircle2 className="w-4 h-4 text-brand-black" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
