import express from 'express';
import { store } from '../db/store.js';
import { pool } from '../db/postgres.js';
import { requireRole, getTodayIST } from '../middleware/auth.js';
import { saveImages, deleteImages, UploadError } from '../services/uploads.js';

const router = express.Router();

const shopper = requireRole('CUSTOMER', 'ADMIN', 'CHEF', 'DELIVERY');
const adminOnly = requireRole('ADMIN');

const MAX_REQUEST_PHOTOS = 3;
const MAX_REVIEW_PHOTOS = 3;


// "Aaditya Yadav" → "Aaditya Y." (shown publicly on reviews)
const publicName = (name) => {
  const parts = String(name || 'Customer').trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

// Contact details of the signed-in shopper (customer, admin or staff).
async function getCustomer(userId, kind = 'user') {
  if (kind === 'staff') {
    const result = await pool.query(
      `SELECT id, full_name AS name, mobile AS phone, hostel, '-' AS room_number
         FROM staff_accounts WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  const result = await pool.query(
    'SELECT id, name, phone, hostel, room_number FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

function handleError(res, error, fallback) {
  if (error instanceof UploadError) {
    return res.status(400).json({ success: false, error: error.message });
  }
  console.error(fallback, error);
  return res.status(500).json({ success: false, error: fallback });
}


// =============================================================
// CUSTOM ORDER REQUESTS
// =============================================================

// POST /api/zuxu/custom-requests  { description, images: [dataUrl] }
router.post('/custom-requests', shopper, async (req, res) => {
  try {
    const description = String(req.body?.description || '').trim();

    if (description.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please describe what you want (at least 10 characters).'
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Description can be at most 1000 characters.'
      });
    }

    // Don't let one account flood the admin with requests.
    const open = store
      .getCustomRequestsForUser(req.user.userId)
      .filter((r) => r.status === 'pending' || r.status === 'quoted');

    if (open.length >= 5) {
      return res.status(429).json({
        success: false,
        error: 'You already have 5 open custom requests. Please wait for a reply first.'
      });
    }

    const customer = await getCustomer(req.user.userId, req.user.kind);

    if (!customer) {
      return res.status(401).json({ success: false, error: 'Please sign in again.' });
    }

    const images = saveImages(req.body?.images, { min: 1, max: MAX_REQUEST_PHOTOS });

    const request = store.createCustomRequest({
      userId: String(customer.id),
      customerName: customer.name,
      customerPhone: customer.phone,
      hostel: customer.hostel,
      roomNumber: customer.room_number,
      description,
      images
    });

    return res.status(201).json({
      success: true,
      message: 'Request sent! Zuxu will reply with a price and delivery date.',
      data: request
    });
  } catch (error) {
    return handleError(res, error, 'Could not send your request.');
  }
});

// GET /api/zuxu/custom-requests/mine
router.get('/custom-requests/mine', shopper, (req, res) => {
  res.json({ success: true, data: store.getCustomRequestsForUser(req.user.userId) });
});

// GET /api/zuxu/custom-requests  (admin: all)
router.get('/custom-requests', adminOnly, (req, res) => {
  res.json({ success: true, data: store.getCustomRequests() });
});

// PATCH /api/zuxu/custom-requests/:id/quote  { price, estimatedDeliveryDate, note }
router.patch('/custom-requests/:id/quote', adminOnly, async (req, res) => {
  try {
    const request = store.getCustomRequestById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found.' });
    }

    if (!['pending', 'quoted'].includes(request.status)) {
      return res.status(409).json({
        success: false,
        error: `This request is already ${request.status}.`
      });
    }

    const price = Math.round(Number(req.body?.price) * 100) / 100;

    if (!Number.isFinite(price) || price <= 0 || price > 100000) {
      return res.status(400).json({ success: false, error: 'Enter a valid price.' });
    }

    const date = String(req.body?.estimatedDeliveryDate || '');
    const today = await getTodayIST();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || date < today) {
      return res.status(400).json({
        success: false,
        error: 'Choose an estimated delivery date from today onwards.'
      });
    }

    const note = String(req.body?.note || '').trim().slice(0, 500);

    const updated = store.updateCustomRequest(
      request.id,
      { status: 'quoted', quotedPrice: price, estimatedDeliveryDate: date, adminNote: note },
      {
        title: '✨ Your custom Zuxu order has a price!',
        message: `${request.requestNumber}: ₹${price}, delivery by ${date}. Open Zuxu → My custom requests to confirm.`
      }
    );

    return res.json({ success: true, data: updated });
  } catch (error) {
    return handleError(res, error, 'Could not save the quote.');
  }
});

// PATCH /api/zuxu/custom-requests/:id/reject  { note }
router.patch('/custom-requests/:id/reject', adminOnly, (req, res) => {
  const request = store.getCustomRequestById(req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, error: 'Request not found.' });
  }

  if (!['pending', 'quoted'].includes(request.status)) {
    return res.status(409).json({ success: false, error: `This request is already ${request.status}.` });
  }

  const note = String(req.body?.note || '').trim().slice(0, 500);

  const updated = store.updateCustomRequest(
    request.id,
    { status: 'rejected', adminNote: note },
    {
      title: 'Custom Zuxu request update',
      message: `Sorry, we can't make ${request.requestNumber}.${note ? ` ${note}` : ''}`
    }
  );

  return res.json({ success: true, data: updated });
});

