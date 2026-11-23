const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Uploaded photos are saved by the server as "/api/uploads/<file>".
// Turn that into a full URL on the API's host.
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE, window.location.href).origin;
  } catch {
    return '';
  }
})();

export function resolveMediaUrl(url) {
  if (typeof url !== 'string' || !url) return '';
  if (url.startsWith('/api/uploads/')) return `${API_ORIGIN}${url}`;
  return url;
}

// Product photos uploaded by the admin are stored on the server as
// "/api/uploads/<file>": turn them into full links for <img>.
function withProductImages(product) {
  if (!product || typeof product !== 'object') return product;
  return {
    ...product,
    imageUrl: resolveMediaUrl(product.imageUrl) || product.imageUrl,
    images: Array.isArray(product.images)
      ? product.images.map((image) => resolveMediaUrl(image) || image)
      : product.images,
  };
}

function withProductImagesResponse(res) {
  if (!res || res.data === undefined) return res;
  return {
    ...res,
    data: Array.isArray(res.data) ? res.data.map(withProductImages) : withProductImages(res.data),
  };
}

async function fetchJSON(endpoint, options = {}) {
  try {
    // Attach the signed-in customer's token (if any) so the server
    // can return only their orders / notifications.
    let savedToken = null;
    try {
      savedToken = localStorage.getItem('bhook_token');
    } catch {
      savedToken = null;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Network response was not ok' }));
      const error = new Error(body.error || `HTTP error! status: ${res.status}`);
      // Keep extra details (e.g. code: 'PRICE_CHANGED' + latest prices)
      error.status = res.status;
      error.code = body.code;
      error.data = body.data;

      // The admin blocked / removed this account: sign out everywhere.
      if (body.code === 'ACCOUNT_BLOCKED' && savedToken) {
        try {
          window.dispatchEvent(new CustomEvent('bhook:account-blocked', { detail: body.error }));
        } catch {
          // ignore
        }
      }

      throw error;
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
    return fetchJSON(`/products?${params.toString()}`).then(withProductImagesResponse);
  },
  
  getProductById: (id) => fetchJSON(`/products/${id}`).then(withProductImagesResponse),

  createProduct: (productData) => 
    fetchJSON('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }).then(withProductImagesResponse),

  updateProduct: (id, updates) =>
    fetchJSON(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }).then(withProductImagesResponse),

  // Admin: kitchen plan — which chef makes which item
  // { productId: chefId | null }
  saveKitchenPlan: (assignments) =>
    fetchJSON('/products/kitchen-plan', {
      method: 'PUT',
      body: JSON.stringify({ assignments }),
    }).then(withProductImagesResponse),

  // Admin: let a chef also deliver orders
  setChefCanDeliver: (id, canDeliver) =>
    fetchJSON(`/staff/accounts/${id}/can-deliver`, {
      method: 'PATCH',
      body: JSON.stringify({ canDeliver }),
    }),

  // Admin: order products are shown to customers (first id = first)
  saveMenuOrder: (ids) =>
    fetchJSON('/products/display-order', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    }).then(withProductImagesResponse),

  deleteProduct: (id) =>
    fetchJSON(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Orders
  getOrders: () => fetchJSON('/orders'),

  // Only the signed-in customer's own orders
  getMyOrders: () => fetchJSON('/orders/my'),

  // Admin: delete one order / clear history ('finished' or 'all')
  deleteOrder: (id) => fetchJSON(`/orders/${id}`, { method: 'DELETE' }),
  clearOrderHistory: (scope) =>
    fetchJSON('/orders/clear-history', {
      method: 'POST',
      body: JSON.stringify({ scope }),
    }),

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

  // Admin: give a food order to one chef (null = any chef on duty)
  assignOrderChef: (id, chefId) =>
    fetchJSON(`/orders/${id}/assign-chef`, {
      method: 'PATCH',
      body: JSON.stringify({ chefId }),
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

    // Authentication
  login: (credentials) =>
    fetchJSON('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  createAccount: (accountData) =>
    fetchJSON('/auth/register', {
      method: 'POST',
      body: JSON.stringify(accountData),
    }),

  // Uses the saved token automatically.
  getCurrentUser: () => fetchJSON('/auth/me'),

  logout: () => fetchJSON('/auth/logout', { method: 'POST' }),

  // Admin: customer accounts (signed in / online, block, terminate)
  getUsers: () => fetchJSON('/users'),
  setUserBlocked: (id, blocked, reason) =>
    fetchJSON(`/users/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ blocked, reason }),
    }),
  terminateUser: (id, reason) =>
    fetchJSON(`/users/${id}/terminate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Customer profile: { name, phone, email, hostel, roomNumber,
  // deliveryNote, currentPassword (needed for phone/email changes) }
  updateProfile: (fields) =>
    fetchJSON('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }),

  changePassword: (currentPassword, newPassword) =>
    fetchJSON('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Health
  checkHealth: () => fetchJSON('/health'),

  // Zuxu custom orders (photo + description → admin quote)
  createCustomRequest: (description, images) =>
    fetchJSON('/zuxu/custom-requests', {
      method: 'POST',
      body: JSON.stringify({ description, images }),
    }),
  getMyCustomRequests: () => fetchJSON('/zuxu/custom-requests/mine'),
  confirmCustomRequest: (id) =>
    fetchJSON(`/zuxu/custom-requests/${id}/confirm`, { method: 'POST' }),
  declineCustomRequest: (id) =>
    fetchJSON(`/zuxu/custom-requests/${id}/decline`, { method: 'POST' }),

  // Admin
  getAllCustomRequests: () => fetchJSON('/zuxu/custom-requests'),
  quoteCustomRequest: (id, price, estimatedDeliveryDate, note) =>
    fetchJSON(`/zuxu/custom-requests/${id}/quote`, {
      method: 'PATCH',
      body: JSON.stringify({ price, estimatedDeliveryDate, note }),
    }),
  rejectCustomRequest: (id, note) =>
    fetchJSON(`/zuxu/custom-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    }),

  // Zuxu reviews
  getReviewSummary: () => fetchJSON('/zuxu/reviews/summary'),
  getProductReviews: (productId) =>
    fetchJSON(`/zuxu/products/${encodeURIComponent(productId)}/reviews`),
  getMyReviews: () => fetchJSON('/zuxu/reviews/mine'),
  createReview: (review) =>
    fetchJSON('/zuxu/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    }),
  deleteReview: (id) =>
    fetchJSON(`/zuxu/reviews/${id}`, { method: 'DELETE' }),

  // Delivery & packing charges
  getSettings: () => fetchJSON('/settings'),
  saveSettings: (settings) =>
    fetchJSON('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Delivery partner earnings / staff hostel
  getMyEarnings: () => fetchJSON('/staff/me/earnings'),
  setStaffHostel: (id, hostel) =>
    fetchJSON(`/staff/accounts/${id}/hostel`, {
      method: 'PATCH',
      body: JSON.stringify({ hostel }),
    }),

  // Homepage banners
  getBanners: () => fetchJSON('/banners'),
  saveBanners: (slides) =>
    fetchJSON('/banners', {
      method: 'PUT',
      body: JSON.stringify({ slides }),
    }),
  resetBanners: () => fetchJSON('/banners', { method: 'DELETE' }),
  uploadBannerImage: (image) =>
    fetchJSON('/banners/upload', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),

  // Staff applications (public)
  submitStaffApplication: (application) =>
    fetchJSON('/staff/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    }),

  getStaffApplicationStatus: (mobile, studentId) => {
    const params = new URLSearchParams({ mobile, studentId });
    return fetchJSON(`/staff/applications/status?${params.toString()}`);
  },

  // Staff: am I on duty today?
  getMyDuty: () => fetchJSON('/staff/me/duty'),

  // Staff management (admin only — checked on the server)
  getStaffApplications: () => fetchJSON('/staff/applications'),

  decideStaffApplication: (id, decision) =>
    fetchJSON(`/staff/applications/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ decision }),
    }),

  getStaffAccounts: () => fetchJSON('/staff/accounts'),

  resetStaffPassword: (id) =>
    fetchJSON(`/staff/accounts/${id}/reset-password`, {
      method: 'POST',
    }),

  setStaffActive: (id, isActive) =>
    fetchJSON(`/staff/accounts/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  setTodayDuty: (staffIds) =>
    fetchJSON('/staff/duty/today', {
      method: 'PUT',
      body: JSON.stringify({ staffIds }),
    }),
};


