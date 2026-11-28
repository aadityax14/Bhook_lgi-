import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WhatsAppNotificationService } from '../services/whatsappService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/db.json');

const INITIAL_SELLERS = [
  {
    id: 'seller-bhook-lgi',
    storeId: 'store-bhook-lgi',
    name: 'Bhook_Lgi Official',
    handle: 'bhook_lgi',
    category: 'Food & Snacks',
    description: 'Late night student hostel kitchen - Fresh Bhel, piping hot Maggi & snacks.',
    avatar: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    whatsapp: {
      number: '+919999988888',
      notifyOnNewOrder: true,
      notifyOnStatusChange: true
    },
    commissionRate: 0.05,
    createdAt: new Date('2026-09-01T00:00:00.000Z').toISOString()
  },
  {
    id: 'seller-zuxu',
    storeId: 'store-zuxu',
    name: 'Zuxu',
    handle: 'zuxu',
    category: 'Handmade Gifts & Accessories',
    description: 'Handcrafted with love for students. Cute hairpins, rings, earrings, keychains, crochet gifts & custom bouquets.',
    avatar: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    whatsapp: {
      number: '+919876543210',
      notifyOnNewOrder: true,
      notifyOnStatusChange: true
    },
    commissionRate: 0.10,
    createdAt: new Date('2026-09-15T00:00:00.000Z').toISOString()
  }
];

