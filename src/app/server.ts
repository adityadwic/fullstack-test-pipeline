import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from './database';
import usersRouter from './routes/users';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Determine static folder path (works from both src and dist)
const staticPath = __dirname.includes('dist') 
  ? path.resolve(__dirname, '../../../src/app/public')  // When running from dist
  : path.join(__dirname, 'public');                      // When running from src

// Serve static files
app.use(express.static(staticPath));

// Request logging middleware (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Test Orchestration System API',
    version: '1.0.0',
    endpoints: {
      users: {
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get user by ID',
        'POST /api/users': 'Create user',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user',
        'POST /api/users/login': 'Login'
      },
      products: {
        'GET /api/products': 'Get all products (filter: category, minPrice, maxPrice, search)',
        'GET /api/products/:id': 'Get product by ID',
        'POST /api/products': 'Create product',
        'PUT /api/products/:id': 'Update product',
        'DELETE /api/products/:id': 'Delete product',
        'PATCH /api/products/:id/stock': 'Update stock'
      },
      orders: {
        'GET /api/orders': 'Get all orders (filter: user_id, status)',
        'GET /api/orders/:id': 'Get order by ID with items',
        'POST /api/orders': 'Create order',
        'PATCH /api/orders/:id/status': 'Update order status',
        'DELETE /api/orders/:id': 'Cancel order'
      },
      health: {
        'GET /api/health': 'Health check'
      }
    }
  });
});

// Serve frontend for all other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Only start the server if not in test mode and running directly
let server: any = null;

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  initDatabase();
  server = app.listen(PORT, () => {
    console.log(`
🚀 Test Orchestration System Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server:  http://${HOST}:${PORT}
📚 API:     http://${HOST}:${PORT}/api
💚 Health:  http://${HOST}:${PORT}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });
}

// Export for testing
export { app, server };
