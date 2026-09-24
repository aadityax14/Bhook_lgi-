
import React from 'react';
import {
  MapPin,
  Package,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export default function DeliveryOrderCard({ order, onStatusChange }) {

  const isReady = order.status === 'Ready for Pickup';
  const isOutForDelivery = order.status === 'On the Way';
  const isDelivered = order.status === 'Delivered';

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-gray-100">

        <div className="flex items-start justify-between gap-3">

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Order
            </p>

            <h3 className="text-xl font-black text-brand-black">
              {order.orderNumber || `#${order.id}`}
            </h3>
          </div>

          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              isReady
                ? 'bg-green-100 text-green-700'
                : isOutForDelivery
                ? 'bg-orange-100 text-orange-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {order.status}
          </span>

        </div>

        {/* Delivery Location */}
        <div className="mt-5 flex items-start gap-3">

          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-brand-black" />
          </div>

          <div>
            <p className="text-sm text-gray-500 font-semibold">
              Deliver to
            </p>

            <p className="font-black text-brand-black">
              {order.hostel}
            </p>

            <p className="text-sm text-gray-500">
              Room {order.roomNumber}
            </p>
          </div>

        </div>

      </div>

      {/* Order Details */}
      <div className="p-5">

        {/* Customer */}
        {order.customerName && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Customer
            </p>

            <p className="font-bold text-gray-900 mt-1">
              {order.customerName}
            </p>
          </div>
        )}

        {/* Items */}
        <div>

          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-gray-500" />

            <p className="font-black text-gray-900">
              Order Items
            </p>
          </div>

          <div className="space-y-2">

            {order.items?.map((item, index) => (
              <div
                key={`${order.id}-${index}`}
                className="rounded-2xl bg-gray-50 p-3"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="font-bold text-gray-900">
                      {item.quantity} × {item.productName}
                    </p>

                    {item.variant && (
                      <p className="text-sm text-gray-500 mt-1">
                        Variant: {item.variant}
                      </p>
                    )}

                    {item.spiceLevel && (
                      <p className="text-sm text-gray-500">
                        Spice: {item.spiceLevel}
                      </p>
                    )}

                    {item.addons && (
                      <p className="text-sm text-gray-500">
                        Add-ons: {item.addons}
                      </p>
                    )}

                  </div>

                  <p className="font-bold text-gray-800 shrink-0">
                    ₹{item.itemTotal}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* Total */}
        <div className="mt-5 rounded-2xl bg-brand-yellowLight px-4 py-3 flex items-center justify-between">

          <span className="font-semibold text-gray-700">
            Order Total
          </span>

          <span className="text-lg font-black text-brand-black">
            ₹{order.total}
          </span>

        </div>

      </div>

      {/* ACTION BUTTONS */}

      {/* Ready → Accept */}
      {isReady && (
        <button
          onClick={() =>
            onStatusChange(order.id, 'Accepted')
          }
          className="w-full border-t border-gray-100 px-5 py-4 flex items-center justify-center gap-2 bg-brand-yellow text-brand-black font-black hover:brightness-95 transition-all"
        >
          <CheckCircle2 className="w-5 h-5" />
          Accept Order
        </button>
      )}

      {/* Out for Delivery → Delivered */}
      {isOutForDelivery && (
        <button
          onClick={() =>
            onStatusChange(order.id, 'Delivered')
          }
          className="w-full border-t border-gray-100 px-5 py-4 flex items-center justify-center gap-2 bg-black text-white font-black hover:bg-gray-800 transition-all"
        >
          <CheckCircle2 className="w-5 h-5" />
          Mark as Delivered
        </button>
      )}

      {/* Delivered */}
      {isDelivered && (
        <div className="border-t border-green-100 bg-green-50 px-5 py-4 flex items-center justify-center gap-2 text-green-700 font-black">
          <CheckCircle2 className="w-5 h-5" />
          Successfully Delivered
        </div>
      )}

    </div>
  );
}

