import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(() => {
    return localStorage.getItem('bhook_active_order_id') || 'bl-ord-1001';
  });
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.getOrders();
      if (res && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch orders from API:', err.message);
    }
  }, []);

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
    setLoading(true);
    try {
      const res = await api.createOrder(orderPayload);
      if (res && res.data) {
        const newOrder = res.data;
        setOrders(prev => [newOrder, ...prev]);
        setActiveOrderId(newOrder.id);
        return newOrder;
      }
      throw new Error('Failed to create order: No order data returned from server.');
    } catch (err) {
      console.error('Order placement failed:', err.message);
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
      console.warn('Local status update fallback:', err.message);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
      );
    }
  };

  const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0] || null;

  return (
    <OrderContext.Provider
      value={{
        orders,
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
