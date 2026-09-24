import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  ChefHat,
  Clock,
  RefreshCw,
  Utensils
} from 'lucide-react';
import { api } from '../../services/api';

export default function ChefDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // =========================================================
  // FETCH ORDERS
  // =========================================================

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.getOrders();

      if (res && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch chef orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // AUTO REFRESH
  // =========================================================

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      const currentOrder = orders.find(
        order => order.id === orderId
      );

      if (!currentOrder) {
        throw new Error('Order not found.');
      }

      // =====================================================
      // CHEF: ACCEPT & PREPARE
      //
      // The Chef button sends "preparing".
      //
      // But inventory must be deducted when the order becomes
      // "accepted".
      //
      // Therefore:
      //
      // placed
      //   ↓
      // accepted  ← STOCK DEDUCTED HERE
      //   ↓
      // preparing
      // =====================================================

      if (
        status === 'preparing' &&
        currentOrder.status === 'placed'
      ) {
        // ---------------------------------------------------
        // STEP 1: ACCEPT ORDER
        // ---------------------------------------------------

        const acceptedRes =
          await api.updateOrderStatus(
            orderId,
            'accepted'
          );

        if (!acceptedRes?.data) {
          throw new Error(
            'Order could not be accepted.'
          );
        }

        // Update local state
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId
              ? acceptedRes.data
              : order
          )
        );

        // ---------------------------------------------------
        // STEP 2: MOVE TO PREPARING
        // ---------------------------------------------------

        const preparingRes =
          await api.updateOrderStatus(
            orderId,
            'preparing'
          );

        if (!preparingRes?.data) {
          throw new Error(
            'Order was accepted but could not be moved to preparing.'
          );
        }

        // Update local state again
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId
              ? preparingRes.data
              : order
          )
        );

        return;
      }

      // =====================================================
      // NORMAL STATUS UPDATE
      // =====================================================

      const res =
        await api.updateOrderStatus(
          orderId,
          status
        );

      if (res?.data) {
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId
              ? res.data
              : order
          )
        );
      } else {
        throw new Error(
          'Server did not return updated order.'
        );
      }

    } catch (err) {
      console.error(
        'Failed to update order status:',
        err
      );

      alert(
        err.message ||
        'Could not update order status. Please try again.'
      );

      // Refresh from server so UI never stays
      // in an incorrect state.
      await fetchOrders();

    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================================
  // STATUS COLORS
  // =========================================================

  const getStatusClass = status => {
    if (status === 'preparing') {
      return 'bg-yellow-400 text-black';
    }

    if (status === 'ready') {
      return 'bg-green-500 text-white';
    }

    if (status === 'accepted') {
      return 'bg-blue-500 text-white';
    }

    return 'bg-gray-100 text-gray-500';
  };

  // =========================================================
  // CHEF ORDERS
  // =========================================================

  const chefOrders = orders.filter(order =>
    [
      'placed',
      'accepted',
      'preparing',
      'ready'
    ].includes(order.status)
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#fffdf5] p-4 sm:p-6">

      <div className="max-w-6xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between mb-6">

          <div>
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-black" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Chef Dashboard
                </h1>

                <p className="text-sm text-gray-500">
                  Manage kitchen orders
                </p>
              </div>

            </div>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">

          {/* New */}

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">
              New
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {
                orders.filter(
                  order =>
                    order.status === 'placed'
                ).length
              }
            </p>
          </div>

          {/* Preparing */}

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">
              Preparing
            </p>

            <p className="text-2xl font-bold text-yellow-500">
              {
                orders.filter(
                  order =>
                    order.status === 'preparing'
                ).length
              }
            </p>
          </div>

          {/* Ready */}

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">
              Ready
            </p>

            <p className="text-2xl font-bold text-green-500">
              {
                orders.filter(
                  order =>
                    order.status === 'ready'
                ).length
              }
            </p>
          </div>

          {/* Total Kitchen Orders */}

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">
              Kitchen Orders
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {chefOrders.length}
            </p>
          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">

            <RefreshCw className="w-7 h-7 mx-auto mb-3 animate-spin text-yellow-500" />

            <p className="text-gray-500">
              Loading orders...
            </p>

          </div>

        ) : chefOrders.length === 0 ? (

          /* =================================================
             NO ORDERS
          ================================================= */

          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">

            <Utensils className="w-10 h-10 mx-auto mb-3 text-gray-300" />

            <h2 className="text-lg font-semibold text-gray-800">
              No kitchen orders
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              New customer orders will appear here automatically.
            </p>

          </div>

        ) : (

          /* =================================================
             ORDERS
          ================================================= */

          <div className="space-y-4">

            {chefOrders.map(order => (

              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >

                {/* =================================================
                    ORDER HEADER
                ================================================= */}

                <div className="p-4 sm:p-5 border-b border-gray-100">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>

                      <div className="flex items-center gap-2">

                        <h2 className="font-bold text-lg text-gray-900">
                          {order.orderNumber}
                        </h2>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>

                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">

                        <Clock className="w-4 h-4" />

                        {new Date(
                          order.createdAt
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}

                      </div>

                    </div>

                    <div className="text-left sm:text-right">

                      <p className="font-bold text-gray-900">
                        ₹{order.total}
                      </p>

                      <p className="text-sm text-gray-500">
                        {order.hostel} • Room {order.roomNumber}
                      </p>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    CUSTOMER
                ================================================= */}

                <div className="px-4 sm:px-5 pt-4">

                  <p className="text-sm font-semibold text-gray-800">
                    Customer: {order.customerName}
                  </p>

                </div>

                {/* =================================================
                    ITEMS
                ================================================= */}

                <div className="p-4 sm:p-5 space-y-3">

                  {order.items?.map(
                    (item, index) => (

                      <div
                        key={`${order.id}-${index}`}
                        className="flex items-start justify-between gap-4 bg-gray-50 rounded-xl p-3"
                      >

                        <div>

                          <p className="font-semibold text-gray-900">
                            {item.quantity} × {item.productName}
                          </p>

                          {item.variant && (
                            <p className="text-sm text-gray-500">
                              {item.variant}
                            </p>
                          )}

                          {item.spiceLevel && (
                            <p className="text-sm text-gray-500">
                              Spice: {item.spiceLevel}
                            </p>
                          )}

                          {item.addons &&
                            item.addons.length > 0 && (
                              <p className="text-sm text-gray-500">
                                Add-ons: {item.addons}
                              </p>
                            )}

                        </div>

                        <p className="font-semibold text-gray-800">
                          ₹{item.itemTotal}
                        </p>

                      </div>

                    )
                  )}

                </div>

                {/* =================================================
                    ACTION BUTTONS
                ================================================= */}

                <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50">

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    {/* =================================================
                        ACCEPT & PREPARE
                    ================================================= */}

                    <button
                      disabled={
                        updatingId === order.id ||
                        ![
                          'placed',
                          'accepted'
                        ].includes(order.status)
                      }
                      onClick={() =>
                        updateStatus(
                          order.id,
                          'preparing'
                        )
                      }
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition ${
                        order.status === 'preparing'
                          ? 'bg-yellow-400 text-black'
                          : order.status === 'placed' ||
                            order.status === 'accepted'
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >

                      {updatingId === order.id ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />

                          {order.status === 'preparing'
                            ? 'Preparing'
                            : 'Accept & Prepare'}
                        </>
                      )}

                    </button>

                    {/* =================================================
                        PREPARING
                    ================================================= */}

                    <button
                      disabled={
                        updatingId === order.id ||
                        order.status !== 'preparing'
                      }
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition ${
                        order.status === 'preparing'
                          ? 'bg-yellow-400 text-black'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >

                      <ChefHat className="w-5 h-5" />

                      Preparing

                    </button>

                    {/* =================================================
                        READY
                    ================================================= */}

                    <button
                      disabled={
                        updatingId === order.id ||
                        order.status !== 'preparing'
                      }
                      onClick={() =>
                        updateStatus(
                          order.id,
                          'ready'
                        )
                      }
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition ${
                        order.status === 'ready'
                          ? 'bg-green-500 text-white'
                          : order.status === 'preparing'
                          ? 'bg-white text-green-600 border-2 border-green-500 hover:bg-green-50'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >

                      <Check className="w-5 h-5" />

                      Ready

                    </button>

                  </div>

                  {/* =================================================
                      CURRENT STATUS
                  ================================================= */}

                  <div className="mt-3 text-center text-xs text-gray-500">

                    Current status:{' '}

                    <span className="font-bold uppercase">
                      {order.status}
                    </span>

                    {/* Show stock message after acceptance */}

                    {order.stockDeducted && (
                      <span className="ml-2 text-green-600 font-semibold">
                        • Stock updated
                      </span>
                    )}

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}