const INITIAL_CATEGORIES = [
  { id: 'all', name: 'All Items', slug: 'all', icon: '🔥' },
  { id: 'bhel', name: 'Bhel', slug: 'bhel', icon: '🥗' },
  { id: 'maggie', name: 'Maggie', slug: 'maggie', icon: '🍜' },
  { id: 'snacks', name: 'Snacks', slug: 'snacks', icon: '🍿' },
  { id: 'biscuits', name: 'Biscuits', slug: 'biscuits', icon: '🍪' },
  { id: 'cooked', name: 'Cooked', slug: 'cooked', icon: '🥡' },
  { id: 'uncooked', name: 'Uncooked', slug: 'uncooked', icon: '📦' },
  { id: 'accessories', name: 'Accessories', slug: 'accessories', icon: '✨' },
  { id: 'crochet', name: 'Crochet Crafts', slug: 'crochet', icon: '🧶' },
  { id: 'jewelry', name: 'Jewelry', slug: 'jewelry', icon: '💍' },
  { id: 'bouquets', name: 'Bouquets', slug: 'bouquets', icon: '💐' },
  { id: 'gifts', name: 'Gifts & Sets', slug: 'gifts', icon: '🎁' }
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-bhel-half',
    categoryId: 'bhel',
    name: 'Half Bhel',
    description:
      'Crispy puffed rice, tangy tamarind & spicy mint chutney, tossed with fresh chopped onions, tomatoes & nylon sev.',
    price: 35,
    isAvailable: true,

    // IMPORTANT:
    // This field now stores SHARED BHEL quantity.
    // 1 Shared = 1 Full OR 2 Half.
    stockHalfUnits: 2,

    stockType: 'bhel',
    isCooked: false,
    allowsSpiceCustomization: true,
    imageUrl:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    variants: [
      { name: 'Half Bhel (Regular)', price: 35 }
    ],
    addons: [
      { id: 'extra-sev', name: 'Extra Crispy Sev', price: 5 },
      { id: 'extra-onion', name: 'Extra Chopped Onions', price: 5 }
    ],
    tags: ['bhel', 'cooked', 'popular', 'snack']
  },

  {
    id: 'prod-bhel-full',
    categoryId: 'bhel',
    name: 'Full Bhel',
    description:
      'Hostel special full portion! Loaded crispy bhel puri with roasted peanuts, sweet-tangy chutney, coriander & generous sev topping.',
    price: 65,
    isAvailable: true,

    // Shared Bhel quantity
    stockHalfUnits: 2,

    stockType: 'bhel',
    isCooked: false,
    allowsSpiceCustomization: true,
    imageUrl:
      'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    variants: [
      { name: 'Full Bhel (Loaded)', price: 65 }
    ],
    addons: [
      { id: 'extra-sev', name: 'Extra Crispy Sev', price: 5 },
      { id: 'extra-peanuts', name: 'Roasted Spiced Peanuts', price: 10 }
    ],
    tags: ['bhel', 'cooked', 'bestseller']
  },

  {
    id: 'prod-maggie-cooked',
    categoryId: 'maggie',
    name: 'Cooked Maggie',
    description:
      'Piping hot 2-minute masala Maggie prepared fresh in the hostel kitchen with aromatic spices and sweet corn notes.',
    price: 40,
    isAvailable: true,
    stockQuantity: 10,
    stockType: 'normal',
    isCooked: true,
    allowsSpiceCustomization: true,
    imageUrl:
      'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
    variants: [
      { name: 'Single Bowl', price: 40 },
      { name: 'Double Masala Bowl', price: 70 }
    ],
    addons: [
      { id: 'extra-cheese', name: 'Melted Amul Cheese Cube', price: 15 },
      { id: 'extra-butter', name: 'Amul Butter Dollop', price: 10 },
      { id: 'peri-peri', name: 'Peri Peri Masala Sprinkle', price: 5 }
    ],
    tags: ['maggie', 'cooked', 'bestseller', 'midnight-craving']
  },

  {
    id: 'prod-maggie-packet',
    categoryId: 'maggie',
    name: 'Maggie Packet (Raw)',
    description:
      'Original Nestle 70g Masala Maggie single pack with magic tastemaker sachet. Keep for late night kettle cooking.',
    price: 15,
    isAvailable: true,
    stockQuantity: 10,
    stockType: 'normal',
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['maggie', 'uncooked', 'essential']
  },

  {
    id: 'prod-bingo-chips',
    categoryId: 'snacks',
    name: 'Bingo Mad Angles',
    description:
      'Achaari Masti flavored crunchy triangle crisps. Perfect tangy punch for group study sessions.',
    price: 20,
    isAvailable: true,
    stockQuantity: 10,
    stockType: 'normal',
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl:
      'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['snacks', 'uncooked', 'chips']
  },

  {
    id: 'prod-lays-magic-masala',
    categoryId: 'snacks',
    name: "Lay's India's Magic Masala",
    description:
      'The legendary blue pack! Spicy and flavorful wavy potato chips made with authentic Indian spices.',
    price: 20,
    isAvailable: true,
    stockQuantity: 10,
    stockType: 'normal',
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl:
      'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['snacks', 'uncooked', 'chips', 'bestseller']
  },

  {
    id: 'prod-lays-cream-onion',
    categoryId: 'snacks',
    name: "Lay's American Style Cream & Onion",
    description:
      'Classic green pack! Rich sour cream and delicate herb-onion seasoning on ultra-thin crispy chips.',
    price: 20,
    isAvailable: true,
    stockQuantity: 10,
    stockType: 'normal',
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl:
      'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['snacks', 'uncooked', 'chips']
  },

  {
    id: 'prod-lays-sizzling-hot',
    categoryId: 'snacks',
    name: "Lay's Sizzling Hot",
    description:
      'Fiery chili crunch with an intense heat kick. Only for true spice warriors in the hostel.',
    price: 20,
    isAvailable: true,
    stockQuantity: 10,
    stockType: 'normal',
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl:
      'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['snacks', 'uncooked', 'spicy']
  },

  {
    id: 'prod-parle-g',
    categoryId: 'biscuits',
    name: 'Parle-G Gold Biscuit',
    description:
      'Hostel chai’s best friend! Golden baked glucose biscuits loaded with energy and nostalgia.',
    price: 10,
    isAvailable: true,
    stockQuantity: 10,
    stockType: 'normal',
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl:
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['biscuits', 'uncooked', 'classic']
  },

  {
    id: 'prod-oreo',
    categoryId: 'biscuits',
    name: 'Oreo Vanilla Creme',
    description:
      'Rich dark chocolate cookies sandwiching sweet vanilla cream. Twist, lick, dunk in milk.',
    price: 30,
    isAvailable: true,
    stockQuantity: 10,
    stockType: 'normal',
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl:
      'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['biscuits', 'uncooked', 'sweet']
  }
];

