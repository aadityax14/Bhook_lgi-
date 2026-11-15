
import express from 'express';
import { store } from '../db/store.js';
import { requireRole } from '../middleware/auth.js';

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
  'seoDescription'
];

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

  return null;
};


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
        typeof imageUrl === 'string' && imageUrl.trim()
          ? imageUrl.trim()
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

    const newProduct = store.createProduct(productData);

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

    const updated = store.updateProduct(
      req.params.id,
      updates
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

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
    const success = store.deleteProduct(req.params.id);

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
