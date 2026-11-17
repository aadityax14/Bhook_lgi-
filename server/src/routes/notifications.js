import express from 'express';
import { store } from '../db/store.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Every notification route is scoped to the signed-in customer.
router.use(requireAuth);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
<<<<<<< HEAD
    const notifications = store.getNotificationsForUser(req.user.userId);
=======
    const notifications = await store.getNotifications();
>>>>>>> main
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ success: true, unreadCount, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
<<<<<<< HEAD
    const updated = store.markNotificationAsRead(req.params.id, req.user.userId);
=======
    const updated = await store.markNotificationAsRead(req.params.id);
>>>>>>> main
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', async (req, res) => {
  try {
<<<<<<< HEAD
    store.markAllNotificationsAsRead(req.user.userId);
=======
    await store.markAllNotificationsAsRead();
>>>>>>> main
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
