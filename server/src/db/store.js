import { pool, withTransaction } from './postgres.js';
import { DEFAULT_SELLER_ID, DEFAULT_STORE_ID } from './migrate.js';

const BHEL_HALF_ID = 'prod-bhel-half';
const BHEL_FULL_ID = 'prod-bhel-full';
const BHEL_PRODUCT_IDS = [BHEL_HALF_ID, BHEL_FULL_ID];

const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

const ORDER_SELECT = `
  SELECT
    o.*,
    COALESCE(
      (SELECT json_agg(oi ORDER BY oi.position)
       FROM order_items oi
       WHERE oi.order_id = o.id),
      '[]'::json
    ) AS items
  FROM orders o
`;

// Error carrying an HTTP status, so routes can return 409 for stock problems.
function stockError(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

// =========================================================
// ROW MAPPERS (snake_case rows -> the camelCase shape the client uses)
// =========================================================

function toProduct(row) {
  const product = {
    id: row.id,
    sellerId: row.seller_id,
    storeId: row.store_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    isAvailable: row.is_available,
    isCooked: row.is_cooked,
    allowsSpiceCustomization: row.allows_spice_customization,
    imageUrl: row.image_url,
    variants: row.variants || [],
    addons: row.addons || [],
    tags: row.tags || [],
    stockType: row.stock_type,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };

  if (row.stock_type === 'bhel') {
    product.stockHalfUnits = Number(row.stock_half_units) || 0;
  } else {
    product.stockQuantity = Number(row.stock_quantity) || 0;
  }

  return product;
}

function toOrderItem(item) {
  return {
    productId: item.product_id,
    productName: item.product_name,
    variant: item.variant_name,
    spiceLevel: item.spice_level,
    addons: item.addons || [],
    quantity: item.quantity,
    priceAtOrder: Number(item.price_at_order),
    itemTotal: Number(item.item_total)
  };
}

function toOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    hostel: row.hostel,
    roomNumber: row.room_number,
    deliveryType: row.delivery_type,
    deliveryNotes: row.delivery_notes || '',
    items: (row.items || []).map(toOrderItem),
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    packagingFee: Number(row.packaging_fee),
    total: Number(row.total),
    status: row.status,
    stockDeducted: row.stock_deducted,
    etaMinutes: row.eta_minutes,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function toNotification(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: row.is_read,
    createdAt: toIso(row.created_at)
  };
}

class DataStore {
  // =========================================================
  // PRODUCTS
  // =========================================================

