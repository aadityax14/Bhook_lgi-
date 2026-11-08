// Default data used to seed an empty database.

export const INITIAL_SELLERS = [
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

export const INITIAL_CATEGORIES = [
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

export const INITIAL_PRODUCTS = [
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