// POST /api/zuxu/custom-requests/:id/confirm  (customer accepts the quote)
router.post('/custom-requests/:id/confirm', shopper, async (req, res) => {
  try {
    const request = store.getCustomRequestById(req.params.id);

    if (!request || String(request.userId) !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Request not found.' });
    }

    if (request.status !== 'quoted') {
      return res.status(409).json({
        success: false,
        error: request.status === 'ordered'
          ? 'This request has already been ordered.'
          : 'This request has no price yet.'
      });
    }

    const customer = await getCustomer(req.user.userId, req.user.kind);
    const price = Number(request.quotedPrice);

    // The quoted price is the final price for a custom order.
    const order = store.createOrder({
      userId: request.userId,
      orderType: 'zuxu',
      isCustom: true,
      customRequestId: request.id,
      estimatedDeliveryDate: request.estimatedDeliveryDate,
      customerName: customer?.name || request.customerName,
      customerPhone: customer?.phone || request.customerPhone,
      hostel: customer?.hostel || request.hostel,
      roomNumber: customer?.room_number || request.roomNumber,
      deliveryType: 'room_delivery',
      deliveryNotes: '',
      items: [
        {
          productId: null,
          productName: `Custom Zuxu order ${request.requestNumber}`,
          variant: null,
          addons: [],
          quantity: 1,
          priceAtOrder: price,
          itemTotal: price,
          customization: { description: request.description },
          images: request.images
        }
      ],
      subtotal: price,
      deliveryFee: 0,
      packagingFee: 0,
      total: price
    });

    store.updateCustomRequest(request.id, { status: 'ordered', orderId: order.id });

    return res.status(201).json({ success: true, data: { order, request: store.getCustomRequestById(request.id) } });
  } catch (error) {
    return handleError(res, error, 'Could not place the custom order.');
  }
});

// POST /api/zuxu/custom-requests/:id/decline  (customer says no to the quote)
router.post('/custom-requests/:id/decline', shopper, (req, res) => {
  const request = store.getCustomRequestById(req.params.id);

  if (!request || String(request.userId) !== req.user.userId) {
    return res.status(404).json({ success: false, error: 'Request not found.' });
  }

  if (!['pending', 'quoted'].includes(request.status)) {
    return res.status(409).json({ success: false, error: `This request is already ${request.status}.` });
  }

  const updated = store.updateCustomRequest(request.id, { status: 'declined' });
  return res.json({ success: true, data: updated });
});


// =============================================================
// REVIEWS (only customers who received the product)
// =============================================================

// GET /api/zuxu/reviews/summary  → { productId: { average, count } }
router.get('/reviews/summary', (req, res) => {
  res.json({ success: true, data: store.getReviewSummary() });
});

// GET /api/zuxu/products/:id/reviews
router.get('/products/:id/reviews', (req, res) => {
  const reviews = store.getReviewsForProduct(req.params.id).map((r) => ({
    id: r.id,
    productId: r.productId,
    rating: r.rating,
    text: r.text,
    images: r.images || [],
    authorName: r.authorName,
    createdAt: r.createdAt
  }));

  const average = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  res.json({ success: true, data: { reviews, average, count: reviews.length } });
});

// GET /api/zuxu/reviews/mine → [{ orderId, productId }] already reviewed
router.get('/reviews/mine', shopper, (req, res) => {
  res.json({
    success: true,
    data: store.getReviewsByUser(req.user.userId).map((r) => ({
      id: r.id,
      orderId: r.orderId,
      productId: r.productId,
      rating: r.rating
    }))
  });
});

// POST /api/zuxu/reviews  { orderId, productId, rating, text, images }
router.post('/reviews', shopper, async (req, res) => {
  try {
    const { orderId, productId } = req.body || {};
    const rating = Number(req.body?.rating);
    const text = String(req.body?.text || '').trim();

    const order = store.getOrderById(orderId);

    // Verified buyers only: their own, delivered order (Bhook_Lgi food
    // or Zuxu) that contains this product.
    if (!order || String(order.userId) !== req.user.userId) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.status !== 'delivered') {
      return res.status(409).json({ success: false, error: 'You can review once your order is delivered.' });
    }

    const product = store.getProductById(productId);
    const inOrder = (order.items || []).some((item) => item.productId === productId);

    if (!product || !inOrder) {
      return res.status(400).json({ success: false, error: 'This product is not in that order.' });
    }

    if (store.findReview(req.user.userId, order.id, productId)) {
      return res.status(409).json({ success: false, error: 'You already reviewed this product for this order.' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Please choose 1 to 5 stars.' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ success: false, error: 'Review can be at most 1000 characters.' });
    }

    const customer = await getCustomer(req.user.userId, req.user.kind);
    const images = saveImages(req.body?.images, { min: 0, max: MAX_REVIEW_PHOTOS });

    const review = store.createReview({
      userId: req.user.userId,
      orderId: order.id,
      productId,
      rating,
      text,
      images,
      authorName: publicName(customer?.name)
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    return handleError(res, error, 'Could not save your review.');
  }
});

// DELETE /api/zuxu/reviews/:id  (admin moderation)
router.delete('/reviews/:id', adminOnly, (req, res) => {
  const removed = store.deleteReview(req.params.id);

  if (!removed) {
    return res.status(404).json({ success: false, error: 'Review not found.' });
  }

  deleteImages(removed.images);
  return res.json({ success: true });
});

export default router;
