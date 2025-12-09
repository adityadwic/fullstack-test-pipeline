import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = Router();

interface OrderItem {
  product_id: string;
  quantity: number;
}

// Get all orders (optionally filter by user)
router.get('/', (req: Request, res: Response) => {
  try {
    const { user_id, status } = req.query;
    let sql = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user_id) {
      sql += ' AND o.user_id = ?';
      params.push(user_id);
    }

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';
    const orders = db.prepare(sql).all(...params);
    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Get order by ID with items
router.get('/:id', (req: Request, res: Response) => {
  try {
    const order = db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const items = db.prepare(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(req.params.id);

    res.json({ success: true, data: { ...order, items } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Create order
router.post('/', (req: Request, res: Response) => {
  try {
    const { user_id, items, shipping_address } = req.body;
    
    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: user_id, items (array)' 
      });
    }

    // Verify user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Calculate total and verify products
    let total = 0;
    const orderItems: { product_id: string; quantity: number; price: number }[] = [];

    for (const item of items as OrderItem[]) {
      const product: any = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          error: `Product not found: ${item.product_id}` 
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient stock for product: ${product.name}` 
        });
      }
      total += product.price * item.quantity;
      orderItems.push({ 
        product_id: item.product_id, 
        quantity: item.quantity, 
        price: product.price 
      });
    }

    // Create order in transaction
    const orderId = uuidv4();
    const createOrder = db.transaction(() => {
      // Insert order
      db.prepare(`
        INSERT INTO orders (id, user_id, total, shipping_address, status) 
        VALUES (?, ?, ?, ?, 'pending')
      `).run(orderId, user_id, total, shipping_address || '');

      // Insert order items and update stock
      for (const item of orderItems) {
        const itemId = uuidv4();
        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, price) 
          VALUES (?, ?, ?, ?, ?)
        `).run(itemId, orderId, item.product_id, item.quantity, item.price);

        // Reduce stock
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
          .run(item.quantity, item.product_id);
      }
    });

    createOrder();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.status(201).json({ 
      success: true, 
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Update order status
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

// Cancel order (restore stock)
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot cancel delivered order' 
      });
    }

    // Cancel order and restore stock
    const cancelOrder = db.transaction(() => {
      // Get order items
      const items: any[] = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(req.params.id);

      // Restore stock
      for (const item of items) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
          .run(item.quantity, item.product_id);
      }

      // Delete order items and order
      db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id);
      db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    });

    cancelOrder();
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});

export default router;
