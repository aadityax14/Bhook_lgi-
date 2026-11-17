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

// Delivery & packing charges (the admin can change these).
// Delivery is cheaper when a chef on duty today lives in the
// customer's hostel. freeDeliveryFrom: subtotal at which delivery
// becomes free (0 = never free — delivery partners always earn).
const DEFAULT_SETTINGS = {
  sameHostelDeliveryFee: 5,
  otherHostelDeliveryFee: 10,
  packagingFee: 5,
  freeDeliveryFrom: 0,
  // Bhook_Lgi food kitchen open for orders? (Zuxu is never affected.)
  kitchenOpen: true
};

class DataStore {
<<<<<<< HEAD
  constructor() {
    this.data = {
      sellers: INITIAL_SELLERS,
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      notifications: INITIAL_NOTIFICATIONS,
      customRequests: [],
      reviews: [],
      banners: null,
      settings: { ...DEFAULT_SETTINGS },
      earningsArchive: {}
    };

    this.init();
  }

  // =========================================================
  // INITIALIZATION / DATABASE MIGRATION
  // =========================================================

  init() {
    // First run only: no data file yet → start from the defaults.
    if (!fs.existsSync(DATA_FILE)) {
      this.migrateInventory();
      this.persist();
      return;
    }

    // Keep a copy of the data from every start-up (last 10).
    this.backupDataFile('startup');

    try {
      {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');

       const savedData = JSON.parse(fileContent);

this.data = {
  sellers: Array.isArray(savedData.sellers)
    ? savedData.sellers
    : INITIAL_SELLERS,

  categories: [
    ...(Array.isArray(savedData.categories) ? savedData.categories : []),
    ...INITIAL_CATEGORIES.filter(
        defaultCategory =>
            !(savedData.categories || []).some(
                savedCategory => savedCategory.id === defaultCategory.id
            )
    )
],

  products: Array.isArray(savedData.products)
    ? savedData.products
    : INITIAL_PRODUCTS,

  orders: Array.isArray(savedData.orders)
    ? savedData.orders
    : INITIAL_ORDERS,

  notifications: Array.isArray(savedData.notifications)
    ? savedData.notifications
    : INITIAL_NOTIFICATIONS,

  // Zuxu custom-order requests (photo + description → admin quote)
  // Delivery earnings kept from orders the admin deleted
  // { staffId: { 'YYYY-MM-DD': { deliveries, amount } } }
  earningsArchive:
    savedData.earningsArchive && typeof savedData.earningsArchive === 'object'
      ? savedData.earningsArchive
      : {},

  customRequests: Array.isArray(savedData.customRequests)
    ? savedData.customRequests
    : [],

  // Zuxu product reviews from customers who received the product
  reviews: Array.isArray(savedData.reviews)
    ? savedData.reviews
    : [],

  // Homepage hero banners set by the admin (null = app defaults)
  banners: Array.isArray(savedData.banners)
    ? savedData.banners
    : null,

  // Delivery & packing charges set by the admin
  settings: {
    ...DEFAULT_SETTINGS,
    ...(savedData.settings && typeof savedData.settings === 'object'
      ? savedData.settings
      : {})
  }
};

this.migrateInventory();
this.persist();
      }
    } catch (err) {
      // NEVER replace real data with defaults. Keep the file untouched,
      // save a copy for inspection, and stop the server loudly.
      const copy = this.backupDataFile('unreadable');

      console.error('\n❌ Could not load server/src/data/db.json:', err.message);
      console.error('   Your data was NOT changed.' + (copy ? ` A copy was saved to ${copy}` : ''));
      console.error('   Fix the problem (or restore a file from server/src/data/backups/) and restart.\n');

      throw err;
    }
  }

