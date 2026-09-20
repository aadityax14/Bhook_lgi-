import express from 'express';
import { store } from '../db/store.js';

const router = express.Router();

// GET /api/notifications
router.get('/', (req, res) => {
  try {
    const notifications = store.getNotifications();
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ success: true, unreadCount, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req, res) => {
  try {
    const updated = store.markNotificationAsRead(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', (req, res) => {
  try {
    store.markAllNotificationsAsRead();
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
