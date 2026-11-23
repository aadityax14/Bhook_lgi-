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

// Which chef makes an order:
//   1. the admin picked a chef for this order → only that chef
//   2. else the kitchen plan (chef per item) → those chefs; items with
//      no planned chef are open to every chef on duty
//   3. else every chef on duty
const isChefsOrder = (order, user) => {
  if (user?.role !== 'CHEF') return true;

  if (order?.assignedChefId) {
    return String(order.assignedChefId) === String(user.userId);
  }

  const planned = (order?.kitchenChefIds || []).map(String);
  if (planned.length === 0) return true;
  if ((order.items || []).some((item) => !item.chefId)) return true;

  return planned.includes(String(user.userId));
};

const isForOtherChef = (order, user) => !isChefsOrder(order, user);

const DELIVERY_STEPS = ['out_for_delivery', 'delivered'];

// Chefs the admin also lets deliver orders.
async function chefCanDeliver(user) {
  if (user?.role !== 'CHEF') return false;
  const result = await pool.query(
    'SELECT can_deliver FROM staff_accounts WHERE id = $1',
    [user.userId]
  );
  return Boolean(result.rows[0]?.can_deliver);
}

// Kitchen plan for a new food order: each item goes to the chef the
// admin planned for it, if that chef is on duty today.
async function planKitchen(items) {
  const plannedIds = [...new Set(
    items.map((item) => store.getProductById(item.productId)?.chefId).filter(Boolean).map(String)
  )];

  if (plannedIds.length === 0) {
    return { items, chefs: [] };
  }

  const result = await pool.query(
    `SELECT s.id::text AS id, s.login_id, s.full_name
       FROM staff_accounts s
       JOIN staff_shifts sh
         ON sh.staff_id = s.id
        AND sh.work_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
      WHERE s.role = 'CHEF' AND s.is_active = TRUE AND s.id::text = ANY($1::text[])`,
    [plannedIds]
  );

  const onDuty = new Map(result.rows.map((row) => [row.id, row]));

  const plannedItems = items.map((item) => {
    const chefId = String(store.getProductById(item.productId)?.chefId || '');
    const chef = onDuty.get(chefId);
    return chef
      ? { ...item, chefId: chef.id, chefName: chef.full_name, chefLoginId: chef.login_id }
      : { ...item, chefId: null };
  });

  const usedIds = new Set(plannedItems.map((item) => item.chefId).filter(Boolean));

  return {
    items: plannedItems,
    chefs: [...usedIds].map((id) => ({
      id,
      name: onDuty.get(id).full_name,
      loginId: onDuty.get(id).login_id
    }))
  };
}

