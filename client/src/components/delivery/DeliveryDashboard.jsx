
import React from 'react';
import {
  Bike,
  LogOut,
  Package,
  CheckCircle2,
  RefreshCw,
  Clock,
  Utensils,
  Navigation,
} from 'lucide-react';

import { useOrder } from '../../context/OrderContext';
import DeliveryOrderCard from './DeliveryOrderCard';

export default function DeliveryDashboard({
  deliveryPartner,
  onLogout,
}) {
  const {
    orders,
    fetchOrders,
    updateOrderStatus,
  } = useOrder();

  /*
   * DELIVERY FLOW
   *
   * Chef:
   * ready
   *
   * Delivery:
   * ready
   *   ↓
   * out_for_delivery
   *   ↓
   * delivered
   */

  // Orders waiting for delivery partner
  const readyOrders = orders.filter(
    (order) => order.status === 'ready'
  );

  // Orders currently being delivered
  const outForDeliveryOrders = orders.filter(
    (order) => order.status === 'out_for_delivery'
  );

  // Completed deliveries
  const deliveredOrders = orders.filter(
    (order) => order.status === 'delivered'
  );

  // Main active orders
  const activeDeliveryOrders = [
    ...readyOrders,
    ...outForDeliveryOrders,
  ];

  const handleStatusChange = async (
    orderId,
    newStatus
  ) => {
    try {
      await updateOrderStatus(orderId, newStatus);

      // Refresh so the order immediately moves
      // between Active and Completed sections.
      await fetchOrders();

    } catch (error) {
      console.error(
        'Failed to update delivery status:',
        error
      );

      alert(
        'Could not update order status. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================= HEADER ================= */}

      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">

        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-2xl bg-brand-yellow flex items-center justify-center">

              <Bike className="w-6 h-6 text-brand-black" />

            </div>

            <div>

              <h1 className="font-black text-lg text-brand-black">
                Delivery Partner
              </h1>

              <p className="text-xs text-gray-500 font-medium">
                {deliveryPartner?.deliveryId || 'BL-DLV-001'}
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2">

            {/* Refresh */}

            <button
              onClick={fetchOrders}
              className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition"
              title="Refresh orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Logout */}

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />

              <span className="hidden sm:block">
                Logout
              </span>
            </button>

          </div>

        </div>

      </header>


      {/* ================= MAIN ================= */}

      <main className="max-w-5xl mx-auto px-4 py-6">


        {/* ================= TODAY STATUS ================= */}

        <div className="bg-brand-black text-white rounded-3xl p-5 mb-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-white/60 font-semibold">
                Today's Status
              </p>

              <h2 className="text-xl font-black mt-1">
                🟢 You are working today
              </h2>

              <p className="text-sm text-white/60 mt-1">
                Orders ready from the kitchen will appear here.
              </p>

            </div>

            <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />

          </div>

        </div>


        {/* ================= STATS ================= */}

        <div className="grid grid-cols-3 gap-3 mb-8">

          {/* Ready */}

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">

            <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm font-semibold">

              <Clock className="w-4 h-4" />

              Ready

            </div>

            <p className="text-2xl sm:text-3xl font-black text-brand-black mt-2">
              {readyOrders.length}
            </p>

          </div>


          {/* Out for delivery */}

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">

            <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm font-semibold">

              <Navigation className="w-4 h-4" />

              On Way

            </div>

            <p className="text-2xl sm:text-3xl font-black text-orange-500 mt-2">
              {outForDeliveryOrders.length}
            </p>

          </div>


          {/* Delivered */}

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">

            <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm font-semibold">

              <CheckCircle2 className="w-4 h-4" />

              Delivered

            </div>

            <p className="text-2xl sm:text-3xl font-black text-green-600 mt-2">
              {deliveredOrders.length}
            </p>

          </div>

        </div>


        {/* ================================================= */}
        {/* ACTIVE DELIVERY ORDERS */}
        {/* ================================================= */}

        <section className="mb-10">

          <div className="flex items-center justify-between mb-4">

            <div>

              <h2 className="text-xl font-black text-brand-black">
                Active Deliveries
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Orders that still need to be delivered.
              </p>

            </div>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-bold">
              {activeDeliveryOrders.length}
            </span>

          </div>


          {activeDeliveryOrders.length === 0 ? (

            <div className="bg-white rounded-3xl border border-gray-100 p-10 sm:p-14 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">

                <Utensils className="w-8 h-8 text-gray-300" />

              </div>

              <h3 className="font-black text-lg text-brand-black mt-5">
                No active deliveries
              </h3>

              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                When the chef marks an order as
                <span className="font-bold"> Ready</span>,
                it will automatically appear here.
              </p>

              <button
                onClick={fetchOrders}
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-yellow text-brand-black font-black"
              >

                <RefreshCw className="w-4 h-4" />

                Check for Orders

              </button>

            </div>

          ) : (

            <div className="space-y-4">

              {activeDeliveryOrders.map((order) => (

                <DeliveryOrderCard
                  key={order.id}

                  order={{
                    ...order,

                    status:
                      order.status === 'ready'
                        ? 'Ready for Pickup'
                        : order.status === 'out_for_delivery'
                        ? 'On the Way'
                        : order.status === 'delivered'
                        ? 'Delivered'
                        : order.status,
                  }}

                  onStatusChange={(orderId, displayStatus) => {

                    let backendStatus;

                    if (displayStatus === 'Accepted') {
                      backendStatus = 'out_for_delivery';
                    } else if (
                      displayStatus === 'Delivered'
                    ) {
                      backendStatus = 'delivered';
                    } else {
                      backendStatus = displayStatus;
                    }

                    handleStatusChange(
                      orderId,
                      backendStatus
                    );
                  }}

                />

              ))}

            </div>

          )}

        </section>


        {/* ================================================= */}
        {/* COMPLETED DELIVERIES */}
        {/* ================================================= */}

        <section>

          <div className="flex items-center justify-between mb-4">

            <div>

              <h2 className="text-xl font-black text-brand-black">
                Completed Deliveries
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Orders you have successfully delivered.
              </p>

            </div>

            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
              {deliveredOrders.length}
            </span>

          </div>


          {deliveredOrders.length === 0 ? (

            <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">

              <CheckCircle2 className="w-10 h-10 mx-auto text-gray-300" />

              <p className="font-bold text-gray-500 mt-3">
                No completed deliveries yet
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {deliveredOrders.map((order) => (

                <DeliveryOrderCard
                  key={order.id}

                  order={{
                    ...order,
                    status: 'Delivered',
                  }}

                  onStatusChange={() => {}}

                />

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

