import React from 'react';
import { X, Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';

export default function MyOrdersModal({ isOpen, onClose }) {
  const { orders, setActiveOrderId } = useOrder();

  if (!isOpen) return null;

  const getStatusInfo = (status) => {
    switch (status) {
      case 'placed':
        return {
          label: 'Order Placed',
          icon: <Clock className="w-4 h-4" />,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        };

      case 'accepted':
        return {
          label: 'Order Accepted',
          icon: <CheckCircle className="w-4 h-4" />,
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };

      case 'preparing':
        return {
          label: 'Preparing',
          icon: <Package className="w-4 h-4" />,
          className: 'bg-orange-50 text-orange-700 border-orange-200'
        };

      case 'ready':
        return {
          label: 'Ready',
          icon: <CheckCircle className="w-4 h-4" />,
          className: 'bg-green-50 text-green-700 border-green-200'
        };

      case 'out_for_delivery':
        return {
          label: 'Out for Delivery',
          icon: <Truck className="w-4 h-4" />,
          className: 'bg-purple-50 text-purple-700 border-purple-200'
        };

      case 'delivered':
        return {
          label: 'Delivered',
          icon: <CheckCircle className="w-4 h-4" />,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };

      default:
        return {
          label: status || 'Processing',
          icon: <Clock className="w-4 h-4" />,
          className: 'bg-gray-50 text-gray-700 border-gray-200'
        };
    }
  };

  const handleOrderClick = (order) => {
    setActiveOrderId(order.id);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-brand-cream/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-yellow flex items-center justify-center">
              <Package className="w-5 h-5 text-brand-black" />
            </div>

            <div>
              <h2 className="text-lg font-black text-brand-black">
                My Orders
              </h2>

              <p className="text-xs text-gray-500">
                Your complete order history
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Orders */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />

              <h3 className="font-bold text-gray-700">
                No orders yet
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Your Bhook_Lgi orders will appear here.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const status = getStatusInfo(order.status);

              return (
                <button
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="w-full text-left rounded-2xl border border-gray-100 p-4 hover:bg-gray-50 transition-all active:scale-[0.99]"
                >

                  {/* Order top */}
                  <div className="flex items-center justify-between gap-3">

                    <div>
                      <p className="font-black text-sm text-brand-black">
                        #{order.orderNumber || order.id}
                      </p>

                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })
                          : 'Order time unavailable'}
                      </p>
                    </div>

                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${status.className}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>

                  </div>

                  {/* Items */}
                  <div className="mt-3 space-y-1.5">

                    {order.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-600">
                          {item.quantity} × {item.productName}
                          {item.variant && ` (${item.variant})`}
                          {item.spiceLevel && ` • ${item.spiceLevel}`}
                        </span>

                        <span className="font-semibold text-gray-700">
                          ₹{item.itemTotal}
                        </span>
                      </div>
                    ))}

                  </div>

                  {/* Bottom */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">

                    <div className="text-[11px] text-gray-500">
                      {order.hostel}
                      {order.roomNumber
                        ? ` • Room ${order.roomNumber}`
                        : ''}
                    </div>

                    <div className="font-black text-brand-black">
                      ₹{order.total}
                    </div>

                  </div>

                  {/* Delivered message */}
                  {order.status === 'delivered' && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Successfully delivered
                    </div>
                  )}

                </button>
              );
            })
          )}

        </div>

      </div>
    </div>
  );
}