import React from 'react';
import { X, Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export default function NotificationModal({ isOpen, onClose, onTrackOrder }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative z-10 w-full sm:max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-brand-cream/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-yellow flex items-center justify-center text-brand-black">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base text-brand-black">Notifications</h3>
              <span className="text-[11px] text-gray-500">{unreadCount} unread messages</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 text-gray-500 hover:text-brand-black text-xs font-bold"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-400" />
              <p className="text-xs font-semibold">No notifications yet</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Status updates for your orders will appear here.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const timeStr = new Date(n.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.orderId) {
                      onTrackOrder(n.orderId);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    !n.isRead
                      ? 'bg-brand-yellowLight/50 border-brand-yellow/30 shadow-2xs'
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-yellow shrink-0 mt-1.5"></span>
                      )}
                      <div>
                        <h4 className="text-xs font-extrabold text-brand-black">{n.title}</h4>
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{n.message}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{timeStr}</span>
                  </div>

                  {n.orderId && (
                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-end text-[10px] font-bold text-brand-yellowHover">
                      <span>View Order</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-1" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <span className="text-[10px] font-bold text-gray-400">
            Push notifications powered by Bhook_Lgi Real-Time Sync
          </span>
        </div>
      </div>
    </div>
  );
}
