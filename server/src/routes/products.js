import express from 'express';
import { store } from '../db/store.js';

const router = express.Router();

// GET /api/categories
router.get('/categories', (req, res) => {
  try {
    const categories = store.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    const products = store.getProducts(category, search);
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = store.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/products (Admin)
router.post('/', (req, res) => {
  try {
    const { name, price, categoryId, description, imageUrl, isCooked, allowsSpiceCustomization, isAvailable } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Name and price are required' });
    }
    const newProduct = store.createProduct({
      name,
      price: Number(price),
      categoryId: categoryId || 'snacks',
      description: description || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      isCooked: Boolean(isCooked),
      allowsSpiceCustomization: Boolean(allowsSpiceCustomization),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true
    });
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/products/:id (Admin edit / stock toggle)
router.patch('/:id', (req, res) => {
  try {
    const updated = store.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/products/:id (Admin delete)
router.delete('/:id', (req, res) => {
  try {
    const success = store.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
