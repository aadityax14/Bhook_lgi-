import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/db.json');

const INITIAL_CATEGORIES = [
  { id: 'all', name: 'All Items', slug: 'all', icon: '🔥' },
  { id: 'bhel', name: 'Bhel', slug: 'bhel', icon: '🥗' },
  { id: 'maggie', name: 'Maggie', slug: 'maggie', icon: '🍜' },
  { id: 'snacks', name: 'Snacks', slug: 'snacks', icon: '🍿' },
  { id: 'biscuits', name: 'Biscuits', slug: 'biscuits', icon: '🍪' },
  { id: 'cooked', name: 'Cooked', slug: 'cooked', icon: '🥡' },
  { id: 'uncooked', name: 'Uncooked', slug: 'uncooked', icon: '📦' }
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-bhel-half',
    categoryId: 'bhel',
    name: 'Half Bhel',
    description: 'Crispy puffed rice, tangy tamarind & spicy mint chutney, tossed with fresh chopped onions, tomatoes & nylon sev.',
    price: 35,
    isAvailable: true,
    isCooked: true,
    allowsSpiceCustomization: true,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
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
    description: 'Hostel special full portion! Loaded crispy bhel puri with roasted peanuts, sweet-tangy chutney, coriander & generous sev topping.',
    price: 65,
    isAvailable: true,
    isCooked: true,
    allowsSpiceCustomization: true,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
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
    description: 'Piping hot 2-minute masala Maggie prepared fresh in the hostel kitchen with aromatic spices and sweet corn notes.',
    price: 40,
    isAvailable: true,
    isCooked: true,
    allowsSpiceCustomization: true,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
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
    description: 'Original Nestle 70g Masala Maggie single pack with magic tastemaker sachet. Keep for late night kettle cooking.',
    price: 15,
    isAvailable: true,
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['maggie', 'uncooked', 'essential']
  },
  {
    id: 'prod-bingo-chips',
    categoryId: 'snacks',
    name: 'Bingo Mad Angles',
    description: 'Achaari Masti flavored crunchy triangle crisps. Perfect tangy punch for group study sessions.',
    price: 20,
    isAvailable: true,
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['snacks', 'uncooked', 'chips']
  },
  {
    id: 'prod-lays-magic-masala',
    categoryId: 'snacks',
    name: "Lay's India's Magic Masala",
    description: 'The legendary blue pack! Spicy and flavorful wavy potato chips made with authentic Indian spices.',
    price: 20,
    isAvailable: true,
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl: 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['snacks', 'uncooked', 'chips', 'bestseller']
  },
  {
    id: 'prod-lays-cream-onion',
    categoryId: 'snacks',
    name: "Lay's American Style Cream & Onion",
    description: 'Classic green pack! Rich sour cream and delicate herb-onion seasoning on ultra-thin crispy chips.',
    price: 20,
    isAvailable: true,
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['snacks', 'uncooked', 'chips']
  },
  {
    id: 'prod-lays-sizzling-hot',
    categoryId: 'snacks',
    name: "Lay's Sizzling Hot",
    description: 'Fiery chili crunch with an intense heat kick. Only for true spice warriors in the hostel.',
    price: 20,
    isAvailable: true,
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['snacks', 'uncooked', 'spicy']
  },
  {
    id: 'prod-parle-g',
    categoryId: 'biscuits',
    name: 'Parle-G Gold Biscuit',
    description: 'Hostel chai’s best friend! Golden baked glucose biscuits loaded with energy and nostalgia.',
    price: 10,
    isAvailable: true,
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    variants: [],
    addons: [],
    tags: ['biscuits', 'uncooked', 'classic']
  },
  {
    id: 'prod-oreo',
    categoryId: 'biscuits',
    name: 'Oreo Vanilla Creme',
    description: 'Rich dark chocolate cookies sandwiching sweet vanilla cream. Twist, lick, dunk in milk.',
    price: 30,
    isAvailable: true,
    isCooked: false,
    allowsSpiceCustomization: false,
    imageUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=600&q=80',
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
    message: 'Your Bhook_Lgi order #BL-1001 has been sent to the kitchen.',
    type: 'order_status',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
  },
  {
    id: 'notif-2',
    orderId: 'bl-ord-1001',
    title: 'Order Accepted! 🔥',
    message: 'Kitchen accepted your order. Cooking starting shortly!',
    type: 'order_status',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 'notif-3',
    orderId: 'bl-ord-1001',
    title: 'Preparing your food 🍜',
    message: 'Chef is preparing your spicy Bhel and Cheese Maggie.',
    type: 'order_status',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

class DataStore {
  constructor() {
    this.data = {
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      notifications: INITIAL_NOTIFICATIONS
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.persist();
      }
    } catch (err) {
      console.warn('Could not read persistent file store, using initial defaults:', err.message);
      this.persist();
    }
  }

  persist() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting data store:', err.message);
    }
  }

  // --- Products ---
  getProducts(categoryFilter, search) {
    let list = [...this.data.products];
    if (categoryFilter && categoryFilter !== 'all') {
      if (categoryFilter === 'cooked') {
        list = list.filter(p => p.isCooked);
      } else if (categoryFilter === 'uncooked') {
        list = list.filter(p => !p.isCooked);
      } else {
        list = list.filter(p => p.categoryId === categoryFilter);
      }
    }
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return list;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  createProduct(productData) {
    const newProduct = {
      id: `prod-${Date.now()}`,
      variants: [],
      addons: [],
      tags: [],
      isAvailable: true,
      isCooked: false,
      allowsSpiceCustomization: false,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...productData
    };
    this.data.products.unshift(newProduct);
    this.persist();
    return newProduct;
  }

  updateProduct(id, updates) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.data.products[idx];
  }

  deleteProduct(id) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Orders ---
  getOrders() {
    return [...this.data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getOrderById(id) {
    return this.data.orders.find(o => o.id === id || o.orderNumber === id);
  }

  createOrder(orderPayload) {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#BL-${randNum}`;
    const id = `bl-ord-${Date.now()}`;

    const newOrder = {
      id,
      orderNumber,
      customerName: orderPayload.customerName || 'Hostel Resident',
      customerPhone: orderPayload.customerPhone || '',
      hostel: orderPayload.hostel || 'GH4',
      roomNumber: orderPayload.roomNumber || '',
      deliveryType: orderPayload.deliveryType || 'room_delivery',
      deliveryNotes: orderPayload.deliveryNotes || '',
      items: orderPayload.items || [],
      subtotal: Number(orderPayload.subtotal) || 0,
      deliveryFee: Number(orderPayload.deliveryFee) || 0,
      packagingFee: Number(orderPayload.packagingFee) || 5,
      total: Number(orderPayload.total) || 0,
      status: 'placed',
      etaMinutes: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);

    // Create initial notification
    this.createNotification({
      orderId: newOrder.id,
      title: 'Order Placed! 🎉',
      message: `Your Bhook_Lgi order ${newOrder.orderNumber} is on its way to the kitchen.`,
      type: 'order_status'
    });

    this.persist();
    return newOrder;
  }

  updateOrderStatus(orderId, status) {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    // Map status to friendly notifications
    const statusNotifications = {
      accepted: {
        title: '🔥 Order Accepted!',
        message: `Your Bhook_Lgi order ${order.orderNumber} has been accepted by the kitchen.`
      },
      preparing: {
        title: '🍜 Order is Being Prepared!',
        message: `The kitchen is cooking your items fresh right now!`
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
        message: `Enjoy your meal! Cravings sorted by Bhook_Lgi.`
      },
      cancelled: {
        title: '❌ Order Cancelled',
        message: `Order ${order.orderNumber} was cancelled. Contact kitchen if this was a mistake.`
      }
    };

    if (statusNotifications[status]) {
      this.createNotification({
        orderId: order.id,
        title: statusNotifications[status].title,
        message: statusNotifications[status].message,
        type: 'order_status'
      });
    }

    this.persist();
    return order;
  }

  // --- Notifications ---
  getNotifications() {
    return [...this.data.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createNotification(notifData) {
    const notif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notifData
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  markNotificationAsRead(id) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.persist();
    }
    return notif;
  }

  markAllNotificationsAsRead() {
    this.data.notifications.forEach(n => (n.isRead = true));
    this.persist();
    return true;
  }

  // --- Categories ---
  getCategories() {
    return this.data.categories;
  }
}

export const store = new DataStore();
