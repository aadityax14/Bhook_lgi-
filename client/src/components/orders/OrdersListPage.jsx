import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';

export default function OrdersListPage({ onSelectOrder, onStartNewOrder }) {
  const { orders } = useOrder();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">Placed 📝</span>;
      case 'accepted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700">Accepted 🔥</span>;
      case 'preparing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-800 border border-yellow-300 animate-pulse">Preparing 🍜</span>;
      case 'ready':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">Ready 🥡</span>;
      case 'out_for_delivery':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-bounce">Out for Delivery 🛵</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">Delivered 🎉</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">Cancelled ❌</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-brand-black">My Bhook_Lgi Orders</h2>
          <p className="text-xs text-gray-500">Track current cravings and see past food orders</p>
        </div>

        <button
          onClick={onStartNewOrder}
          className="px-3.5 py-1.5 bg-brand-yellow text-brand-black text-xs font-bold rounded-xl shadow-xs hover:bg-brand-yellowHover"
        >
          + New Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl p-6 border border-gray-100 shadow-soft">
          <div className="w-16 h-16 bg-brand-yellowLight rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            📦
          </div>
          <h3 className="font-extrabold text-base text-brand-black">No past orders found</h3>
          <p className="text-xs text-gray-500 mt-1 mb-5">
            Your late night hostel feasts will show up here.
          </p>
          <button
            onClick={onStartNewOrder}
            className="px-6 py-2.5 bg-brand-yellow text-brand-black font-extrabold text-xs rounded-2xl shadow-yellow-glow"
          >
            Order Something Delicious
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((ord) => {
            const dateStr = new Date(ord.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={ord.id}
                onClick={() => onSelectOrder(ord.id)}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-soft hover:shadow-card-lift transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="font-black text-sm text-brand-black group-hover:text-brand-yellowHover transition-colors">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-2">{dateStr}</span>
                  </div>
                  <div>{getStatusBadge(ord.status)}</div>
                </div>

                <div className="py-3 text-xs text-gray-600 space-y-1">
                  <div className="font-bold text-brand-black">
                    {ord.items?.map(i => `${i.quantity}x ${i.productName || i.name}`).join(', ')}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>Delivered to: {ord.hostel}, Room {ord.roomNumber}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm font-black text-brand-black">
                    ₹{ord.total}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-brand-yellowHover group-hover:translate-x-0.5 transition-transform">
                    <span>Track Status</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
