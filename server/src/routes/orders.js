import express from 'express';
import { store } from '../db/store.js';

const router = express.Router();

// GET /api/orders (Admin / all)
router.get('/', (req, res) => {
  try {
    const orders = store.getOrders();

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

// GET /api/orders/user/:phone
router.get('/user/:phone', (req, res) => {
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
router.get('/:id', (req, res) => {
  try {
    const order = store.getOrderById(req.params.id);

    if (!order) {
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
// Place new order
router.post('/', (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      hostel,
      roomNumber,
      deliveryType,
      deliveryNotes,
      items,
      subtotal,
      deliveryFee,
      packagingFee,
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
    // REAL SERVER-SIDE STOCK CHECK
    // ============================================

    const stockCheck = store.checkOrderStock(items);

    if (!stockCheck.ok) {
      return res.status(409).json({
        success: false,
        error: stockCheck.error
      });
    }

    // ============================================
    // CREATE ORDER
    // ============================================

    const createdOrder = store.createOrder({
      customerName,
      customerPhone,
      hostel,
      roomNumber,
      deliveryType,
      deliveryNotes,
      items,
      subtotal,
      deliveryFee,
      packagingFee,
      total
    });

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
// Admin changes order status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      'placed',
      'accepted',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];

    // ============================================
    // STATUS VALIDATION
    // ============================================

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    // ============================================
    // UPDATE ORDER
    // ============================================

    const updated = store.updateOrderStatus(
      req.params.id,
      status
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
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