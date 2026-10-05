/**
 * WhatsApp Notification Service Abstraction for Bhook_Lgi Multi-Vendor Marketplace
 *
 * Dispatches order notifications to each seller's configured WhatsApp number.
 * Can be connected to WhatsApp Cloud API, Twilio, or any provider via env variables.
 * Safe fallback: logs formatted notification payload without failing requests.
 */

export class WhatsAppNotificationService {
  /**
   * Send WhatsApp notification to a seller regarding an order event.
   *
   * @param {Object} params
   * @param {Object} params.seller Seller record containing name, whatsapp settings
   * @param {Object} params.order Order record with orderNumber, items, total, hostel, etc.
   * @param {'new_order' | 'status_change'} params.eventType
   * @param {string} [params.newStatus] New status if status_change event
   */
  static async notifySeller({ seller, order, eventType, newStatus }) {
    try {
      if (!seller) {
        console.warn('[WhatsAppService] No seller provided for notification.');
        return { success: false, reason: 'Seller missing' };
      }

      const whatsappSettings = seller.whatsapp || {};
      const targetNumber = whatsappSettings.number || seller.phone;

      // Check seller's granular notification preferences
      if (!targetNumber) {
        console.log(`[WhatsAppService] Seller "${seller.name}" has no WhatsApp number configured.`);
        return { success: false, reason: 'No WhatsApp number configured' };
      }

      if (eventType === 'new_order' && whatsappSettings.notifyOnNewOrder === false) {
        console.log(`[WhatsAppService] Seller "${seller.name}" opted out of new order WhatsApp notifications.`);
        return { success: false, reason: 'Opted out of new order alerts' };
      }

      if (eventType === 'status_change' && whatsappSettings.notifyOnStatusChange === false) {
        console.log(`[WhatsAppService] Seller "${seller.name}" opted out of status update WhatsApp notifications.`);
        return { success: false, reason: 'Opted out of status update alerts' };
      }

      // Format clean message for seller
      const message = this.formatMessage({ seller, order, eventType, newStatus });

      // WhatsApp Cloud API / Provider integration hook
      const apiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (apiKey && phoneNumberId) {
        // If Cloud API credentials are provided, send HTTP request
        const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: targetNumber.replace(/[^0-9]/g, ''),
            type: 'text',
            text: { body: message }
          })
        });

        const data = await response.json();
        console.log(`[WhatsAppService] Dispatched via WhatsApp Cloud API to ${targetNumber}:`, data);
        return { success: true, provider: 'cloud_api', response: data };
      } else {
        // Mock / Development Logging
        console.log('--------------------------------------------------');
        console.log(`[WhatsAppService] 📱 Mock Notification to Seller: ${seller.name} (${targetNumber})`);
        console.log(`[WhatsAppService] Event: ${eventType.toUpperCase()}`);
        console.log(`[WhatsAppService] Message:\n${message}`);
        console.log('--------------------------------------------------');

        return {
          success: true,
          provider: 'mock_console',
          recipient: targetNumber,
          messagePreview: message.slice(0, 100) + '...'
        };
      }
    } catch (err) {
      console.error('[WhatsAppService] Failed to send notification:', err.message);
      return { success: false, error: err.message };
    }
  }

  static formatMessage({ seller, order, eventType, newStatus }) {
    const itemsSummary = (order.items || [])
      .map(i => `• ${i.quantity}x ${i.productName || i.name} (₹${i.itemTotal || i.price * i.quantity})`)
      .join('\n');

    if (eventType === 'new_order') {
      return (
        `🎉 *New Order for ${seller.name}!* \n\n` +
        `*Order:* ${order.orderNumber}\n` +
        `*Customer:* ${order.customerName} (${order.customerPhone || 'N/A'})\n` +
        `*Delivery:* ${order.hostel}, Room ${order.roomNumber}\n` +
        (order.deliveryNotes ? `*Note:* "${order.deliveryNotes}"\n` : '') +
        `\n*Items:*\n${itemsSummary}\n\n` +
        `*Total:* ₹${order.total}\n` +
        `Please open your Seller Dashboard to confirm and pack this order!`
      );
    } else {
      return (
        `ℹ️ *Order Status Update (${seller.name})*\n\n` +
        `*Order:* ${order.orderNumber}\n` +
        `*New Status:* ${String(newStatus).toUpperCase()}\n` +
        `*Customer:* ${order.customerName} (${order.hostel} - Room ${order.roomNumber})\n` +
        `*Total:* ₹${order.total}`
      );
    }
  }
}
