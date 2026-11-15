// Notifications shown in the bell list.
// Updates for orders that are already delivered are hidden, so the
// badge must not count them either (otherwise it gets stuck at "9+").
export function visibleNotifications(notifications = [], orders = []) {
  return notifications.filter((notification) => {
    if (!notification.orderId) return true;

    const order = orders.find((o) => o.id === notification.orderId);

    // Order not loaded yet → keep it visible
    if (!order) return true;

    return order.status !== 'delivered';
  });
}

export function visibleUnreadCount(notifications = [], orders = []) {
  return visibleNotifications(notifications, orders).filter((n) => !n.isRead).length;
}
