import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = Router();

// Get all users
router.get('/', (req: Request, res: Response) => {
  try {
    const users = db.prepare('SELECT id, email, name, role, created_at FROM users').all();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// Create user
router.post('/', (req: Request, res: Response) => {
  try {
    const { email, name, password, role = 'user' } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields: email, name, password' });
    }

    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, email, name, password, role);

    res.status(201).json({ 
      success: true, 
      data: { id, email, name, role },
      message: 'User created successfully'
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { email, name, role } = req.body;
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const stmt = db.prepare(`
      UPDATE users 
      SET email = COALESCE(?, email), 
          name = COALESCE(?, name), 
          role = COALESCE(?, role),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(email, name, role, req.params.id);

    const updated = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Login endpoint
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    res.json({ 
      success: true, 
      data: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        token: `mock-jwt-token-${user.id}`
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

export default router;
