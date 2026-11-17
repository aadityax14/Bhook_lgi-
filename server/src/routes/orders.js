import express from 'express';
import { store } from '../db/store.js';
import {
  requireRole,
  requireOnDuty,
  STAFF_ROLES
} from '../middleware/auth.js';
import { priceOrder } from '../services/orderPricing.js';
import { getKitchenHostels } from '../services/fees.js';
import { pool } from '../db/postgres.js';

const router = express.Router();

<<<<<<< HEAD
// Customers and the admin place and track orders. Chefs / delivery
// partners can too (the app lets them shop when they're off duty).
const shopper = requireRole('CUSTOMER', 'ADMIN', 'CHEF', 'DELIVERY');

// Admin + on-duty chef/delivery staff see and move the order queue.
const kitchenAccess = [requireRole('ADMIN', 'CHEF', 'DELIVERY'), requireOnDuty];

// Which statuses each role may set.
const STATUS_PERMISSIONS = {
  CHEF: ['accepted', 'preparing', 'ready'],
  DELIVERY: ['out_for_delivery', 'delivered']
};

// Tracking steps differ between the food kitchen and Zuxu.
export const ORDER_STATUSES = {
  food: ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
  zuxu: ['placed', 'accepted', 'ready_to_dispatch', 'out_for_delivery', 'delivered', 'cancelled']
};

const isZuxuProduct = (product) =>
  product?.storeId === 'store-zuxu' ||
  String(product?.categoryId || '').toLowerCase() === 'zuxu';