  migrateInventory() {


    if (!Array.isArray(this.data.products)) {
      this.data.products = [];
    }

    if (!Array.isArray(this.data.orders)) {
      this.data.orders = [];
    }

    // Older orders don't record whether they were food or Zuxu.
    this.data.orders.forEach(order => {
      if (order.orderType) return;

      const isZuxu =
        Array.isArray(order.items) &&
        order.items.length > 0 &&
        order.items.every(item => {
          const product = this.data.products.find(p => p.id === item.productId);
          return (
            product?.storeId === 'store-zuxu' ||
            String(product?.categoryId || '').toLowerCase() === 'zuxu'
          );
        });

      order.orderType = isZuxu ? 'zuxu' : 'food';
    });

    if (!Array.isArray(this.data.notifications)) {
      this.data.notifications = [];
    }

    // ---------------------------------------------------------
    // Migrate products
    // ---------------------------------------------------------

    this.data.products.forEach(product => {

      // Publishing status is separate from stock availability.
if (product.isActive === undefined) {
  product.isActive = true;
}
      const isBhel = this.isBhelProduct(product.id);
      
      if (isBhel) {
        product.stockType = 'bhel';

        if (
          product.stockHalfUnits === undefined ||
          product.stockHalfUnits === null ||
          Number.isNaN(Number(product.stockHalfUnits))
        ) {
          product.stockHalfUnits = 2;
        }

        product.stockHalfUnits = Math.max(
          0,
          Number(product.stockHalfUnits) || 0
        );

        // Both Bhel products are available whenever
        // at least 1 shared Bhel exists.
        product.isAvailable =
          product.stockHalfUnits > 0;
      } else {
        product.stockType = 'normal';

        if (
          product.stockQuantity === undefined ||
          product.stockQuantity === null ||
          Number.isNaN(Number(product.stockQuantity))
        ) {
          product.stockQuantity = 10;
        }

        product.stockQuantity = Math.max(
          0,
          Number(product.stockQuantity) || 0
        );

        product.isAvailable =
          product.stockQuantity > 0;
      }

      product.updatedAt =
        product.updatedAt || new Date().toISOString();
    });

    // ---------------------------------------------------------
    // Keep Bhel stock shared
    // ---------------------------------------------------------

    const bhelProducts = this.getBhelProducts();

    if (bhelProducts.length > 0) {
      const existingBhelStock = Math.max(
        ...bhelProducts.map(
          product =>
            Number(product.stockHalfUnits) || 0
        )
      );

      bhelProducts.forEach(product => {
        product.stockHalfUnits =
          existingBhelStock;

        product.isAvailable =
          existingBhelStock > 0;
      });
    }

    // ---------------------------------------------------------
    // Migrate old orders
    // ---------------------------------------------------------
    
    this.data.orders.forEach(order => {
      if (order.stockDeducted === undefined) {
        order.stockDeducted =
          order.status !== 'placed';
      }
    });
  }

  // Copy db.json into server/src/data/backups/ (keeps the newest 10).
  // Returns the backup path, or null if it couldn't be made.
  backupDataFile(reason) {
    try {
      if (!fs.existsSync(DATA_FILE)) return null;

      const backupDir = path.join(path.dirname(DATA_FILE), 'backups');
      fs.mkdirSync(backupDir, { recursive: true });

      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const target = path.join(backupDir, `db-${stamp}-${reason}.json`);
      fs.copyFileSync(DATA_FILE, target);

      const old = fs.readdirSync(backupDir)
        .filter(name => name.startsWith('db-') && name.endsWith('.json'))
        .sort()
        .reverse()
        .slice(10);

      for (const name of old) {
        fs.unlinkSync(path.join(backupDir, name));
      }

      return target;
    } catch (error) {
      console.warn('Could not back up db.json:', error.message);
      return null;
    }
  }

