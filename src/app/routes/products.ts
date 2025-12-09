import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = Router();

// Get all products
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (minPrice) {
      sql += ' AND price >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += ' AND price <= ?';
      params.push(Number(maxPrice));
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';
    const products = db.prepare(sql).all(...params);
    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, price, stock = 0, category, image_url } = req.body;
    
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: name, price' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number' });
    }

    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO products (id, name, description, price, stock, category, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, description, price, stock, category, image_url);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json({ 
      success: true, 
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number' });
    }

    const stmt = db.prepare(`
      UPDATE products 
      SET name = COALESCE(?, name), 
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          stock = COALESCE(?, stock),
          category = COALESCE(?, category),
          image_url = COALESCE(?, image_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(name, description, price, stock, category, image_url, req.params.id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

// Update stock
router.patch('/:id/stock', (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    const existing: any = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const newStock = existing.stock + quantity;
    if (newStock < 0) {
      return res.status(400).json({ success: false, error: 'Insufficient stock' });
    }

    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStock, req.params.id);

    res.json({ success: true, data: { id: req.params.id, stock: newStock }, message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update stock' });
  }
});

export default router;
