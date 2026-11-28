import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bike,
  Check,
  ChefHat,
  Clock,
  RefreshCw,
  Utensils
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OrderItemDetails from '../orders/OrderItemDetails';
import OrderStatusTabs, {
  ACTIVE_STATUSES,
  ORDER_BUCKETS,
  countOrders,
  filterOrders,
  sortForFilter
} from '../orders/OrderStatusTabs';

const isToday = (value) =>
  Boolean(value) && new Date(value).toDateString() === new Date().toDateString();

const timeOf = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

// "3 min ago" — helps the chef cook the oldest order first.
const minutesAgo = (value) => {
  if (!value) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} h ${mins % 60} min ago`;
};

const STATUS_BADGE = {
  placed: 'bg-red-600 text-white',
  accepted: 'bg-blue-500 text-white',
  preparing: 'bg-yellow-400 text-black',
  ready: 'bg-green-500 text-white',
  out_for_delivery: 'bg-blue-600 text-white',
  delivered: 'bg-gray-800 text-white',
  cancelled: 'bg-gray-200 text-gray-600'
};

const STATUS_TEXT = {
  placed: 'New order',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function ChefDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  // The admin can let a chef deliver orders too (Kitchen Plan).
  const [canDeliver, setCanDeliver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('to_accept');
  // Jump to "To accept" by itself the first time orders load.
  const pickedFilter = useRef(false);

  // =========================================================
  // FETCH ORDERS
  // =========================================================

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.getOrders();

      if (res && Array.isArray(res.data)) {
        // Zuxu (handmade) orders are handled by the admin, not the kitchen.
        setOrders(res.data.filter(order => order && order.orderType !== 'zuxu'));
        setCanDeliver(Boolean(res.canDeliver));
        setLoadError('');
      }
    } catch (err) {
      console.error('Failed to fetch chef orders:', err);
      setLoadError(err?.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // =========================================================
  // UPDATE ORDER STATUS
  // =========================================================

  const replaceOrder = (updated) => {
    if (!updated) return;
    setOrders(prev => prev.map(order => (order.id === updated.id ? { ...order, ...updated } : order)));
  };

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      const currentOrder = orders.find(order => order.id === orderId);
      if (!currentOrder) throw new Error('Order not found.');

      // "Accept & start" from a new order: stock is deducted when the
      // order becomes "accepted", then it moves to "preparing".
      if (status === 'preparing' && currentOrder.status === 'placed') {
        const acceptedRes = await api.updateOrderStatus(orderId, 'accepted');
        if (!acceptedRes?.data) throw new Error('Order could not be accepted.');
        replaceOrder(acceptedRes.data);

        const preparingRes = await api.updateOrderStatus(orderId, 'preparing');
        if (!preparingRes?.data) {
          throw new Error('Order was accepted but could not be moved to preparing.');
        }
        replaceOrder(preparingRes.data);
        return;
      }

      const res = await api.updateOrderStatus(orderId, status);
      if (!res?.data) throw new Error('Server did not return the updated order.');
      replaceOrder(res.data);
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert(err.message || 'Could not update order status. Please try again.');
      await fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================================
  // WHICH ORDERS THIS CHEF SEES
  // =========================================================

  // Orders this chef cooks (the server also sends ready orders to
  // deliver when the chef is allowed to deliver).
  const kitchenOrders = orders.filter(order => order.kitchenForMe !== false);

  // Everything still moving + whatever finished today.
  const myBoard = kitchenOrders.filter(order =>
    ACTIVE_STATUSES.includes(order.status) ||
    isToday(order.deliveredAt || order.updatedAt || order.createdAt)
  );

  // First load: open the step that needs attention.
  useEffect(() => {
    if (pickedFilter.current || loading) return;
    pickedFilter.current = true;
    if (countOrders(myBoard, 'to_accept') > 0) setFilter('to_accept');
    else if (countOrders(myBoard, 'preparing') > 0) setFilter('preparing');
    else setFilter('active');
  }, [loading, myBoard]);

  const shownOrders = sortForFilter(filterOrders(myBoard, filter), filter);

  // =========================================================
  // DELIVERY (only when the admin turned on "Also delivers")
  // =========================================================

  const deliveryOrders = canDeliver
    ? orders.filter(order =>
        order.status === 'ready' ||
        (order.status === 'out_for_delivery' &&
          (order.deliveryByMe || !order.deliveryPartnerId))
      )
    : [];

  const myDeliveriesToday = orders.filter(order =>
    order.status === 'delivered' &&
    order.deliveryByMe &&
    isToday(order.deliveredAt)
  ).length;

  // =========================================================
  // ITEM: is it mine? (kitchen plan splits an order between chefs)
  // =========================================================

  const itemOwner = (order, item) => {
    if (order.assignedChefId) return 'whole-order';
    if (!item.chefId) return 'anyone';
    return String(item.chefId) === String(user?.id) ? 'me' : 'other';
  };

  // =========================================================
  // ORDER CARD
  // =========================================================

  const renderActions = (order) => {
    const busy = updatingId === order.id;
    const spinner = (
      <>
        <RefreshCw className="w-5 h-5 animate-spin" /> Updating...
      </>
    );

    if (order.status === 'placed' || order.status === 'accepted') {
      return (
        <button
          disabled={busy}
          onClick={() => updateStatus(order.id, 'preparing')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-black bg-black text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {busy ? spinner : (
            <>
              <Check className="w-5 h-5" />
              {order.status === 'placed' ? 'Accept & start preparing' : 'Start preparing'}
            </>
          )}
        </button>
      );
    }

    if (order.status === 'preparing') {
      return (
        <button
          disabled={busy}
          onClick={() => updateStatus(order.id, 'ready')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-black bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {busy ? spinner : (
            <>
              <Check className="w-5 h-5" /> Food is ready
            </>
          )}
        </button>
      );
    }

    if (order.status === 'ready') {
      return (
        <p className="text-center text-sm font-bold text-green-700 bg-green-50 rounded-xl py-3">
          ✓ Ready — waiting for the delivery partner
        </p>
      );
    }

    return (
      <p className="text-center text-sm font-bold text-gray-500 bg-gray-50 rounded-xl py-3">
        {STATUS_TEXT[order.status] || order.status}
      </p>
    );
  };

  const renderOrderCard = (order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const myItems = items.filter(item => ['me', 'anyone', 'whole-order'].includes(itemOwner(order, item)));
    const splitOrder = !order.assignedChefId && items.some(item => itemOwner(order, item) === 'other');

    return (
      <div
        key={order.id}
        className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${
          order.status === 'placed' ? 'border-red-300' : 'border-gray-100'
        }`}
      >
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-black text-lg text-gray-900">
                  {order.orderNumber || `#${order.id}`}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_TEXT[order.status] || order.status}
                </span>
                {order.assignedToMe && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-black text-yellow-300">
                    👨‍🍳 Assigned to you
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <Clock className="w-4 h-4" />
                {timeOf(order.createdAt)}
                <span className="text-xs font-bold text-gray-400">· {minutesAgo(order.createdAt)}</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="font-black text-gray-900">₹{order.total}</p>
              <p className="text-sm text-gray-500">
                {order.customerName} · {order.hostel} • Room {order.roomNumber}
              </p>
            </div>
          </div>

          {splitOrder && (
            <p className="mt-3 text-xs font-bold text-yellow-900 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
              Shared order: make only the items marked “Your item”
              ({myItems.length} of {items.length}). Another chef makes the rest.
            </p>
          )}
        </div>

        {/* ITEMS */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {items.map((item, index) => {
            const owner = itemOwner(order, item);
            const notMine = owner === 'other';

            return (
              <div
                key={`${order.id}-${index}`}
                className={`rounded-xl p-3 border ${
                  notMine ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-yellow-50/40 border-yellow-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-gray-900 text-base">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 mr-2 rounded-lg bg-black text-white text-sm">
                      {item.quantity}×
                    </span>
                    {item.productName || item.name || 'Item'}
                  </p>

                  {owner === 'me' && (
                    <span className="shrink-0 text-[11px] font-black text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                      👨‍🍳 Your item
                    </span>
                  )}
                  {owner === 'other' && (
                    <span className="shrink-0 text-[11px] font-bold text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                      {item.chefName || 'Another chef'}
                    </span>
                  )}
                </div>

                <OrderItemDetails item={item} />
              </div>
            );
          })}

          {order.deliveryNotes && (
            <p className="text-sm font-bold text-orange-800 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
              📝 Customer note: {order.deliveryNotes}
            </p>
          )}
        </div>

        {/* ACTION */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50">
          {renderActions(order)}
          {order.stockDeducted && (
            <p className="mt-2 text-center text-[11px] font-semibold text-green-600">Stock updated</p>
          )}
        </div>
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  const emptyText = {
    to_accept: 'No new orders right now. New orders appear here automatically.',
    preparing: 'Nothing is being prepared.',
    ready: 'No orders waiting for pickup.',
    on_the_way: 'No orders on the way.',
    completed: 'No orders delivered today yet.',
    active: 'No active orders. New orders appear here automatically.'
  };

  return (
    <div className="min-h-screen bg-[#fffdf5] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chef Dashboard</h1>
              <p className="text-sm text-gray-500">Tap a box to see those orders</p>
            </div>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {loadError && (
          <p className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-bold text-red-700">
            {loadError}
          </p>
        )}

        {/* PIPELINE */}
        <div className="mb-5">
          <OrderStatusTabs
            orders={myBoard}
            value={filter}
            onChange={setFilter}
            buckets={['to_accept', 'preparing', 'ready', 'on_the_way', 'completed']}
            showAll={false}
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-gray-900">
            {ORDER_BUCKETS[filter]?.label || 'All active'}
            <span className="ml-2 text-sm font-bold text-gray-400">{shownOrders.length}</span>
          </h2>
          {filter !== 'active' && (
            <button
              type="button"
              onClick={() => setFilter('active')}
              className="text-xs font-black text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1.5"
            >
              Show all active
            </button>
          )}
        </div>

        {/* ORDERS */}
        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <RefreshCw className="w-7 h-7 mx-auto mb-3 animate-spin text-yellow-500" />
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : shownOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Utensils className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">{emptyText[filter] || 'No orders here.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {shownOrders.map(renderOrderCard)}
          </div>
        )}

        {/* DELIVERIES (chef who also delivers) */}
        {canDeliver && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Bike className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Deliveries</h2>
                  <p className="text-sm text-gray-500">
                    The admin also made you a delivery partner today
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{myDeliveriesToday}</p>
                <p className="text-xs text-gray-500">delivered today</p>
              </div>
            </div>

            {deliveryOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-sm text-gray-500">
                No orders waiting for delivery. Ready orders appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryOrders.map(order => (
                  <div
                    key={`delivery-${order.id}`}
                    className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-900">{order.orderNumber}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              order.status === 'ready' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                            }`}
                          >
                            {order.status === 'ready' ? 'Ready for pickup' : 'On the way'}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-gray-800 mt-2">
                          {order.customerName} · {order.hostel} • Room {order.roomNumber}
                        </p>

                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-black text-green-700"
                          >
                            📞 {order.customerPhone}
                          </a>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          {(order.items || [])
                            .map(item => `${item.quantity} × ${item.productName}`)
                            .join(', ')}
                        </p>

                        {order.deliveryNotes && (
                          <p className="text-xs text-gray-600 mt-1">
                            <strong>Note:</strong> {order.deliveryNotes}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="font-bold text-gray-900">₹{order.total}</p>
                        <p className="text-xs text-gray-500">
                          Delivery charge ₹{Number(order.deliveryFee || 0)}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={updatingId === order.id}
                      onClick={() =>
                        updateStatus(order.id, order.status === 'ready' ? 'out_for_delivery' : 'delivered')
                      }
                      className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white disabled:opacity-50 ${
                        order.status === 'ready' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {updatingId === order.id ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Updating...
                        </>
                      ) : order.status === 'ready' ? (
                        <>
                          <Bike className="w-5 h-5" />
                          Pick up · Out for delivery
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Mark Delivered
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
