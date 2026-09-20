const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchJSON(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network response was not ok' }));
      throw new Error(err.error || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Products
  getProducts: (category, search) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    return fetchJSON(`/products?${params.toString()}`);
  },
  
  getProductById: (id) => fetchJSON(`/products/${id}`),

  createProduct: (productData) => 
    fetchJSON('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (id, updates) =>
    fetchJSON(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteProduct: (id) =>
    fetchJSON(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Orders
  getOrders: () => fetchJSON('/orders'),
  
  getOrderById: (id) => fetchJSON(`/orders/${id}`),

  getUserOrders: (phone) => fetchJSON(`/orders/user/${phone}`),

  createOrder: (orderPayload) =>
    fetchJSON('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    }),

  updateOrderStatus: (id, status) =>
    fetchJSON(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Notifications
  getNotifications: () => fetchJSON('/notifications'),

  markNotificationAsRead: (id) =>
    fetchJSON(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsAsRead: () =>
    fetchJSON('/notifications/read-all', {
      method: 'POST',
    }),

  // Health
  checkHealth: () => fetchJSON('/health'),
};
