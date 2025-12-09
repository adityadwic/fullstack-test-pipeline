import {
  apiClient,
  testUsers,
  testProducts,
  createUser,
  createProduct,
  createOrder,
  expectSuccessResponse,
  expectErrorResponse,
  clearTestDatabase,
} from './helpers/api-client';

describe('Orders API', () => {
  let testUser: any;
  let testProduct1: any;
  let testProduct2: any;

  beforeEach(async () => {
    // Clear database before each test
    clearTestDatabase();
    
    // Create fresh test data for each test
    testUser = await createUser(testUsers.newUser());
    testProduct1 = await createProduct(testProducts.laptop);
    testProduct2 = await createProduct(testProducts.shirt);
  });

  describe('GET /api/orders', () => {
    it('should return empty array when no orders exist', async () => {
      const res = await apiClient.get('/api/orders').expect(200);
      expectSuccessResponse(res);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('should return all orders', async () => {
      await createOrder(testUser.id, [{ product_id: testProduct1.id, quantity: 1 }]);
      await createOrder(testUser.id, [{ product_id: testProduct2.id, quantity: 2 }]);

      const res = await apiClient.get('/api/orders').expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.count).toBe(2);
    });

    it('should filter orders by user', async () => {
      const user2 = await createUser(testUsers.newUser());
      await createOrder(testUser.id, [{ product_id: testProduct1.id, quantity: 1 }]);
      await createOrder(user2.id, [{ product_id: testProduct2.id, quantity: 1 }]);

      const res = await apiClient
        .get(`/api/orders?user_id=${testUser.id}`)
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveLength(1);
    });

    it('should filter orders by status', async () => {
      const order = await createOrder(testUser.id, [{ product_id: testProduct1.id, quantity: 1 }]);
      
      await apiClient
        .patch(`/api/orders/${order.id}/status`)
        .send({ status: 'shipped' });

      const res = await apiClient
        .get('/api/orders?status=shipped')
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('shipped');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order with items', async () => {
      const order = await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 2 },
        { product_id: testProduct2.id, quantity: 1 },
      ]);

      const res = await apiClient
        .get(`/api/orders/${order.id}`)
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data.id).toBe(order.id);
      expect(res.body.data.items).toHaveLength(2);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await apiClient
        .get('/api/orders/non-existent-id')
        .expect(404);
      
      expectErrorResponse(res, 'Order not found');
    });
  });

  describe('POST /api/orders', () => {
    it('should create order with multiple items', async () => {
      const orderData = {
        user_id: testUser.id,
        items: [
          { product_id: testProduct1.id, quantity: 1 },
          { product_id: testProduct2.id, quantity: 3 },
        ],
        shipping_address: '123 Test Street',
      };

      const res = await apiClient
        .post('/api/orders')
        .send(orderData)
        .expect(201);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.total).toBe(
        testProducts.laptop.price * 1 + testProducts.shirt.price * 3
      );
      expect(res.body.message).toBe('Order created successfully');
    });

    it('should reduce product stock after order', async () => {
      await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 3 },
      ]);

      const res = await apiClient
        .get(`/api/products/${testProduct1.id}`)
        .expect(200);
      
      expect(res.body.data.stock).toBe(7); // 10 - 3
    });

    it('should return 400 for missing required fields', async () => {
      const res = await apiClient
        .post('/api/orders')
        .send({ user_id: testUser.id })
        .expect(400);
      
      expectErrorResponse(res, 'Missing required fields');
    });

    it('should return 400 for empty items array', async () => {
      const res = await apiClient
        .post('/api/orders')
        .send({ user_id: testUser.id, items: [] })
        .expect(400);
      
      expectErrorResponse(res, 'Missing required fields');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await apiClient
        .post('/api/orders')
        .send({
          user_id: 'non-existent-user',
          items: [{ product_id: testProduct1.id, quantity: 1 }],
        })
        .expect(404);
      
      expectErrorResponse(res, 'User not found');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await apiClient
        .post('/api/orders')
        .send({
          user_id: testUser.id,
          items: [{ product_id: 'non-existent-product', quantity: 1 }],
        })
        .expect(404);
      
      expectErrorResponse(res, 'Product not found');
    });

    it('should return 400 for insufficient stock', async () => {
      const res = await apiClient
        .post('/api/orders')
        .send({
          user_id: testUser.id,
          items: [{ product_id: testProduct1.id, quantity: 100 }],
        })
        .expect(400);
      
      expectErrorResponse(res, 'Insufficient stock');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const order = await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 1 },
      ]);

      const res = await apiClient
        .patch(`/api/orders/${order.id}/status`)
        .send({ status: 'processing' })
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data.status).toBe('processing');
    });

    it('should allow status progression', async () => {
      const order = await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 1 },
      ]);

      // Progress through statuses
      const statuses = ['processing', 'shipped', 'delivered'];
      for (const status of statuses) {
        const res = await apiClient
          .patch(`/api/orders/${order.id}/status`)
          .send({ status })
          .expect(200);
        
        expect(res.body.data.status).toBe(status);
      }
    });

    it('should return 400 for invalid status', async () => {
      const order = await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 1 },
      ]);

      const res = await apiClient
        .patch(`/api/orders/${order.id}/status`)
        .send({ status: 'invalid-status' })
        .expect(400);
      
      expectErrorResponse(res, 'Invalid status');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await apiClient
        .patch('/api/orders/non-existent-id/status')
        .send({ status: 'processing' })
        .expect(404);
      
      expectErrorResponse(res, 'Order not found');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should cancel pending order', async () => {
      const order = await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 3 },
      ]);

      const res = await apiClient
        .delete(`/api/orders/${order.id}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Order cancelled successfully');
    });

    it('should restore stock when order is cancelled', async () => {
      const order = await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 5 },
      ]);

      // Stock should be 5 after order
      let productRes = await apiClient.get(`/api/products/${testProduct1.id}`);
      expect(productRes.body.data.stock).toBe(5);

      // Cancel order
      await apiClient.delete(`/api/orders/${order.id}`).expect(200);

      // Stock should be restored to 10
      productRes = await apiClient.get(`/api/products/${testProduct1.id}`);
      expect(productRes.body.data.stock).toBe(10);
    });

    it('should not cancel delivered order', async () => {
      const order = await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 1 },
      ]);

      // Mark as delivered
      await apiClient
        .patch(`/api/orders/${order.id}/status`)
        .send({ status: 'delivered' });

      // Try to cancel
      const res = await apiClient
        .delete(`/api/orders/${order.id}`)
        .expect(400);
      
      expectErrorResponse(res, 'Cannot cancel delivered order');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await apiClient
        .delete('/api/orders/non-existent-id')
        .expect(404);
      
      expectErrorResponse(res, 'Order not found');
    });
  });

  describe('Order Workflow Integration', () => {
    it('should complete full order lifecycle', async () => {
      // Create order
      const order = await createOrder(testUser.id, [
        { product_id: testProduct1.id, quantity: 2 },
        { product_id: testProduct2.id, quantity: 1 },
      ], '456 Integration Test Ave');

      expect(order.status).toBe('pending');

      // Verify stock was reduced
      let product1Res = await apiClient.get(`/api/products/${testProduct1.id}`);
      expect(product1Res.body.data.stock).toBe(8); // 10 - 2

      // Progress through statuses
      await apiClient
        .patch(`/api/orders/${order.id}/status`)
        .send({ status: 'processing' })
        .expect(200);

      await apiClient
        .patch(`/api/orders/${order.id}/status`)
        .send({ status: 'shipped' })
        .expect(200);

      const finalRes = await apiClient
        .patch(`/api/orders/${order.id}/status`)
        .send({ status: 'delivered' })
        .expect(200);

      expect(finalRes.body.data.status).toBe('delivered');
    });
  });
});
