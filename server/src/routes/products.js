
import express from 'express';
import { store } from '../db/store.js';
import { requireRole } from '../middleware/auth.js';
import { pool } from '../db/postgres.js';
import { saveImage, deleteImages, isUploadedImageUrl, UploadError } from '../services/uploads.js';

const router = express.Router();

// Creating, editing (prices, stock, images) and deleting products
// is admin-only. Reading the menu stays public.
const adminOnly = requireRole('ADMIN');

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

// Fields supported by the product manager.
// Existing Bhook_Lgi fields are retained.
const ADVANCED_PRODUCT_FIELDS = [
  'storeId',
  'sellerId',
  'productType',
  'images',
  'variants',
  'addons',
  // Hostels where this item can be ordered ([] = every hostel)
  'availableHostels',
  'customization',
  'customizationOptions',
  'specifications',
  'deliveryInfo',
  'tags',
  'isFeatured',
  'isActive',
  'mrp',
  'sku',
  'brand',
  'weight',
  'dimensions',
  'materials',
  'careInstructions',
  'returnPolicy',
  'estimatedDelivery',
  'seoTitle',
  'seoDescription',
  // Position on the customer menu (1 = shown first). Set by the admin.
  'displayOrder'
];

// =============================================================
// PRODUCT PHOTOS
// New photos arrive from the admin as compressed data URLs. They
// are saved as files under server/uploads. When a photo is removed
// or replaced (or the product is deleted) its old file is deleted
// for good, so only the current photos are kept.
// =============================================================

const PRODUCT_IMAGE_MAX_BYTES = 3 * 1024 * 1024; // 3 MB per photo

// "http://host:5000/api/uploads/x.jpg" → "/api/uploads/x.jpg"
const toStoredImage = (value) => {
  const text = String(value || '').trim();
  const match = /^https?:\/\/[^/]+(\/api\/uploads\/[^/?#]+)$/i.exec(text);
  return match && isUploadedImageUrl(match[1]) ? match[1] : text;
};

// Replace data-URL photos in `fields` with saved file URLs.
// `created` collects new files (deleted again if saving fails).
function storeProductImages(fields, created) {
  const saved = new Map(); // same photo sent twice → one file

  const convert = (value) => {
    const text = toStoredImage(value);

    if (!text.startsWith('data:image/')) return text;

    if (!saved.has(text)) {
      const url = saveImage(text, { maxBytes: PRODUCT_IMAGE_MAX_BYTES });
      created.push(url);
      saved.set(text, url);
    }

    return saved.get(text);
  };

  if (Array.isArray(fields.images)) {
    fields.images = fields.images.map(convert).filter(Boolean);
  }

  if (typeof fields.imageUrl === 'string' && fields.imageUrl.trim()) {
    fields.imageUrl = convert(fields.imageUrl);
  }
}

// Uploaded photo files a product uses.
const uploadedImagesOf = (product) =>
  [product?.imageUrl, ...(Array.isArray(product?.images) ? product.images : [])]
    .filter(isUploadedImageUrl);

// Delete photo files that no product or banner uses any more.
function deleteUnusedImages(urls) {
  if (!urls.length) return;

  const inUse = new Set(store.getProducts().flatMap(uploadedImagesOf));

  for (const banner of store.getBanners() || []) {
    if (isUploadedImageUrl(banner?.image)) inUse.add(banner.image);
  }

  deleteImages([...new Set(urls)].filter((url) => !inUse.has(url)));
}

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isArray = (value) => Array.isArray(value);

const validateNonNegativeNumber = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return {
      valid: false,
      error: `${fieldName} must be a valid non-negative number`
    };
  }

  return { valid: true, value: number };
};

const validateStock = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return {
      valid: false,
      error: `${fieldName} must be a whole number greater than or equal to 0`
    };
  }

  return { valid: true, value: number };
};

const pickAdvancedFields = (body) => {
  const fields = {};

  for (const field of ADVANCED_PRODUCT_FIELDS) {
    if (body[field] !== undefined) {
      fields[field] = body[field];
    }
  }

  return fields;
};