  persist() {
    try {
      const dir = path.dirname(DATA_FILE);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write to a temp file, then swap it in, so a crash or restart
      // mid-save can never leave a half-written db.json behind.
      const tempFile = `${DATA_FILE}.tmp`;

      fs.writeFileSync(
        tempFile,
        JSON.stringify(this.data, null, 2),
        'utf-8'
      );

      fs.renameSync(tempFile, DATA_FILE);
    } catch (err) {
      console.error(
        'Error persisting data store:',
        err.message
      );
    }
  }

=======
>>>>>>> main
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

<<<<<<< HEAD
 createProduct(productData) {
  const stockType =
    productData.stockType ||
    (productData.categoryId === 'bhel' ? 'bhel' : 'normal');

  const now = new Date().toISOString();

  const initialStock =
    productData.stockQuantity !== undefined
      ? Math.max(0, Number(productData.stockQuantity) || 0)
      : 10;

  const initialBhelStock =
    productData.stockHalfUnits !== undefined
      ? Math.max(0, Number(productData.stockHalfUnits) || 0)
      : 0;

  const newProduct = {
    id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,

    // General product details
    name: '',
    description: '',
    categoryId: 'snacks',
    price: 0,
    mrp: undefined,
    sku: '',
    brand: '',

    // Store identification
    storeId:
      productData.storeId ||
      (productData.productType === 'zuxu'
        ? 'store-zuxu'
        : 'store-bhook-lgi'),

    productType:
      productData.productType ||
      (productData.storeId === 'store-zuxu' ? 'zuxu' : 'food'),

    // Images
    imageUrl: '',
    images: [],

    // Product options
    variants: [],
    addons: [],
    customization: {},
    customizationOptions: [],

    // Additional details
    specifications: {},
    deliveryInfo: {},
    tags: [],

    // Publishing
    isActive:
      productData.isActive !== undefined
        ? Boolean(productData.isActive)
        : true,

    isFeatured: Boolean(productData.isFeatured),

    // Food-specific settings
    isCooked: false,
    allowsSpiceCustomization: false,

    // Inventory
    stockType,

    stockQuantity: initialStock,
    stockHalfUnits: initialBhelStock,

    isAvailable: true,

    createdAt: now,
    updatedAt: now,

    // Preserve all additional supported product data.
    ...productData,

    // Ensure the final inventory values are normalized.
    stockType,
    stockQuantity: initialStock,
    stockHalfUnits: initialBhelStock,

    isActive:
      productData.isActive !== undefined
        ? Boolean(productData.isActive)
        : true,

    isFeatured: Boolean(productData.isFeatured),

    createdAt: now,
    updatedAt: now
  };

  if (stockType === 'bhel') {
    newProduct.isAvailable =
      initialBhelStock > 0;
  } else {
    newProduct.isAvailable =
      initialStock > 0;
  }

  // Keep the primary image synchronized.
  if (
    (!newProduct.imageUrl || !newProduct.imageUrl.trim()) &&
    Array.isArray(newProduct.images) &&
    newProduct.images.length > 0
  ) {
    newProduct.imageUrl = newProduct.images[0];
  }

  this.data.products.unshift(newProduct);

  if (this.isBhelProduct(newProduct.id)) {
    this.syncBhelStock();
  }

  this.persist();

  return newProduct;
}
  updateProduct(id, updates) {
    const idx =
      this.data.products.findIndex(
        product => product.id === id
=======
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
>>>>>>> main
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

<<<<<<< HEAD
    if (
  cleanedUpdates.stockQuantity !== undefined &&
  !this.isBhelProduct(id)
) {
  cleanedUpdates.stockQuantity =
    Math.max(0, Number(cleanedUpdates.stockQuantity) || 0);

  cleanedUpdates.stockType = 'normal';

  if (cleanedUpdates.isAvailable === undefined) {
    cleanedUpdates.isAvailable =
      cleanedUpdates.stockQuantity > 0;
  }
}

    // ---------------------------------------------------------
    // BHEL SHARED STOCK
    // ---------------------------------------------------------

    if (
      cleanedUpdates.stockHalfUnits !== undefined &&
      this.isBhelProduct(id)
    ) {
      const newStock =
        Math.max(
          0,
          Number(
            cleanedUpdates.stockHalfUnits
          ) || 0
        );

      const now =
        new Date().toISOString();

      // The entered value is SHARED BHEL quantity.
      //
      // Example:
      // 1 shared = 1 full + 2 half
      // 5 shared = 5 full + 10 half

      this.data.products.forEach(product => {
        if (!this.isBhelProduct(product.id)) {
          return;
=======
      for (const [field, column] of Object.entries(columns)) {
        if (updates[field] !== undefined) {
          values[column] =
            field === 'variants' || field === 'addons'
              ? JSON.stringify(updates[field])
              : updates[field];
>>>>>>> main
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

<<<<<<< HEAD
  getOrderById(id) {
    return this.data.orders.find(
      order =>
        order.id === id ||
        order.orderNumber === id
    );
  }

  createOrder(orderPayload) {
    const isCustom = Boolean(orderPayload.isCustom);

    // IMPORTANT:
    // Check stock BEFORE creating the order.
    // (Custom Zuxu orders are made to order — no stock.)
    const stockCheck = isCustom
      ? { ok: true }
      : this.checkOrderStock(
          orderPayload.items || []
        );

    if (!stockCheck.ok) {
      throw new Error(
        stockCheck.error
      );
    }

    const orderType =
      orderPayload.orderType === 'zuxu' ? 'zuxu' : 'food';

    const randNum =
      Math.floor(
        1000 +
        Math.random() * 9000
      );

    const orderNumber =
      `#BL-${randNum}`;

    const id =
      `bl-ord-${Date.now()}`;

    const newOrder = {
      id,
      orderNumber,

      // Owner of the order (signed-in customer)
      userId:
        orderPayload.userId ||
        null,

      // 'food' (Bhook_Lgi kitchen) or 'zuxu' (handmade store).
      // They follow different tracking steps.
      orderType,
      isCustom,
      customRequestId: orderPayload.customRequestId || null,
      estimatedDeliveryDate: orderPayload.estimatedDeliveryDate || null,

      customerName:
        orderPayload.customerName ||
        'Hostel Resident',

      customerPhone:
        orderPayload.customerPhone ||
        '',

      hostel:
        orderPayload.hostel ||
        'GH4',

      roomNumber:
        orderPayload.roomNumber ||
        '',

      deliveryType:
        orderPayload.deliveryType ||
        'room_delivery',

      deliveryNotes:
        orderPayload.deliveryNotes ||
        '',

      items:
        orderPayload.items || [],

      subtotal:
        Number(
          orderPayload.subtotal
        ) || 0,

      deliveryFee:
        Number(
          orderPayload.deliveryFee
        ) || 0,

      packagingFee:
        orderPayload.packagingFee !== undefined
          ? Number(orderPayload.packagingFee) || 0
          : 5,

      total:
        Number(
          orderPayload.total
        ) || 0,

      // A custom order is created only after the admin quoted it
      // and the customer agreed, so it starts as accepted.
      status: isCustom ? 'accepted' : 'placed',

      // Stock will be deducted when accepted (never for custom orders).
      stockDeducted: isCustom,

      etaMinutes: 15,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()
    };

    this.data.orders.unshift(
      newOrder
    );

    this.createNotification({
      orderId: newOrder.id,
      userId: newOrder.userId,

      title:
        isCustom
          ? '✨ Custom Zuxu order confirmed!'
          : 'Order Placed! 🎉',

      message:
        orderType === 'zuxu'
          ? `Your Zuxu order ${newOrder.orderNumber} has been placed. We'll keep you posted!`
          : `Your Bhook_Lgi order ${newOrder.orderNumber} is on its way to the kitchen.`,
=======
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
>>>>>>> main

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

<<<<<<< HEAD
      order.stockDeducted = true;
    }

    // ---------------------------------------------------------
    // UPDATE ORDER STATUS
    // ---------------------------------------------------------

    order.status = status;

    order.updatedAt =
      new Date().toISOString();

    // ---------------------------------------------------------
    // NOTIFICATIONS
    // ---------------------------------------------------------

    const statusNotifications = {
      accepted: {
        title:
          '🔥 Order Accepted!',

        message:
          `Your Bhook_Lgi order ${order.orderNumber} has been accepted by the kitchen.`
      },

      preparing: {
        title:
          '🍜 Order is Being Prepared!',

        message:
          'The kitchen is cooking your items fresh right now!'
      },

      ready: {
        title:
          '✨ Order is Ready!',

        message:
          `Your food is packed and ready to be delivered to ${order.hostel}!`
      },

      out_for_delivery: {
        title:
          '🛵 Out for Delivery!',

        message:
          `Delivery partner is heading to ${order.hostel}, Room ${order.roomNumber}.`
      },

      delivered: {
        title:
          '🎉 Order Delivered!',

        message:
          'Enjoy your meal! Cravings sorted by Bhook_Lgi.'
      },

      cancelled: {
        title:
          '❌ Order Cancelled',

        message:
          `Order ${order.orderNumber} was cancelled. Contact kitchen if this was a mistake.`
      }
    };

    // Zuxu (handmade) orders have their own steps and wording.
    const zuxuNotifications = {
      accepted: {
        title: '🎀 Zuxu Order Accepted!',
        message: `Your Zuxu order ${order.orderNumber} has been accepted and is being made with love.`
      },
      ready_to_dispatch: {
        title: '📦 Ready to Dispatch!',
        message: `Your Zuxu order ${order.orderNumber} is packed and ready to be sent out.`
      },
      out_for_delivery: statusNotifications.out_for_delivery,
      delivered: {
        title: '🎁 Zuxu Order Delivered!',
        message: 'Hope you love it! You can now rate it and share a photo.'
      },
      cancelled: statusNotifications.cancelled
    };

    const notification =
      order.orderType === 'zuxu'
        ? zuxuNotifications[status]
        : statusNotifications[status];

    if (notification) {
      this.createNotification({
        orderId: order.id,
        userId: order.userId || null,
        title: notification.title,
        message: notification.message,
        type: 'order_status'
      });
    }

    this.persist();

    return order;
=======
      return this.getOrderById(order.id, client);
    });
>>>>>>> main
  }

  // =========================================================
  // ZUXU CUSTOM ORDER REQUESTS
  // pending → quoted (admin sets price + date) → ordered
  //                                            ↘ declined (customer)
  // pending → rejected (admin)
  // =========================================================

  getCustomRequests() {
    return [...this.data.customRequests].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  getCustomRequestsForUser(userId) {
    return this.getCustomRequests().filter(
      (r) => String(r.userId) === String(userId)
    );
  }

  getCustomRequestById(id) {
    return this.data.customRequests.find((r) => r.id === id) || null;
  }

  createCustomRequest(data) {
    const now = new Date().toISOString();
    const request = {
      id: `zx-req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      requestNumber: `#ZX-C-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      quotedPrice: null,
      estimatedDeliveryDate: null,
      adminNote: '',
      orderId: null,
      createdAt: now,
      updatedAt: now,
      ...data
    };

    this.data.customRequests.unshift(request);
    this.persist();
    return request;
  }

  updateCustomRequest(id, updates, notification) {
    const request = this.getCustomRequestById(id);
    if (!request) return null;

    Object.assign(request, updates, { updatedAt: new Date().toISOString() });

    if (notification && request.userId) {
      this.createNotification({
        userId: request.userId,
        type: 'custom_request',
        ...notification
      });
    }

    this.persist();
    return request;
  }

  // =========================================================
  // ZUXU REVIEWS
  // =========================================================

  getReviewsForProduct(productId) {
    return this.data.reviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getReviewsByUser(userId) {
    return this.data.reviews.filter((r) => String(r.userId) === String(userId));
  }

  findReview(userId, orderId, productId) {
    return (
      this.data.reviews.find(
        (r) =>
          String(r.userId) === String(userId) &&
          r.orderId === orderId &&
          r.productId === productId
      ) || null
    );
  }

  // { productId: { average, count } }
  getReviewSummary() {
    const summary = {};

    for (const review of this.data.reviews) {
      const entry = (summary[review.productId] ||= { total: 0, count: 0 });
      entry.total += Number(review.rating) || 0;
      entry.count += 1;
    }

    for (const [productId, entry] of Object.entries(summary)) {
      summary[productId] = {
        average: Math.round((entry.total / entry.count) * 10) / 10,
        count: entry.count
      };
    }

    return summary;
  }

  createReview(data) {
    const review = {
      id: `zx-rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...data
    };

    this.data.reviews.unshift(review);
    this.persist();
    return review;
  }

  deleteReview(id) {
    const index = this.data.reviews.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const [removed] = this.data.reviews.splice(index, 1);
    this.persist();
    return removed;
  }

  // =========================================================
  // DELIVERY & PACKING CHARGES
  // =========================================================

  getSettings() {
    const saved = this.data.settings || {};
    // Only known keys (older files may contain other fields).
    return Object.fromEntries(
      Object.keys(DEFAULT_SETTINGS).map(key => {
        const fallback = DEFAULT_SETTINGS[key];
        if (saved[key] === undefined) return [key, fallback];
        // Keep each setting's type (numbers vs. on/off switches).
        return [key, typeof fallback === 'boolean' ? saved[key] === true : Number(saved[key])];
      })
    );
  }

  updateSettings(updates) {
    this.data.settings = { ...this.getSettings(), ...updates };
    this.persist();
    return this.getSettings();
  }

  // Set extra fields on an order (delivery partner, timestamps…).
  updateOrderFields(orderId, fields) {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    Object.assign(order, fields);
    this.persist();
    return order;
  }

  // Delivery partner earnings = delivery charge of every order
  // they personally delivered.
  // Earnings from deleted orders: { 'YYYY-MM-DD': { deliveries, amount } }
  getArchivedEarnings(staffId) {
    return (this.data.earningsArchive || {})[String(staffId)] || {};
  }

  // =========================================================
  // DELETE ORDERS (admin)
  // ids: list of order ids. Their notifications go too; the delivery
  // partner's earnings from them are kept in earningsArchive.
  // A backup of db.json is saved first.
  // =========================================================

  deleteOrders(ids) {
    const wanted = new Set(ids.map(String));
    const toDelete = this.data.orders.filter(o => wanted.has(String(o.id)));

    if (toDelete.length === 0) return [];

    this.backupDataFile('before-delete-orders');

    this.data.earningsArchive ||= {};

    for (const order of toDelete) {
      if (order.status === 'delivered' && order.deliveredBy) {
        const date = order.deliveredAt
          ? new Date(new Date(order.deliveredAt).getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
          : 'unknown';
        const staff = (this.data.earningsArchive[String(order.deliveredBy)] ||= {});
        const day = (staff[date] ||= { deliveries: 0, amount: 0 });
        day.deliveries += 1;
        day.amount = Math.round((day.amount + (Number(order.deliveryFee) || 0)) * 100) / 100;
      }
    }

    const deletedIds = new Set(toDelete.map(o => String(o.id)));
    this.data.orders = this.data.orders.filter(o => !deletedIds.has(String(o.id)));
    this.data.notifications = this.data.notifications.filter(
      n => !n.orderId || !deletedIds.has(String(n.orderId))
    );

    this.persist();
    return toDelete.map(o => o.id);
  }

  getDeliveryEarnings(staffId) {
    return this.data.orders
      .filter(o => o.status === 'delivered' && String(o.deliveredBy || '') === String(staffId))
      .sort((a, b) => new Date(b.deliveredAt || b.updatedAt) - new Date(a.deliveredAt || a.updatedAt));
  }

  // =========================================================
  // HOMEPAGE BANNERS (null = use the app's default slides)
  // =========================================================

  getBanners() {
    return this.data.banners;
  }

  setBanners(slides) {
    this.data.banners = slides;
    this.persist();
    return this.data.banners;
  }

  // Update name / phone on a customer's orders that are still
  // in progress (so staff call the current number).
  updateActiveOrderContact(userId, { customerName, customerPhone }) {
    const finished = ['delivered', 'cancelled'];
    let changed = 0;

    for (const order of this.data.orders) {
      if (
        order.userId &&
        String(order.userId) === String(userId) &&
        !finished.includes(order.status)
      ) {
        if (customerName) order.customerName = customerName;
        if (customerPhone) order.customerPhone = customerPhone;
        order.updatedAt = new Date().toISOString();
        changed++;
      }
    }

    if (changed > 0) {
      this.persist();
    }

    return changed;
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

<<<<<<< HEAD
  // Notifications belonging to one signed-in customer
  getNotificationsForUser(userId) {
    return this.getNotifications().filter(
      n => n.userId && String(n.userId) === String(userId)
    );
  }

  markNotificationAsRead(
    id,
    userId
  ) {
    const notif =
      this.data.notifications.find(
        notification =>
          notification.id === id &&
          (userId === undefined ||
            String(notification.userId) === String(userId))
      );

    if (notif) {
      notif.isRead = true;

      this.persist();
    }

    return notif;
  }

  markAllNotificationsAsRead(userId) {
    this.data.notifications.forEach(
      notification => {
        if (
          userId === undefined ||
          String(notification.userId) === String(userId)
        ) {
          notification.isRead = true;
        }
      }
=======
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
>>>>>>> main
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

  getSellers() {
  return this.data.sellers || [];
}

getSellerByStoreId(storeId) {
  return this.getSellers().find(
    seller => seller.storeId === storeId
  ) || null;
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
