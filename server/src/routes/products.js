import express from 'express';
import { store } from '../db/store.js';

const router = express.Router();

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
router.post('/', (req, res) => {
  try {
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
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name and price are required'
      });
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be a valid positive number'
      });
    }

    const newProduct = store.createProduct({
      name: name.trim(),

      price: numericPrice,

      categoryId: categoryId || 'snacks',

      description: description || '',

      imageUrl:
        imageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',

      isCooked: Boolean(isCooked),

      allowsSpiceCustomization: Boolean(
        allowsSpiceCustomization
      ),

      isAvailable:
        isAvailable !== undefined
          ? Boolean(isAvailable)
          : true,

      stockQuantity:
        stockQuantity !== undefined
          ? Math.max(0, Number(stockQuantity))
          : undefined,

      stockHalfUnits:
        stockHalfUnits !== undefined
          ? Math.max(0, Number(stockHalfUnits))
          : undefined
    });

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
router.patch('/:id', (req, res) => {
  try {
    const product = store.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const updates = { ...req.body };

    // PRICE
    if (updates.price !== undefined) {
      const price = Number(updates.price);

      if (Number.isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid price'
        });
      }

      updates.price = price;
    }

    // NORMAL STOCK
    if (updates.stockQuantity !== undefined) {
      const stock = Number(updates.stockQuantity);

      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          error: 'Stock must be a whole number greater than or equal to 0'
        });
      }

      updates.stockQuantity = stock;

      // Automatically control availability
      if (updates.isAvailable === undefined) {
        updates.isAvailable = stock > 0;
      }
    }

    // BHEL SHARED STOCK
    if (updates.stockHalfUnits !== undefined) {
      const stock = Number(updates.stockHalfUnits);

      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          error: 'Bhel stock must be a whole number greater than or equal to 0'
        });
      }

      updates.stockHalfUnits = stock;

      if (updates.isAvailable === undefined) {
        updates.isAvailable = stock > 0;
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

    // IMAGE
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
router.delete('/:id', (req, res) => {
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
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


export default router;