// GET /api/orders (Admin / on-duty kitchen & delivery staff)
router.get('/', kitchenAccess, async (req, res) => {
  try {
    if (req.user.role !== 'CHEF') {
      const orders = store.getOrders();
      return res.json({ success: true, count: orders.length, data: orders });
    }

    // Chefs: their kitchen orders, plus food orders to deliver when
    // the admin also made them a delivery partner.
    const canDeliver = await chefCanDeliver(req.user);
    const me = String(req.user.userId);

    const orders = store
      .getOrders()
      .map((order) => ({
        ...order,
        kitchenForMe: isChefsOrder(order, req.user),
        assignedToMe:
          String(order.assignedChefId || '') === me ||
          (!order.assignedChefId && (order.kitchenChefIds || []).map(String).includes(me)),
        deliveryByMe: String(order.deliveryPartnerId || '') === me
      }))
      .filter((order) =>
        order.kitchenForMe ||
        (canDeliver &&
          order.orderType !== 'zuxu' &&
          ['ready', 'out_for_delivery', 'delivered'].includes(order.status))
      );

    res.json({
      success: true,
      count: orders.length,
      canDeliver,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

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

// PATCH /api/orders/:id/assign-chef  { chefId }  (admin)
// Give a food order to one chef (chefId: null = any chef on duty).
router.patch('/:id/assign-chef', requireRole('ADMIN'), async (req, res) => {
  try {
    const order = store.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.orderType === 'zuxu') {
      return res.status(400).json({ success: false, error: 'Zuxu orders are not made by the kitchen.' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(409).json({ success: false, error: 'This order is already finished.' });
    }

    const chefId = req.body?.chefId ? String(req.body.chefId) : null;

    if (!chefId) {
      const updated = store.updateOrderFields(order.id, {
        assignedChefId: null,
        assignedChefLoginId: null,
        assignedChefName: null,
        assignedChefAt: null
      });
      return res.json({ success: true, message: 'Order is open to every chef on duty.', data: updated });
    }

    const result = await pool.query(
      `SELECT id, login_id, full_name, is_active
         FROM staff_accounts
        WHERE id::text = $1 AND role = 'CHEF'`,
      [chefId]
    );
    const chef = result.rows[0];

    if (!chef) {
      return res.status(404).json({ success: false, error: 'Chef not found.' });
    }

    if (!chef.is_active) {
      return res.status(409).json({ success: false, error: 'This chef account is disabled.' });
    }

    const updated = store.updateOrderFields(order.id, {
      assignedChefId: String(chef.id),
      assignedChefLoginId: chef.login_id,
      assignedChefName: chef.full_name,
      assignedChefAt: new Date().toISOString()
    });

    res.json({ success: true, message: `Order sent to ${chef.full_name} (${chef.login_id}).`, data: updated });
  } catch (err) {
    console.error('ASSIGN CHEF ERROR:', err);
    res.status(500).json({ success: false, error: 'Could not assign the chef.' });
  }
});

// GET /api/orders/user/:phone (admin only)
router.get('/user/:phone', requireRole('ADMIN'), (req, res) => {
  try {
    const orders = store
      .getOrders()
      .filter(o => o.customerPhone === req.params.phone);

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
// The customer who placed it, the admin, or kitchen/delivery staff.
router.get('/:id', requireRole('CUSTOMER', 'ADMIN', 'CHEF', 'DELIVERY'), (req, res) => {
  try {
    const order = store.getOrderById(req.params.id);

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
// Place new order (signed-in customers only)
router.post('/', shopper, async (req, res) => {
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

    const stockCheck = store.checkOrderStock(priced.items);

    if (!stockCheck.ok) {
      return res.status(409).json({
        success: false,
        error: stockCheck.error
      });
    }

    // ============================================
    // CREATE ORDER
    // ============================================

    // Kitchen plan: send each item to the chef the admin chose for it.
    const kitchen = orderType === 'food'
      ? await planKitchen(priced.items)
      : { items: priced.items, chefs: [] };

    let createdOrder = store.createOrder({
      userId: req.user.userId,
      orderType,
      customerName,
      customerPhone,
      hostel,
      roomNumber,
      deliveryType,
      deliveryNotes,

      // Server-calculated prices only
      items: kitchen.items,
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      packagingFee: priced.packagingFee,
      total: priced.total
    });

    if (kitchen.chefs.length > 0) {
      createdOrder = store.updateOrderFields(createdOrder.id, {
        kitchenChefIds: kitchen.chefs.map((chef) => chef.id),
        kitchenChefs: kitchen.chefs
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! 🚀',
      data: createdOrder
    });

  } catch (err) {
    console.error('CREATE ORDER ERROR:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// PATCH /api/orders/:id/status
// Admin, or on-duty chef/delivery staff (only their own steps)
router.patch('/:id/status', kitchenAccess, async (req, res) => {
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

    // Chef who also delivers: may move any food order on its way.
    const deliveringChef =
      DELIVERY_STEPS.includes(status) && (await chefCanDeliver(req.user));

    // The admin gave this order to a different chef.
    if (!deliveringChef && isForOtherChef(existing, req.user)) {
      return res.status(403).json({
        success: false,
        error: `This order was given to ${existing.assignedChefLoginId || 'another chef'}.`
      });
    }

    if (
      STAFF_ROLES.includes(req.user.role) &&
      !deliveringChef &&
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

    const isDeliveryPartner = req.user.role === 'DELIVERY' || deliveringChef;

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

    let updated = store.updateOrderStatus(
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