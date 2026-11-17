import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const { isAuthenticated, user, role } = useAuth();

  // Who can load what (the server enforces the same rules).
  // Staff see the order queue only while on duty; off duty they shop
  // like a normal customer.
  const isStaff = role === 'CHEF' || role === 'DELIVERY';
  const canSeeAllOrders = role === 'ADMIN' || (isStaff && Boolean(user?.onDutyToday));
  const canShop = ['CUSTOMER', 'ADMIN', 'CHEF', 'DELIVERY'].includes(role);

  // All orders: used by admin / chef / delivery dashboards.
  const [orders, setOrders] = useState([]);
  // Only the signed-in customer's orders: used by customer screens.
  const [myOrders, setMyOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(() => {
    return localStorage.getItem('bhook_active_order_id') || null;
  });
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (canSeeAllOrders) {
      try {
        const res = await api.getOrders();
        if (res && res.data) {
          setOrders(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch orders from API:', err.message);
      }
    } else {
      setOrders([]);
    }

    if (isAuthenticated && canShop) {
      try {
        const mine = await api.getMyOrders();
        if (mine && mine.data) {
          setMyOrders(mine.data);
        }
      } catch (err) {
        console.warn('Could not fetch my orders:', err.message);
      }
    } else {
      setMyOrders([]);
    }
  }, [isAuthenticated, user?.id, canSeeAllOrders, canShop]);

  // Forget the tracked order when the customer signs out.
  useEffect(() => {
    if (!isAuthenticated) {
      setMyOrders([]);
      setActiveOrderId(null);
      localStorage.removeItem('bhook_active_order_id');
    }
  }, [isAuthenticated]);

  // Poll for real-time status updates every 3.5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3500);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (activeOrderId) {
      localStorage.setItem('bhook_active_order_id', activeOrderId);
    }
  }, [activeOrderId]);

  const placeOrder = async (orderPayload) => {
  if (!isAuthenticated) {
    throw new Error('Please sign in to place an order.');
  }

  setLoading(true);

  try {
    console.log("1️⃣ SENDING ORDER TO API:", orderPayload);

    const res = await api.createOrder(orderPayload);

    console.log("2️⃣ API RESPONSE:", res);

    if (res && res.data) {
      const newOrder = res.data;

      console.log("3️⃣ ORDER CREATED:", newOrder);

      setOrders(prev => [newOrder, ...prev]);
      setMyOrders(prev => [newOrder, ...prev]);
      setActiveOrderId(newOrder.id);

      return newOrder;
    }

    throw new Error('Failed to create order: No order data returned from server.');
  } catch (err) {
    console.error("❌ PLACE ORDER ERROR:", err);
    throw err;
  } finally {
    setLoading(false);
  }
};

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res && res.data) {
        setOrders(prev => prev.map(o => (o.id === orderId ? res.data : o)));
        return res.data;
      }
    } catch (err) {
      // The server refused (not allowed / not on duty / bad status):
      // don't pretend it worked.
      if (err.status) {
        throw err;
      }

      console.warn('Local status update fallback:', err.message);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
      );
    }
  };

  // The customer can only track their own orders.
  const activeOrder = myOrders.find(o => o.id === activeOrderId) || myOrders[0] || null;

  return (
    <OrderContext.Provider
      value={{
        orders,
        myOrders,
        activeOrder,
        activeOrderId,
        setActiveOrderId,
        placeOrder,
        updateOrderStatus,
        fetchOrders,
        loading
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => useContext(OrderContext);
