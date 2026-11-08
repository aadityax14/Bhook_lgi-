import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, withTransaction } from './postgres.js';
import {
  INITIAL_SELLERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS
} from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL_FILES = ['schema.sql', 'staff_schema.sql', 'patches.sql'];
const LEGACY_DATA_FILE = path.join(__dirname, '../data/db.json');

export const DEFAULT_SELLER_ID = 'seller-bhook-lgi';
export const DEFAULT_STORE_ID = 'store-bhook-lgi';

const BHEL_PRODUCT_IDS = ['prod-bhel-half', 'prod-bhel-full'];

// =========================================================
// ENTRY POINT
// =========================================================

export async function initDatabase() {
  const { rows } = await pool.query('SELECT NOW() AS current_time');
  console.log('✅ PostgreSQL connected:', rows[0].current_time);

  for (const file of SQL_FILES) {
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    await pool.query(sql);
  }

  await withTransaction(async client => {
    await seedSellers(client);

    const { rows: [{ count }] } = await client.query(
      'SELECT COUNT(*)::int AS count FROM products'
    );

    if (count > 0) {
      return;
    }

    const legacy = readLegacyData();

    if (legacy) {
      console.log('📦 Importing existing data from db.json into PostgreSQL...');
      await importData(client, legacy);
      console.log(
        `✅ Imported ${legacy.products.length} products, ${legacy.orders.length} orders, ` +
        `${legacy.notifications.length} notifications.`
      );
    } else {
      console.log('🌱 Seeding default categories and products...');
      await importData(client, {
        categories: INITIAL_CATEGORIES,
        products: INITIAL_PRODUCTS,
        orders: [],
        notifications: []
      });
    }
  });
}

// =========================================================
// HELPERS
// =========================================================

function readLegacyData() {
  if (!fs.existsSync(LEGACY_DATA_FILE)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(LEGACY_DATA_FILE, 'utf-8'));

    return {
      categories: Array.isArray(data.categories) ? data.categories : INITIAL_CATEGORIES,
      products: Array.isArray(data.products) ? data.products : INITIAL_PRODUCTS,
      orders: Array.isArray(data.orders) ? data.orders : [],
      notifications: Array.isArray(data.notifications) ? data.notifications : []
    };
  } catch (err) {
    console.warn('Could not read db.json, seeding defaults instead:', err.message);
    return null;
  }
}

async function seedSellers(client) {
  for (const seller of INITIAL_SELLERS) {
    await client.query(
      `INSERT INTO sellers
        (id, store_id, name, handle, category, description, avatar, banner, status,
         whatsapp_number, notify_on_new_order, notify_on_status_change, commission_rate, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO NOTHING`,
      [
        seller.id,
        seller.storeId,
        seller.name,
        seller.handle,
        seller.category,
        seller.description,
        seller.avatar,
        seller.banner,
        seller.status,
        seller.whatsapp?.number || null,
        seller.whatsapp?.notifyOnNewOrder ?? true,
        seller.whatsapp?.notifyOnStatusChange ?? true,
        seller.commissionRate,
        seller.createdAt
      ]
    );
  }
}

// Same rules the old file store applied on startup.
function normalizeProducts(products) {
  const normalized = products.map(product => {
    const isBhel = BHEL_PRODUCT_IDS.includes(product.id);
    const result = { ...product, stockType: isBhel ? 'bhel' : 'normal' };

    if (isBhel) {
      const stock = Number(product.stockHalfUnits);
      result.stockHalfUnits = Number.isNaN(stock) || product.stockHalfUnits == null
        ? 2
        : Math.max(0, stock);
      result.isAvailable = result.stockHalfUnits > 0;
    } else {
      const stock = Number(product.stockQuantity);
      result.stockQuantity = Number.isNaN(stock) || product.stockQuantity == null
        ? 10
        : Math.max(0, stock);
      result.isAvailable = result.stockQuantity > 0;
    }

    return result;
  });

  // Both Bhel products share one stock value.
  const bhel = normalized.filter(p => p.stockType === 'bhel');

  if (bhel.length > 0) {
    const shared = Math.max(...bhel.map(p => p.stockHalfUnits));

    bhel.forEach(p => {
      p.stockHalfUnits = shared;
      p.isAvailable = shared > 0;
    });
  }

  return normalized;
}

