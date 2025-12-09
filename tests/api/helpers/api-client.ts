import request from 'supertest';
import { app } from '../../../src/app/server';
import { initDatabase, clearDatabase } from '../../../src/app/database';

/**
 * API Test Client Helper
 * Provides reusable methods for API testing
 */

// Initialize database once for all API tests
initDatabase();

// Export the API client
export const apiClient = request(app);

// Export clear database function for tests that need it
export const clearTestDatabase = clearDatabase;

// Test data factories
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    name: 'Admin User',
    password: 'admin123',
    role: 'admin'
  },
  customer: {
    email: 'customer@test.com',
    name: 'Test Customer',
    password: 'customer123',
    role: 'user'
  },
  newUser: () => ({
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    name: 'New User',
    password: 'password123',
    role: 'user'
  })
};

export const testProducts = {
  laptop: {
    name: 'Test Laptop',
    description: 'A test laptop for automation',
    price: 999.99,
    stock: 10,
    category: 'electronics'
  },
  shirt: {
    name: 'Test Shirt',
    description: 'A test shirt',
    price: 29.99,
    stock: 50,
    category: 'clothing'
  },
  book: {
    name: 'Test Book',
    description: 'A test book',
    price: 19.99,
    stock: 100,
    category: 'books'
  },
  newProduct: () => ({
    name: `Product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: 'Dynamically created product',
    price: Math.floor(Math.random() * 100) + 10,
    stock: Math.floor(Math.random() * 50) + 5,
    category: 'electronics'
  })
};

// API helper functions
export async function createUser(userData: { email: string; name: string; password: string; role?: string }) {
  const res = await apiClient
    .post('/api/users')
    .send(userData)
    .expect(201);
  return res.body.data;
}

export async function createProduct(productData: typeof testProducts.laptop) {
  const res = await apiClient
    .post('/api/products')
    .send(productData)
    .expect(201);
  return res.body.data;
}

export async function loginUser(email: string, password: string) {
  const res = await apiClient
    .post('/api/users/login')
    .send({ email, password })
    .expect(200);
  return res.body.data;
}

export async function createOrder(userId: string, items: { product_id: string; quantity: number }[], shippingAddress?: string) {
  const res = await apiClient
    .post('/api/orders')
    .send({
      user_id: userId,
      items,
      shipping_address: shippingAddress || '123 Test St'
    })
    .expect(201);
  return res.body.data;
}

// Setup and teardown helpers - clears database before each test
export function setupTestDatabase() {
  beforeEach(() => {
    clearDatabase();
  });
}

// Response validators
export function expectSuccessResponse(res: request.Response) {
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('data');
}

export function expectErrorResponse(res: request.Response, message?: string) {
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('error');
  if (message) {
    expect(res.body.error).toContain(message);
  }
}