  async getProducts(categoryFilter, search) {
    const conditions = [];
    const params = [];

    if (categoryFilter && categoryFilter !== 'all') {
      if (categoryFilter === 'cooked') {
        conditions.push('is_cooked = TRUE');
      } else if (categoryFilter === 'uncooked') {
        conditions.push('is_cooked = FALSE');
      } else {
        params.push(categoryFilter);
        conditions.push(`category_id = $${params.length}`);
      }
    }

    if (search && search.trim()) {
      params.push(search.toLowerCase().trim());
      const p = `$${params.length}`;

      conditions.push(`(
        POSITION(${p} IN LOWER(name)) > 0
        OR POSITION(${p} IN LOWER(COALESCE(description, ''))) > 0
        OR EXISTS (SELECT 1 FROM UNNEST(tags) tag WHERE POSITION(${p} IN LOWER(tag)) > 0)
      )`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT * FROM products ${where} ORDER BY created_at DESC, id`,
      params
    );

    return rows.map(toProduct);
  }

  async getProductById(id, db = pool) {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0] ? toProduct(rows[0]) : null;
  }

  async createProduct(productData) {
    const stockType =
      productData.stockType ||
      (productData.categoryId === 'bhel' ? 'bhel' : 'normal');

    const isBhel = stockType === 'bhel';
    const stock = Math.max(
      0,
      Number(isBhel ? productData.stockHalfUnits : productData.stockQuantity) || 0
    );

    const id = `prod-${Date.now()}`;

    // Unknown categories are stored as NULL instead of failing the foreign key.
    await pool.query(
      `INSERT INTO products
        (id, seller_id, store_id, category_id, name, description, price, is_available,
         is_cooked, allows_spice_customization, image_url, variants, addons, tags,
         stock_quantity, stock_half_units, stock_type)
       VALUES ($1, $2, $3, (SELECT id FROM categories WHERE id = $4), $5, $6, $7, $8,
               $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        id,
        DEFAULT_SELLER_ID,
        DEFAULT_STORE_ID,
        productData.categoryId || null,
        productData.name,
        productData.description || '',
        Number(productData.price) || 0,
        stock > 0,
        Boolean(productData.isCooked),
        Boolean(productData.allowsSpiceCustomization),
        productData.imageUrl || DEFAULT_PRODUCT_IMAGE,
        JSON.stringify(productData.variants || []),
        JSON.stringify(productData.addons || []),
        productData.tags || [],
        isBhel ? null : stock,
        isBhel ? stock : null,
        stockType
      ]
    );

    return this.getProductById(id);
  }

  async updateProduct(id, updates) {
    return withTransaction(async client => {
      const { rows } = await client.query(
        'SELECT * FROM products WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const isBhel = this.isBhelProduct(id);

      // Only these fields can be changed; anything else in the body is ignored.
      const columns = {
        name: 'name',
        description: 'description',
        price: 'price',
        categoryId: 'category_id',
        isAvailable: 'is_available',
        isCooked: 'is_cooked',
        allowsSpiceCustomization: 'allows_spice_customization',
        imageUrl: 'image_url',
        variants: 'variants',
        addons: 'addons',
        tags: 'tags'
      };

      const values = {};

      for (const [field, column] of Object.entries(columns)) {
        if (updates[field] !== undefined) {
          values[column] =
            field === 'variants' || field === 'addons'
              ? JSON.stringify(updates[field])
              : updates[field];
        }
      }

      // NORMAL STOCK
      if (updates.stockQuantity !== undefined && !isBhel) {
        const stock = Math.max(0, Number(updates.stockQuantity) || 0);
        values.stock_quantity = stock;
        values.stock_type = 'normal';
        values.is_available = stock > 0;
      }

      const setClauses = Object.keys(values).map((column, i) => `${column} = $${i + 2}`);
      setClauses.push('updated_at = NOW()');

      await client.query(
        `UPDATE products SET ${setClauses.join(', ')} WHERE id = $1`,
        [id, ...Object.values(values)]
      );

      // BHEL SHARED STOCK
      // The entered value is SHARED BHEL quantity:
      // 1 shared = 1 full or 2 half, applied to both Bhel products.
      if (updates.stockHalfUnits !== undefined && isBhel) {
        const shared = Math.max(0, Number(updates.stockHalfUnits) || 0);
        await this.setBhelStock(client, shared);
      }

      return this.getProductById(id, client);
    });
  }

  async deleteProduct(id) {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return rowCount > 0;
  }

  // =========================================================
  // INVENTORY HELPERS
  // =========================================================

  isBhelProduct(productId) {
    return BHEL_PRODUCT_IDS.includes(productId);
  }

  async setBhelStock(client, shared) {
    await client.query(
      `UPDATE products
       SET stock_type = 'bhel',
           stock_half_units = $2,
           is_available = $3,
           updated_at = NOW()
       WHERE id = ANY($1)`,
      [BHEL_PRODUCT_IDS, shared, shared > 0]
    );
  }

  // Returns { products: Map, bhelShared } for the given items.
  // Pass lock = true inside a transaction to block concurrent stock changes.
  async loadStock(db, items, lock = false) {
    const ids = [
      ...new Set([
        ...items.map(item => item.productId),
        ...(items.some(item => this.isBhelProduct(item.productId)) ? BHEL_PRODUCT_IDS : [])
      ])
    ];

    const { rows } = await db.query(
      `SELECT * FROM products WHERE id = ANY($1) ORDER BY id ${lock ? 'FOR UPDATE' : ''}`,
      [ids]
    );

    const products = new Map(rows.map(row => [row.id, toProduct(row)]));

    const bhelStocks = BHEL_PRODUCT_IDS
      .filter(id => products.has(id))
      .map(id => products.get(id).stockHalfUnits);

    return {
      products,
      bhelShared: bhelStocks.length ? Math.max(...bhelStocks) : 0
    };
  }

  // Works out how much stock an order needs.
  getRequirements(items) {
    let bhelRequiredShared = 0;
    const normalRequirements = {};

    for (const item of items) {
      const quantity = Math.max(1, Number(item.quantity) || 1);

      if (this.isBhelProduct(item.productId)) {
        // 1 Full = 1 Shared, 2 Half = 1 Shared
        bhelRequiredShared +=
          item.productId === BHEL_FULL_ID ? quantity : quantity / 2;
        continue;
      }

      normalRequirements[item.productId] =
        (normalRequirements[item.productId] || 0) + quantity;
    }

    return { bhelRequiredShared, normalRequirements };
  }

  validateStock(items, { products, bhelShared }, requireAvailable) {
    for (const item of items) {
      const product = products.get(item.productId);

      if (!product) {
        return { ok: false, error: `Product not found: ${item.productId}` };
      }

      // Admin manually marked the item as out of stock.
      if (requireAvailable && !product.isAvailable) {
        return { ok: false, error: `"${product.name}" is currently Out of Stock.` };
      }
    }

    const { bhelRequiredShared, normalRequirements } = this.getRequirements(items);

    if (bhelRequiredShared > bhelShared) {
      return {
        ok: false,
        error:
          bhelShared === 0
            ? 'Bhel is currently Out of Stock.'
            : `Not enough Bhel stock. Available: ${bhelShared} Full Bhel or ${bhelShared * 2} Half Bhel.`
      };
    }

    for (const [productId, requiredQuantity] of Object.entries(normalRequirements)) {
      const product = products.get(productId);
      const available = Math.max(0, Number(product.stockQuantity) || 0);

      if (requiredQuantity > available) {
        return {
          ok: false,
          error: `"${product.name}" has only ${available} left in stock.`
        };
      }
    }

    return { ok: true };
  }

  // =========================================================
  // CHECK ORDER STOCK
  // =========================================================

  async checkOrderStock(items, db = pool) {
    const stock = await this.loadStock(db, items);
    return this.validateStock(items, stock, true);
  }

  // =========================================================
  // DEDUCT STOCK (must run inside a transaction)
  // =========================================================

  async deductStockForOrder(client, items) {
    const stock = await this.loadStock(client, items, true);
    const stockCheck = this.validateStock(items, stock, false);

    if (!stockCheck.ok) {
      return stockCheck;
    }

    const { bhelRequiredShared, normalRequirements } = this.getRequirements(items);

    for (const [productId, quantity] of Object.entries(normalRequirements)) {
      await client.query(
        `UPDATE products
         SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - $2),
             is_available = GREATEST(0, COALESCE(stock_quantity, 0) - $2) > 0,
             stock_type = 'normal',
             updated_at = NOW()
         WHERE id = $1`,
        [productId, quantity]
      );
    }

    if (bhelRequiredShared > 0) {
      await this.setBhelStock(
        client,
        Math.max(0, stock.bhelShared - bhelRequiredShared)
      );
    }

    return { ok: true };
  }

  // =========================================================
  // ORDERS
  // =========================================================

  async getOrders({ customerPhone } = {}) {
    const params = [];
    let where = '';

    if (customerPhone !== undefined) {
      params.push(customerPhone);
      where = 'WHERE o.customer_phone = $1';
    }

    const { rows } = await pool.query(
      `${ORDER_SELECT} ${where} ORDER BY o.created_at DESC`,
      params
    );

    return rows.map(toOrder);
  }

  async getOrderById(id, db = pool) {
    const { rows } = await db.query(
      `${ORDER_SELECT} WHERE o.id = $1 OR o.order_number = $1 LIMIT 1`,
      [id]
    );

    return rows[0] ? toOrder(rows[0]) : null;
  }

  async createOrder(orderPayload) {
    const items = orderPayload.items || [];

    return withTransaction(async client => {
      // IMPORTANT:
      // Check stock BEFORE creating the order.
      const stock = await this.loadStock(client, items);
      const stockCheck = this.validateStock(items, stock, true);

      if (!stockCheck.ok) {
        throw stockError(stockCheck.error);
      }

      let orderNumber;

      do {
        orderNumber = `#BL-${Math.floor(1000 + Math.random() * 9000)}`;
      } while (
        (await client.query('SELECT 1 FROM orders WHERE order_number = $1', [orderNumber]))
          .rowCount > 0
      );

      const id = `bl-ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      await client.query(
        `INSERT INTO orders
          (id, order_number, seller_id, store_id, customer_name, customer_phone, hostel,
           room_number, delivery_type, delivery_notes, subtotal, delivery_fee, packaging_fee,
           total, status, stock_deducted, eta_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'placed', FALSE, 15)`,
        [
          id,
          orderNumber,
          DEFAULT_SELLER_ID,
          DEFAULT_STORE_ID,
          orderPayload.customerName || 'Hostel Resident',
          orderPayload.customerPhone || '',
          orderPayload.hostel || 'GH4',
          orderPayload.roomNumber || '',
          orderPayload.deliveryType || 'room_delivery',
          orderPayload.deliveryNotes || '',
          Number(orderPayload.subtotal) || 0,
          Number(orderPayload.deliveryFee) || 0,
          Number(orderPayload.packagingFee) || 5,
          Number(orderPayload.total) || 0
        ]
      );

      for (const [position, item] of items.entries()) {
        await client.query(
          `INSERT INTO order_items
            (order_id, product_id, product_name, variant_name, spice_level, addons,
             quantity, price_at_order, item_total, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            item.productId,
            item.productName || stock.products.get(item.productId).name,
            item.variant || null,
            item.spiceLevel || null,
            JSON.stringify(item.addons || []),
            Math.max(1, Number(item.quantity) || 1),
            Number(item.priceAtOrder) || 0,
            Number(item.itemTotal) || 0,
            position
          ]
        );
      }

      await this.createNotification(
        {
          orderId: id,
          title: 'Order Placed! 🎉',
          message: `Your Bhook_Lgi order ${orderNumber} is on its way to the kitchen.`,
          type: 'order_status'
        },
        client
      );

      return this.getOrderById(id, client);
    });
  }

