import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import notificationsRouter from './routes/notifications.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all during development
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Bhook_Lgi Food Ordering API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Route registration
app.use('/api/products', productsRouter);
app.use('/api/categories', (req, res) => res.redirect('/api/products/categories'));
app.use('/api/orders', ordersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/auth', authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`  🚀 Bhook_Lgi API running on port ${PORT}`);
  console.log(`  🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(`  🍜 Products: http://localhost:${PORT}/api/products`);
  console.log(`  📦 Orders: http://localhost:${PORT}/api/orders`);
  console.log(`===========================================`);
});