async function importData(client, data) {
  // ---------------------------------------------------------
  // Categories (plus any a product references but is missing)
  // ---------------------------------------------------------

  const categories = [...data.categories];
  const categoryIds = new Set(categories.map(c => c.id));

  for (const product of data.products) {
    if (product.categoryId && !categoryIds.has(product.categoryId)) {
      const known = INITIAL_CATEGORIES.find(c => c.id === product.categoryId);
      const id = product.categoryId;

      categories.push(
        known || { id, name: id.charAt(0).toUpperCase() + id.slice(1), slug: id, icon: null }
      );
      categoryIds.add(id);
    }
  }

  for (const [index, category] of categories.entries()) {
    await client.query(
      `INSERT INTO categories (id, name, slug, icon, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [category.id, category.name, category.slug || category.id, category.icon || null, index]
    );
  }

  // ---------------------------------------------------------
  // Products (created_at spaced out to keep the original order)
  // ---------------------------------------------------------

  const products = normalizeProducts(data.products);
  const productIds = new Set(products.map(p => p.id));
  const baseTime = Date.now();

  for (const [index, product] of products.entries()) {
    const isBhel = product.stockType === 'bhel';

    await client.query(
      `INSERT INTO products
        (id, seller_id, store_id, category_id, name, description, price, is_available,
         is_cooked, allows_spice_customization, image_url, variants, addons, tags,
         stock_quantity, stock_half_units, stock_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        product.id,
        DEFAULT_SELLER_ID,
        DEFAULT_STORE_ID,
        product.categoryId || null,
        product.name,
        product.description || '',
        Number(product.price) || 0,
        product.isAvailable,
        Boolean(product.isCooked),
        Boolean(product.allowsSpiceCustomization),
        product.imageUrl || null,
        JSON.stringify(product.variants || []),
        JSON.stringify(product.addons || []),
        product.tags || [],
        isBhel ? null : product.stockQuantity,
        isBhel ? product.stockHalfUnits : null,
        product.stockType,
        new Date(baseTime - index * 1000).toISOString(),
        product.updatedAt || new Date().toISOString()
      ]
    );
  }

  // ---------------------------------------------------------
  // Orders + items
  // ---------------------------------------------------------

  const orderIds = new Set();
  const orderNumbers = new Set();

  for (const order of data.orders) {
    let orderNumber = order.orderNumber || `#BL-${order.id}`;

    for (let n = 2; orderNumbers.has(orderNumber); n++) {
      orderNumber = `${order.orderNumber}-${n}`;
    }

    orderNumbers.add(orderNumber);
    orderIds.add(order.id);

    await client.query(
      `INSERT INTO orders
        (id, order_number, seller_id, store_id, customer_name, customer_phone, hostel,
         room_number, delivery_type, delivery_notes, subtotal, delivery_fee, packaging_fee,
         total, status, stock_deducted, eta_minutes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        order.id,
        orderNumber,
        DEFAULT_SELLER_ID,
        DEFAULT_STORE_ID,
        order.customerName || 'Hostel Resident',
        order.customerPhone || '',
        order.hostel || 'GH4',
        order.roomNumber || '',
        order.deliveryType || 'room_delivery',
        order.deliveryNotes || '',
        Number(order.subtotal) || 0,
        Number(order.deliveryFee) || 0,
        Number(order.packagingFee) || 0,
        Number(order.total) || 0,
        order.status || 'placed',
        order.stockDeducted ?? order.status !== 'placed',
        order.etaMinutes ?? 15,
        order.createdAt || new Date().toISOString(),
        order.updatedAt || order.createdAt || new Date().toISOString()
      ]
    );

    for (const [position, item] of (order.items || []).entries()) {
      await client.query(
        `INSERT INTO order_items
          (order_id, product_id, product_name, variant_name, spice_level, addons,
           quantity, price_at_order, item_total, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          order.id,
          productIds.has(item.productId) ? item.productId : null,
          item.productName || item.productId || 'Item',
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
  }

  // ---------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------

  for (const notif of data.notifications) {
    await client.query(
      `INSERT INTO notifications (id, order_id, title, message, type, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        notif.id,
        orderIds.has(notif.orderId) ? notif.orderId : null,
        notif.title || '',
        notif.message || '',
        notif.type || 'order_status',
        Boolean(notif.isRead),
        notif.createdAt || new Date().toISOString()
      ]
    );
  }
}