  async updateOrderStatus(orderId, status) {
    return withTransaction(async client => {
      const { rows } = await client.query(
        `SELECT * FROM orders WHERE id = $1 OR order_number = $1 LIMIT 1 FOR UPDATE`,
        [orderId]
      );

      if (rows.length === 0) {
        return null;
      }

      const order = await this.getOrderById(rows[0].id, client);
      let stockDeducted = order.stockDeducted;

      // ---------------------------------------------------------
      // DEDUCT STOCK WHEN ACCEPTED
      // ---------------------------------------------------------

      if (status === 'accepted' && !stockDeducted) {
        const stockResult = await this.deductStockForOrder(client, order.items);

        if (!stockResult.ok) {
          throw stockError(stockResult.error);
        }

        stockDeducted = true;
      }

      await client.query(
        `UPDATE orders
         SET status = $2, stock_deducted = $3, updated_at = NOW()
         WHERE id = $1`,
        [order.id, status, stockDeducted]
      );

      // ---------------------------------------------------------
      // NOTIFICATIONS
      // ---------------------------------------------------------

      const statusNotifications = {
        accepted: {
          title: '🔥 Order Accepted!',
          message: `Your Bhook_Lgi order ${order.orderNumber} has been accepted by the kitchen.`
        },
        preparing: {
          title: '🍜 Order is Being Prepared!',
          message: 'The kitchen is cooking your items fresh right now!'
        },
        ready: {
          title: '✨ Order is Ready!',
          message: `Your food is packed and ready to be delivered to ${order.hostel}!`
        },
        out_for_delivery: {
          title: '🛵 Out for Delivery!',
          message: `Delivery partner is heading to ${order.hostel}, Room ${order.roomNumber}.`
        },
        delivered: {
          title: '🎉 Order Delivered!',
          message: 'Enjoy your meal! Cravings sorted by Bhook_Lgi.'
        },
        cancelled: {
          title: '❌ Order Cancelled',
          message: `Order ${order.orderNumber} was cancelled. Contact kitchen if this was a mistake.`
        }
      };

      if (statusNotifications[status]) {
        await this.createNotification(
          {
            orderId: order.id,
            title: statusNotifications[status].title,
            message: statusNotifications[status].message,
            type: 'order_status'
          },
          client
        );
      }

      return this.getOrderById(order.id, client);
    });
  }

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  async getNotifications() {
    const { rows } = await pool.query(
      'SELECT * FROM notifications ORDER BY created_at DESC'
    );

    return rows.map(toNotification);
  }

  async createNotification(notifData, db = pool) {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const { rows } = await db.query(
      `INSERT INTO notifications (id, order_id, title, message, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        notifData.orderId || null,
        notifData.title,
        notifData.message,
        notifData.type || 'order_status'
      ]
    );

    return toNotification(rows[0]);
  }

  async markNotificationAsRead(id) {
    const { rows } = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    return rows[0] ? toNotification(rows[0]) : null;
  }

  async markAllNotificationsAsRead() {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    return true;
  }

  // =========================================================
  // CATEGORIES
  // =========================================================

  async getCategories() {
    const { rows } = await pool.query(
      'SELECT id, name, slug, icon FROM categories ORDER BY sort_order, id'
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon
    }));
  }
}

export const store = new DataStore();