// Validate advanced product data.
const validateAdvancedFields = (data) => {
  const arrayFields = ['images', 'variants', 'addons', 'availableHostels', 'customizationOptions', 'tags'];

  for (const field of arrayFields) {
    if (data[field] !== undefined && !isArray(data[field])) {
      return `${field} must be an array`;
    }
  }

  const objectFields = [
    'customization',
    'specifications',
    'deliveryInfo'
  ];

  for (const field of objectFields) {
    if (data[field] !== undefined && !isObject(data[field])) {
      return `${field} must be an object`;
    }
  }

  if (data.mrp !== undefined) {
    const result = validateNonNegativeNumber(data.mrp, 'MRP');

    if (!result.valid) return result.error;

    data.mrp = result.value;
  }

  if (data.images) {
    for (const image of data.images) {
      if (typeof image !== 'string' || !image.trim()) {
        return 'Every product image must be a valid string';
      }
    }
  }

  if (data.variants) {
    for (const variant of data.variants) {
      if (!isObject(variant)) {
        return 'Every variant must be an object';
      }

      if (variant.price !== undefined) {
        const result = validateNonNegativeNumber(
          variant.price,
          'Variant price'
        );

        if (!result.valid) return result.error;

        variant.price = result.value;
      }

      if (variant.stock !== undefined) {
        const result = validateStock(
          variant.stock,
          'Variant stock'
        );

        if (!result.valid) return result.error;

        variant.stock = result.value;
      }
    }
  }

  // Hostels where the item is sold (empty list = all hostels)
  if (data.availableHostels) {
    const hostels = [...new Set(
      // "gh 2" → "GH2"
      data.availableHostels.map(h => String(h || '').replace(/\s+/g, '').toUpperCase()).filter(Boolean)
    )];

    if (hostels.length > 30 || hostels.some(h => h.length > 20)) {
      return 'Invalid hostel list';
    }

    data.availableHostels = hostels;
  }

  // Extras such as "Extra Crispy Sev" (+₹5)
  if (data.addons) {
    const seenIds = new Set();

    for (const addon of data.addons) {
      if (!isObject(addon)) {
        return 'Every extra must be an object';
      }

      addon.name = String(addon.name || '').trim();

      if (!addon.name) {
        return 'Every extra needs a name';
      }

      const result = validateNonNegativeNumber(
        addon.price ?? 0,
        `Price of "${addon.name}"`
      );

      if (!result.valid) return result.error;

      addon.price = result.value;

      // Stable id used by the cart to tell extras apart.
      let id = String(addon.id || '').trim() ||
        `extra-${addon.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

      while (seenIds.has(id)) {
        id = `${id}-x`;
      }

      seenIds.add(id);
      addon.id = id;
    }
  }

  // Menu position: whole number 1–9999, or null to clear it
  if (data.displayOrder !== undefined) {
    if (data.displayOrder === null || data.displayOrder === '') {
      data.displayOrder = null;
    } else {
      const order = Number(data.displayOrder);

      if (!Number.isInteger(order) || order < 1 || order > 9999) {
        return 'Display order must be a whole number from 1 to 9999';
      }

      data.displayOrder = order;
    }
  }

  return null;
};


// PUT /api/products/kitchen-plan  { assignments: { productId: chefId | null } }
// (admin) Which chef makes which item. One chef can make many items;
// null = any chef on duty.
router.put('/kitchen-plan', adminOnly, async (req, res) => {
  try {
    const assignments = req.body?.assignments;

    if (!assignments || typeof assignments !== 'object' || Array.isArray(assignments)) {
      return res.status(400).json({ success: false, error: 'assignments must be an object' });
    }

    const clean = {};

    for (const [productId, chefId] of Object.entries(assignments)) {
      if (!store.getProductById(productId)) {
        return res.status(400).json({ success: false, error: 'Some products no longer exist. Refresh and try again.' });
      }
      clean[productId] = chefId ? String(chefId) : null;
    }

    const chefIds = [...new Set(Object.values(clean).filter(Boolean))];

    if (chefIds.length > 0) {
      const result = await pool.query(
        `SELECT id::text AS id FROM staff_accounts
          WHERE role = 'CHEF' AND is_active = TRUE AND id::text = ANY($1::text[])`,
        [chefIds]
      );
      const found = new Set(result.rows.map((row) => row.id));

      if (chefIds.some((id) => !found.has(id))) {
        return res.status(400).json({ success: false, error: 'One of the chefs is disabled or no longer exists.' });
      }
    }

    store.setKitchenPlan(clean);

    res.json({ success: true, message: 'Kitchen plan saved', data: store.getProducts() });
  } catch (err) {
    console.error('KITCHEN PLAN ERROR:', err);
    res.status(500).json({ success: false, error: 'Could not save the kitchen plan' });
  }
});


// PUT /api/products/display-order  { ids: [...] }  (admin)
// The admin's chosen order for the customer menu: the first id is
// shown first. Products not in the list keep their place after these.
router.put('/display-order', adminOnly, (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? [...new Set(req.body.ids.map(String))]
      : null;

    if (!ids || ids.length > 1000) {
      return res.status(400).json({ success: false, error: 'ids must be a list of product ids' });
    }

    const unknown = ids.filter((id) => !store.getProductById(id));

    if (unknown.length > 0) {
      return res.status(400).json({ success: false, error: 'Some products no longer exist. Refresh and try again.' });
    }

    store.setDisplayOrder(ids);

    res.json({ success: true, message: 'Menu order saved', data: store.getProducts() });
  } catch (err) {
    console.error('DISPLAY ORDER ERROR:', err);
    res.status(500).json({ success: false, error: 'Could not save the menu order' });
  }
});


// GET /api/categories
router.get('/categories', (req, res) => {
  try {
    const categories = store.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// GET /api/products
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;

    const products = store.getProducts(category, search);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = store.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// POST /api/products
router.post('/', adminOnly, (req, res) => {
  try {
    const body = req.body || {};

    const {
      name,
      price,
      categoryId,
      description,
      imageUrl,
      isCooked,
      allowsSpiceCustomization,
      isAvailable,
      stockQuantity,
      stockHalfUnits
    } = body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name and price are required'
      });
    }

    const cleanName = String(name).trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        error: 'Product name cannot be empty'
      });
    }

    const priceResult = validateNonNegativeNumber(price, 'Price');

    if (!priceResult.valid) {
      return res.status(400).json({
        success: false,
        error: priceResult.error
      });
    }

    const advancedFields = pickAdvancedFields(body);
    const advancedError = validateAdvancedFields(advancedFields);

    if (advancedError) {
      return res.status(400).json({
        success: false,
        error: advancedError
      });
    }

    let cleanStockQuantity;
    let cleanStockHalfUnits;

    if (stockQuantity !== undefined) {
      const result = validateStock(stockQuantity, 'Stock');
      if (!result.valid) {
        return res.status(400).json({ success: false, error: result.error });
      }
    }

    if (stockHalfUnits !== undefined) {
      const result = validateStock(stockHalfUnits, 'Bhel stock');
      if (!result.valid) {
        return res.status(400).json({ success: false, error: result.error });
      }
    }

    // Save new photos as files (only after all checks passed).
    const createdImages = [];
    const imageFields = { images: advancedFields.images, imageUrl };

    try {
      storeProductImages(imageFields, createdImages);
    } catch (error) {
      if (error instanceof UploadError) {
        return res.status(400).json({ success: false, error: error.message });
      }
      throw error;
    }

    if (imageFields.images !== undefined) {
      advancedFields.images = imageFields.images;
    }

    if (stockQuantity !== undefined) {
      const result = validateStock(stockQuantity, 'Stock');

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      cleanStockQuantity = result.value;
    }

    if (stockHalfUnits !== undefined) {
      const result = validateStock(stockHalfUnits, 'Bhel stock');

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      cleanStockHalfUnits = result.value;
    }

    const productData = {
      ...advancedFields,

      name: cleanName,
      price: priceResult.value,
      categoryId: categoryId || 'snacks',
      description: description || '',

      imageUrl:
        typeof imageFields.imageUrl === 'string' && imageFields.imageUrl.trim()
          ? imageFields.imageUrl.trim()
          : advancedFields.images?.[0] || DEFAULT_IMAGE,

      isCooked: Boolean(isCooked),

      allowsSpiceCustomization: Boolean(
        allowsSpiceCustomization
      ),

      isAvailable:
        isAvailable !== undefined
          ? Boolean(isAvailable)
          : true,

      stockQuantity: cleanStockQuantity,
      stockHalfUnits: cleanStockHalfUnits
    };

    let newProduct;

    try {
      newProduct = store.createProduct(productData);
    } catch (error) {
      deleteImages(createdImages);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// PATCH /api/products/:id
router.patch('/:id', adminOnly, (req, res) => {
  try {
    const product = store.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const updates = { ...(req.body || {}) };

    // PRICE
    if (updates.price !== undefined) {
      const result = validateNonNegativeNumber(
        updates.price,
        'Price'
      );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      updates.price = result.value;
    }

    // MRP
    if (updates.mrp !== undefined) {
      const result = validateNonNegativeNumber(
        updates.mrp,
        'MRP'
      );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      updates.mrp = result.value;
    }

    // NORMAL STOCK
    if (updates.stockQuantity !== undefined) {
      const result = validateStock(
        updates.stockQuantity,
        'Stock'
      );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      updates.stockQuantity = result.value;

      if (updates.isAvailable === undefined) {
        updates.isAvailable = result.value > 0;
      }
    }

    // BHEL SHARED STOCK
    if (updates.stockHalfUnits !== undefined) {
      const result = validateStock(
        updates.stockHalfUnits,
        'Bhel stock'
      );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      updates.stockHalfUnits = result.value;

      if (updates.isAvailable === undefined) {
        updates.isAvailable = result.value > 0;
      }
    }

    // NAME
    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();

      if (!updates.name) {
        return res.status(400).json({
          success: false,
          error: 'Product name cannot be empty'
        });
      }
    }

    // IMAGE URL
    if (updates.imageUrl !== undefined) {
      if (
        typeof updates.imageUrl !== 'string' ||
        !updates.imageUrl.trim()
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image'
        });
      }

      updates.imageUrl = updates.imageUrl.trim();
    }

    // ADVANCED PRODUCT FIELDS
    const advancedFields = {};

    for (const field of ADVANCED_PRODUCT_FIELDS) {
      if (updates[field] !== undefined) {
        advancedFields[field] = updates[field];
      }
    }

    const advancedError = validateAdvancedFields(advancedFields);

    if (advancedError) {
      return res.status(400).json({
        success: false,
        error: advancedError
      });
    }

    // Use normalized advanced values.
    Object.assign(updates, advancedFields);

    // New photos → files. Remember the old ones so any photo that
    // was removed or replaced can be deleted afterwards.
    const previousImages = uploadedImagesOf(product);
    const createdImages = [];

    try {
      storeProductImages(updates, createdImages);
    } catch (error) {
      if (error instanceof UploadError) {
        return res.status(400).json({ success: false, error: error.message });
      }
      throw error;
    }

    let updated;

    try {
      updated = store.updateProduct(
        req.params.id,
        updates
      );
    } catch (error) {
      deleteImages(createdImages);
      throw error;
    }

    if (!updated) {
      deleteImages(createdImages);
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Permanently delete photos this product no longer shows.
    const currentImages = new Set(uploadedImagesOf(updated));
    deleteUnusedImages(previousImages.filter((url) => !currentImages.has(url)));

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// DELETE /api/products/:id
router.delete('/:id', adminOnly, (req, res) => {
  try {
    const photos = uploadedImagesOf(store.getProductById(req.params.id));
    const success = store.deleteProduct(req.params.id);

    // The product's photo files go too.
    if (success) {
      deleteUnusedImages(photos);
    }

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (err) {
    console.error('DELETE PRODUCT ERROR:', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