const INITIAL_ORDERS = [
  {
    id: 'bl-ord-1001',
    orderNumber: '#BL-1001',
    customerName: 'Aaditya Yadav',
    customerPhone: '9876543210',
    hostel: 'GH4',
    roomNumber: '312',
    deliveryType: 'room_delivery',
    deliveryNotes: 'Please call when you reach 3rd floor corridor.',
    items: [
      {
        productId: 'prod-bhel-full',
        productName: 'Full Bhel',
        variant: 'Full Bhel (Loaded)',
        spiceLevel: 'spicy',
        addons: ['Extra Crispy Sev'],
        quantity: 1,
        priceAtOrder: 70,
        itemTotal: 70
      },
      {
        productId: 'prod-maggie-cooked',
        productName: 'Cooked Maggie',
        variant: 'Single Bowl',
        spiceLevel: 'spicy',
        addons: ['Melted Amul Cheese Cube'],
        quantity: 1,
        priceAtOrder: 55,
        itemTotal: 55
      }
    ],
    subtotal: 125,
    deliveryFee: 10,
    packagingFee: 5,
    total: 140,
    status: 'preparing',
    stockDeducted: false,
    etaMinutes: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    orderId: 'bl-ord-1001',
    title: 'Order Placed! 🎉',
    message:
      'Your Bhook_Lgi order #BL-1001 has been sent to the kitchen.',
    type: 'order_status',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
  },
  {
    id: 'notif-2',
    orderId: 'bl-ord-1001',
    title: 'Order Accepted! 🔥',
    message:
      'Kitchen accepted your order. Cooking starting shortly!',
    type: 'order_status',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 'notif-3',
    orderId: 'bl-ord-1001',
    title: 'Preparing your food 🍜',
    message:
      'Chef is preparing your spicy Bhel and Cheese Maggie.',
    type: 'order_status',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

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
      trackingAd: null,
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

  // Zuxu advertisement above order tracking (null = app default)
  trackingAd:
    savedData.trackingAd && typeof savedData.trackingAd === 'object'
      ? savedData.trackingAd
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

  // =========================================================
  // PRODUCTS
  // =========================================================

  getProducts(categoryFilter, search) {
    let list = [...this.data.products];

    if (
      categoryFilter &&
      categoryFilter !== 'all'
    ) {
      if (categoryFilter === 'cooked') {
        list = list.filter(
          product => product.isCooked
        );
      } else if (categoryFilter === 'uncooked') {
        list = list.filter(
          product => !product.isCooked
        );
      } else {
        list = list.filter(
          product =>
            product.categoryId === categoryFilter
        );
      }
    }

    if (search) {
      const q = search.toLowerCase().trim();

      list = list.filter(product =>
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        (
          product.tags &&
          product.tags.some(tag =>
            tag.toLowerCase().includes(q)
          )
        )
      );
    }

    // The admin's menu order first (displayOrder 1, 2, 3…), then
    // every other product in its usual order.
    const rank = (product) => {
      const order = Number(product.displayOrder);
      return product.displayOrder != null && Number.isFinite(order) ? order : Infinity;
    };

    return list
      .map((product, index) => ({ product, index }))
      .sort((a, b) => (rank(a.product) - rank(b.product)) || (a.index - b.index))
      .map(({ product }) => product);
  }

  // Kitchen plan: which chef makes which product.
  // assignments: { productId: chefId | null }
  setKitchenPlan(assignments) {
    const now = new Date().toISOString();

    for (const product of this.data.products) {
      if (!Object.prototype.hasOwnProperty.call(assignments, product.id)) continue;

      const next = assignments[product.id] ? String(assignments[product.id]) : null;

      if ((product.chefId ?? null) !== next) {
        product.chefId = next;
        product.updatedAt = now;
      }
    }

    this.persist();
  }

  // ids: products in the order customers should see them.
  // Products not listed lose any previous position.
  setDisplayOrder(ids) {
    const position = new Map(ids.map((id, index) => [String(id), index + 1]));
    const now = new Date().toISOString();

    for (const product of this.data.products) {
      const next = position.get(String(product.id)) ?? null;

      if ((product.displayOrder ?? null) !== next) {
        product.displayOrder = next;
        product.updatedAt = now;
      }
    }

    this.persist();
  }

  getProductById(id) {
    return this.data.products.find(
      product => product.id === id
    );
  }

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
      );

    if (idx === -1) {
      return null;
    }

    const currentProduct =
      this.data.products[idx];

    const cleanedUpdates = {
      ...updates
    };

    // ---------------------------------------------------------
    // NORMAL STOCK
    // ---------------------------------------------------------

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
        }

        product.stockType = 'bhel';

        product.stockHalfUnits =
          newStock;

        product.isAvailable =
          newStock > 0;

        product.updatedAt = now;
      });

      this.persist();

      return this.data.products[idx];
    }

    // ---------------------------------------------------------
    // NORMAL PRODUCT UPDATE
    // ---------------------------------------------------------

    this.data.products[idx] = {
      ...currentProduct,
      ...cleanedUpdates,
      updatedAt:
        new Date().toISOString()
    };

    this.persist();

    return this.data.products[idx];
  }

  deleteProduct(id) {
    const idx =
      this.data.products.findIndex(
        product => product.id === id
      );

    if (idx === -1) {
      return false;
    }

    this.data.products.splice(idx, 1);

    this.persist();

    return true;
  }

  // =========================================================
  // INVENTORY HELPERS
  // =========================================================

  isBhelProduct(productId) {
    return (
      productId === 'prod-bhel-half' ||
      productId === 'prod-bhel-full'
    );
  }

  getBhelProducts() {
    return this.data.products.filter(
      product =>
        product.id === 'prod-bhel-half' ||
        product.id === 'prod-bhel-full'
    );
  }

  // IMPORTANT:
  // This value is SHARED BHEL quantity.
  //
  // Shared 1 = 1 Full = 2 Half.
  //
  getBhelStockHalfUnits() {
    const bhelProducts =
      this.getBhelProducts();

    if (bhelProducts.length === 0) {
      return 0;
    }

    return Math.max(
      ...bhelProducts.map(
        product =>
          Number(product.stockHalfUnits) || 0
      )
    );
  }

  syncBhelStock() {
    const sharedQuantity =
      this.getBhelStockHalfUnits();

    const now =
      new Date().toISOString();

    this.data.products.forEach(product => {
      if (!this.isBhelProduct(product.id)) {
        return;
      }

      product.stockType = 'bhel';

      product.stockHalfUnits =
        sharedQuantity;

      product.isAvailable =
        sharedQuantity > 0;

      product.updatedAt = now;
    });
  }

  // =========================================================
  // AVAILABLE QUANTITY
  // =========================================================

  getProductAvailableQuantity(productId) {
    const product =
      this.getProductById(productId);

    if (!product) {
      return 0;
    }

    // BHEL
    if (this.isBhelProduct(productId)) {
      const sharedQuantity =
        this.getBhelStockHalfUnits();

      // 1 Shared = 1 Full
      if (
        productId === 'prod-bhel-full'
      ) {
        return sharedQuantity;
      }

      // 1 Shared = 2 Half
      if (
        productId === 'prod-bhel-half'
      ) {
        return sharedQuantity * 2;
      }
    }

    // NORMAL PRODUCT
    return Math.max(
      0,
      Number(product.stockQuantity) || 0
    );
  }

  // =========================================================
  // CHECK ORDER STOCK
  // =========================================================

  checkOrderStock(items) {
    let bhelRequiredShared = 0;

    const normalRequirements = {};

    // ---------------------------------------------------------
    // Calculate required stock
    // ---------------------------------------------------------

    for (const item of items) {
      const product =
        this.getProductById(
          item.productId
        );

      if (!product) {
        return {
          ok: false,
          error:
            `Product not found: ${item.productId}`
        };
      }

      const quantity =
        Math.max(
          1,
          Number(item.quantity) || 1
        );

      // -------------------------------------------------------
      // BHEL
      // -------------------------------------------------------

      if (
        this.isBhelProduct(
          item.productId
        )
      ) {
        if (
          item.productId ===
          'prod-bhel-full'
        ) {
          // 1 Full = 1 Shared
          bhelRequiredShared +=
            quantity;
        } else {
          // 2 Half = 1 Shared
          bhelRequiredShared +=
            quantity / 2;
        }

        continue;
      }

      // -------------------------------------------------------
      // NORMAL
      // -------------------------------------------------------

      normalRequirements[
        item.productId
      ] =
        (
          normalRequirements[
            item.productId
          ] || 0
        ) + quantity;
    }

    // ---------------------------------------------------------
    // CHECK BHEL
    // ---------------------------------------------------------

    if (bhelRequiredShared > 0) {
      const availableShared =
        this.getBhelStockHalfUnits();

      if (
        bhelRequiredShared >
        availableShared
      ) {
        const availableHalf =
          availableShared * 2;

        return {
          ok: false,
          error:
            availableShared === 0
              ? 'Bhel is currently Out of Stock.'
              : `Not enough Bhel stock. Available: ${availableShared} Full Bhel or ${availableHalf} Half Bhel.`
        };
      }
    }

    // ---------------------------------------------------------
    // CHECK NORMAL PRODUCTS
    // ---------------------------------------------------------

    for (const [
      productId,
      requiredQuantity
    ] of Object.entries(
      normalRequirements
    )) {
      const available =
        this.getProductAvailableQuantity(
          productId
        );

      const product =
        this.getProductById(
          productId
        );

      if (
        requiredQuantity >
        available
      ) {
        return {
          ok: false,
          error:
            `"${product.name}" has only ${available} left in stock.`
        };
      }
    }

    return {
      ok: true
    };
  }

  // =========================================================
  // DEDUCT STOCK
  // =========================================================

  deductStockForOrder(items) {
    const stockCheck =
      this.checkOrderStock(items);

    if (!stockCheck.ok) {
      return stockCheck;
    }

    let bhelRequiredShared = 0;

    // ---------------------------------------------------------
    // Calculate BHEL requirement
    // ---------------------------------------------------------

    for (const item of items) {
      if (
        !this.isBhelProduct(
          item.productId
        )
      ) {
        continue;
      }

      const quantity =
        Math.max(
          1,
          Number(item.quantity) || 1
        );

      if (
        item.productId ===
        'prod-bhel-full'
      ) {
        // 1 Full = 1 Shared
        bhelRequiredShared +=
          quantity;
      } else {
        // 2 Half = 1 Shared
        bhelRequiredShared +=
          quantity / 2;
      }
    }

    // ---------------------------------------------------------
    // DEDUCT NORMAL PRODUCTS
    // ---------------------------------------------------------

    for (const item of items) {
      if (
        this.isBhelProduct(
          item.productId
        )
      ) {
        continue;
      }

      const product =
        this.getProductById(
          item.productId
        );

      if (!product) {
        continue;
      }

      const quantity =
        Math.max(
          1,
          Number(item.quantity) || 1
        );

      product.stockQuantity =
        Math.max(
          0,
          (
            Number(
              product.stockQuantity
            ) || 0
          ) - quantity
        );

      product.isAvailable =
        product.stockQuantity > 0;

      product.stockType = 'normal';

      product.updatedAt =
        new Date().toISOString();
    }

    // ---------------------------------------------------------
    // DEDUCT SHARED BHEL
    // ---------------------------------------------------------

    if (bhelRequiredShared > 0) {
      const currentShared =
        this.getBhelStockHalfUnits();

      const newShared =
        Math.max(
          0,
          currentShared -
            bhelRequiredShared
        );

      const now =
        new Date().toISOString();

      this.data.products.forEach(
        product => {
          if (
            !this.isBhelProduct(
              product.id
            )
          ) {
            return;
          }

          product.stockType = 'bhel';

          // Store SHARED quantity.
          product.stockHalfUnits =
            newShared;

          product.isAvailable =
            newShared > 0;

          product.updatedAt = now;
        }
      );
    }

    this.persist();

    return {
      ok: true
    };
  }

  // =========================================================
  // ORDERS
  // =========================================================

  getOrders() {
    return [...this.data.orders].sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
  }

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

      type: 'order_status'
    });

    this.persist();

    return newOrder;
  }

  updateOrderStatus(
    orderId,
    status
  ) {
    const order =
      this.getOrderById(orderId);

    if (!order) {
      return null;
    }

    // ---------------------------------------------------------
    // DEDUCT STOCK WHEN ACCEPTED
    // ---------------------------------------------------------

    if (
      status === 'accepted' &&
      !order.stockDeducted
    ) {
      const stockResult =
        this.deductStockForOrder(
          order.items || []
        );

      if (!stockResult.ok) {
        throw new Error(
          stockResult.error
        );
      }

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

  // Zuxu ad above the customer's order tracking (null = app default)
  getTrackingAd() {
    return this.data.trackingAd || null;
  }

  setTrackingAd(ad) {
    this.data.trackingAd = ad;
    this.persist();
    return this.data.trackingAd;
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

  getNotifications() {
    return [
      ...this.data.notifications
    ].sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );
  }

  createNotification(
    notifData
  ) {
    const notif = {
      id:
        `notif-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 4)}`,

      isRead: false,

      createdAt:
        new Date().toISOString(),

      ...notifData
    };

    this.data.notifications.unshift(
      notif
    );

    this.persist();

    return notif;
  }

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
    );

    this.persist();

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

  getCategories() {
    return this.data.categories;
  }
}

export const store =
  new DataStore();