// GET /api/orders/my
// Orders placed by the signed-in customer only
router.get('/my', shopper, (req, res) => {
  try {
    const orders = store
      .getOrders()
      .filter(o => o.userId && String(o.userId) === req.user.userId);

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/orders (Admin / on-duty kitchen & delivery staff)
router.get('/', kitchenAccess, (req, res) => {
=======
// GET /api/orders (Admin / all)
router.get('/', async (req, res) => {
>>>>>>> main
  try {
    const orders = await store.getOrders();

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

<<<<<<< HEAD
// POST /api/orders/clear-history  { scope: 'finished' | 'all' }  (admin)
// finished = delivered + cancelled orders; all = every order.
// A backup of the data file is saved first; delivery partners keep
// their earnings from deleted orders.
router.post('/clear-history', requireRole('ADMIN'), (req, res) => {
  try {
    const scope = req.body?.scope === 'all' ? 'all' : 'finished';
    const ids = store
      .getOrders()
      .filter(o => scope === 'all' || o.status === 'delivered' || o.status === 'cancelled')
      .map(o => o.id);

    const deleted = store.deleteOrders(ids);

    res.json({
      success: true,
      message: `Deleted ${deleted.length} order${deleted.length === 1 ? '' : 's'}.`,
      data: { deleted: deleted.length, scope }
    });
  } catch (err) {
    console.error('CLEAR ORDER HISTORY ERROR:', err);
    res.status(500).json({ success: false, error: 'Could not delete orders.' });
  }
});

// DELETE /api/orders/:id  (admin)
router.delete('/:id', requireRole('ADMIN'), (req, res) => {
  try {
    const deleted = store.deleteOrders([req.params.id]);

    if (deleted.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) {
    console.error('DELETE ORDER ERROR:', err);
    res.status(500).json({ success: false, error: 'Could not delete the order.' });
  }
});

// GET /api/orders/user/:phone (admin only)
router.get('/user/:phone', requireRole('ADMIN'), (req, res) => {
=======
// GET /api/orders/user/:phone
router.get('/user/:phone', async (req, res) => {
>>>>>>> main
  try {
    const orders = await store.getOrders({
      customerPhone: req.params.phone
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/orders/:id
<<<<<<< HEAD
// The customer who placed it, the admin, or kitchen/delivery staff.
router.get('/:id', requireRole('CUSTOMER', 'ADMIN', 'CHEF', 'DELIVERY'), (req, res) => {
=======
router.get('/:id', async (req, res) => {
>>>>>>> main
  try {
    const order = await store.getOrderById(req.params.id);

    const canSee =
      order &&
      (req.user.role !== 'CUSTOMER' ||
        String(order.userId) === req.user.userId);

    if (!canSee) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/orders
<<<<<<< HEAD
// Place new order (signed-in customers only)
router.post('/', shopper, async (req, res) => {
=======
// Place new order
router.post('/', async (req, res) => {
>>>>>>> main
  try {
    const {
      customerName,
      customerPhone,
      hostel,
      roomNumber,
      deliveryType,
      deliveryNotes,
      items,
      // Only used to detect a price change; never stored.
      total
    } = req.body;

    // ============================================
    // BASIC VALIDATION
    // ============================================

    if (
      !customerName ||
      !hostel ||
      !roomNumber ||
      !items ||
      !items.length
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required order fields: name, hostel, roomNumber, and at least one item.'
      });
    }

    // ============================================
    // SERVER-SIDE PRICING
    // Admin-saved prices are final; browser prices
    // are only used to detect that they changed.
    // ============================================

    // Delivery is cheaper when a chef on duty today is in the customer's hostel.
    const kitchenHostels = await getKitchenHostels();

    const priced = priceOrder(store, { items, deliveryType, hostel, kitchenHostels });

    if (!priced.ok) {
      return res.status(409).json({
        success: false,
        ...(priced.code ? { code: priced.code } : {}),
        error: priced.error
      });
    }

    // If the kitchen changed a price after the customer added the item,
    // don't charge a different amount than they saw. Send back the
    // current prices so the cart can refresh and they can confirm again.
    if (
      total !== undefined &&
      Math.abs(Number(total) - priced.total) > 0.009
    ) {
      return res.status(409).json({
        success: false,
        code: 'PRICE_CHANGED',
        error:
          `Some prices were updated by the kitchen. Your new total is ₹${priced.total}. ` +
          'Please review your cart and place the order again.',
        data: {
          items: priced.items,
          subtotal: priced.subtotal,
          deliveryFee: priced.deliveryFee,
          packagingFee: priced.packagingFee,
          total: priced.total
        }
      });
    }

    // ============================================
    // ORDER TYPE: Bhook_Lgi food vs Zuxu handmade
    // (they are prepared and tracked differently)
    // ============================================

    const zuxuCount = priced.items.filter(item =>
      isZuxuProduct(store.getProductById(item.productId))
    ).length;

    if (zuxuCount > 0 && zuxuCount < priced.items.length) {
      return res.status(400).json({
        success: false,
        code: 'MIXED_CART',
        error: 'Zuxu gifts and Bhook_Lgi food are delivered separately. Please order them one at a time.'
      });
    }

    const orderType = zuxuCount > 0 ? 'zuxu' : 'food';

    // The admin can close the Bhook_Lgi kitchen. Zuxu stays open.
    if (orderType === 'food' && store.getSettings().kitchenOpen === false) {
      return res.status(409).json({
        success: false,
        code: 'KITCHEN_CLOSED',
        error: 'The kitchen is closed right now. You can order when it opens again.'
      });
    }

    // ============================================
    // REAL SERVER-SIDE STOCK CHECK
    // ============================================

<<<<<<< HEAD
    const stockCheck = store.checkOrderStock(priced.items);
=======
    const stockCheck = await store.checkOrderStock(items);
>>>>>>> main

    if (!stockCheck.ok) {
      return res.status(409).json({
        success: false,
        error: stockCheck.error
      });
    }

    // ============================================
    // CREATE ORDER
    // ============================================

<<<<<<< HEAD
    const createdOrder = store.createOrder({
      userId: req.user.userId,
      orderType,
=======
    const createdOrder = await store.createOrder({
>>>>>>> main
      customerName,
      customerPhone,
      hostel,
      roomNumber,
      deliveryType,
      deliveryNotes,

      // Server-calculated prices only
      items: priced.items,
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      packagingFee: priced.packagingFee,
      total: priced.total
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! 🚀',
      data: createdOrder
    });

  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);

    // Stock ran out between the check above and the insert
    res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }
});

// PATCH /api/orders/:id/status
<<<<<<< HEAD
// Admin, or on-duty chef/delivery staff (only their own steps)
router.patch('/:id/status', kitchenAccess, async (req, res) => {
=======
// Admin changes order status
router.patch('/:id/status', async (req, res) => {
>>>>>>> main
  try {
    const { status } = req.body;

    const existing = store.getOrderById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const orderType = existing.orderType === 'zuxu' ? 'zuxu' : 'food';
    const allowedStatuses = ORDER_STATUSES[orderType];

    // ============================================
    // STATUS VALIDATION
    // ============================================

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status for a ${orderType === 'zuxu' ? 'Zuxu' : 'food'} order. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    // Zuxu orders are handled by the admin (and delivery partners),
    // not the food kitchen.
    if (orderType === 'zuxu' && req.user.role === 'CHEF') {
      return res.status(403).json({
        success: false,
        error: 'Zuxu orders are handled by the admin.'
      });
    }

    if (
      STAFF_ROLES.includes(req.user.role) &&
      !STATUS_PERMISSIONS[req.user.role].includes(status)
    ) {
      return res.status(403).json({
        success: false,
        error: `${req.user.role === 'CHEF' ? 'Chefs' : 'Delivery partners'} can't set an order to "${status}".`
      });
    }

    // ============================================
    // DELIVERY PARTNER (for earnings)
    // The partner who picks the order up owns it; only they can
    // mark it delivered, and its delivery charge counts as their earning.
    // ============================================

    const isDeliveryPartner = req.user.role === 'DELIVERY';

    if (
      isDeliveryPartner &&
      status === 'delivered' &&
      existing.deliveryPartnerId &&
      existing.deliveryPartnerId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: `This order was picked up by ${existing.deliveryPartnerLoginId || 'another delivery partner'}.`
      });
    }

    let partner = null;

    if (isDeliveryPartner) {
      const result = await pool.query(
        'SELECT login_id, full_name FROM staff_accounts WHERE id = $1',
        [req.user.userId]
      );
      partner = result.rows[0] || null;
    }

    // ============================================
    // UPDATE ORDER
    // ============================================

<<<<<<< HEAD
    let updated = store.updateOrderStatus(
=======
    const updated = await store.updateOrderStatus(
>>>>>>> main
      req.params.id,
      status
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const now = new Date().toISOString();

    if (isDeliveryPartner && (status === 'out_for_delivery' || status === 'delivered') && !updated.deliveryPartnerId) {
      updated = store.updateOrderFields(updated.id, {
        deliveryPartnerId: req.user.userId,
        deliveryPartnerLoginId: partner?.login_id || null,
        deliveryPartnerName: partner?.full_name || null,
        pickedUpAt: now
      });
    }

    if (status === 'delivered') {
      // Credit the partner who carried it (admin marking it delivered
      // still credits the partner who picked it up).
      updated = store.updateOrderFields(updated.id, {
        deliveredAt: now,
        deliveredBy: updated.deliveryPartnerId || null
      });
    } else if (updated.deliveredAt) {
      // Delivery undone by the admin: no earning until delivered again.
      updated = store.updateOrderFields(updated.id, { deliveredAt: null, deliveredBy: null });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated
    });

  } catch (err) {
    console.error('UPDATE ORDER STATUS ERROR:', err);

    // Stock-related error
    if (
      err.status === 409 ||
      err.message &&
      (
        err.message.toLowerCase().includes('stock') ||
        err.message.toLowerCase().includes('available')
      )
    ) {
      return res.status(409).json({
        success: false,
        error: err.message
      });
    }

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;