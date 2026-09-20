import express from 'express';
import { store } from '../db/store.js';

const router = express.Router();

// GET /api/orders (Admin / all)
router.get('/', (req, res) => {
  try {
    const orders = store.getOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/user/:phone
router.get('/user/:phone', (req, res) => {
  try {
    const orders = store.getOrders().filter(o => o.customerPhone === req.params.phone);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id (Customer tracking & detail)
router.get('/:id', (req, res) => {
  try {
    const order = store.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders (Place new order)
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

    if (!customerName || !hostel || !roomNumber || !items || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Missing required order fields: name, hostel, roomNumber, and at least one item.'
      });
    }

    // Check availability of items before placing order
    for (const item of items) {
      const prod = store.getProductById(item.productId);
      if (prod && !prod.isAvailable) {
        return res.status(400).json({
          success: false,
          error: `Item "${prod.name}" is currently Out of Stock!`
        });
      }
    }

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
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id/status (Admin change status)
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    const updated = store.updateOrderStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
