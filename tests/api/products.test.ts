import {
  apiClient,
  testProducts,
  createProduct,
  setupTestDatabase,
  expectSuccessResponse,
  expectErrorResponse,
} from './helpers/api-client';

describe('Products API', () => {
  setupTestDatabase();

  describe('GET /api/products', () => {
    it('should return empty array when no products exist', async () => {
      const res = await apiClient.get('/api/products').expect(200);
      expectSuccessResponse(res);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('should return all products', async () => {
      await createProduct(testProducts.laptop);
      await createProduct(testProducts.shirt);
      await createProduct(testProducts.book);

      const res = await apiClient.get('/api/products').expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.count).toBe(3);
    });

    it('should filter products by category', async () => {
      await createProduct(testProducts.laptop);
      await createProduct(testProducts.shirt);

      const res = await apiClient
        .get('/api/products?category=electronics')
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].category).toBe('electronics');
    });

    it('should filter products by price range', async () => {
      await createProduct(testProducts.laptop); // 999.99
      await createProduct(testProducts.shirt);  // 29.99
      await createProduct(testProducts.book);   // 19.99

      const res = await apiClient
        .get('/api/products?minPrice=20&maxPrice=100')
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Test Shirt');
    });

    it('should search products by name or description', async () => {
      await createProduct(testProducts.laptop);
      await createProduct(testProducts.book);

      const res = await apiClient
        .get('/api/products?search=laptop')
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toContain('Laptop');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by ID', async () => {
      const product = await createProduct(testProducts.laptop);

      const res = await apiClient
        .get(`/api/products/${product.id}`)
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data.id).toBe(product.id);
      expect(res.body.data.name).toBe(testProducts.laptop.name);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await apiClient
        .get('/api/products/non-existent-id')
        .expect(404);
      
      expectErrorResponse(res, 'Product not found');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = testProducts.newProduct();
      
      const res = await apiClient
        .post('/api/products')
        .send(newProduct)
        .expect(201);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(newProduct.name);
      expect(res.body.data.price).toBe(newProduct.price);
      expect(res.body.message).toBe('Product created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await apiClient
        .post('/api/products')
        .send({ name: 'Test' })
        .expect(400);
      
      expectErrorResponse(res, 'Missing required fields');
    });

    it('should return 400 for negative price', async () => {
      const res = await apiClient
        .post('/api/products')
        .send({ name: 'Test', price: -10 })
        .expect(400);
      
      expectErrorResponse(res, 'Price must be a positive number');
    });

    it('should set default stock to 0', async () => {
      const res = await apiClient
        .post('/api/products')
        .send({ name: 'Test Product', price: 10 })
        .expect(201);
      
      expectSuccessResponse(res);
      expect(res.body.data.stock).toBe(0);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const product = await createProduct(testProducts.laptop);
      const updateData = { name: 'Updated Laptop', price: 1299.99 };

      const res = await apiClient
        .put(`/api/products/${product.id}`)
        .send(updateData)
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data.name).toBe('Updated Laptop');
      expect(res.body.data.price).toBe(1299.99);
      expect(res.body.message).toBe('Product updated successfully');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await apiClient
        .put('/api/products/non-existent-id')
        .send({ name: 'Test' })
        .expect(404);
      
      expectErrorResponse(res, 'Product not found');
    });

    it('should return 400 for invalid price update', async () => {
      const product = await createProduct(testProducts.laptop);

      const res = await apiClient
        .put(`/api/products/${product.id}`)
        .send({ price: -50 })
        .expect(400);
      
      expectErrorResponse(res, 'Price must be a positive number');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const product = await createProduct(testProducts.laptop);

      const res = await apiClient
        .delete(`/api/products/${product.id}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Product deleted successfully');

      // Verify product is deleted
      await apiClient.get(`/api/products/${product.id}`).expect(404);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await apiClient
        .delete('/api/products/non-existent-id')
        .expect(404);
      
      expectErrorResponse(res, 'Product not found');
    });
  });

  describe('PATCH /api/products/:id/stock', () => {
    it('should increase stock', async () => {
      const product = await createProduct(testProducts.laptop);

      const res = await apiClient
        .patch(`/api/products/${product.id}/stock`)
        .send({ quantity: 5 })
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data.stock).toBe(15); // 10 + 5
    });

    it('should decrease stock', async () => {
      const product = await createProduct(testProducts.laptop);

      const res = await apiClient
        .patch(`/api/products/${product.id}/stock`)
        .send({ quantity: -3 })
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data.stock).toBe(7); // 10 - 3
    });

    it('should return 400 for insufficient stock', async () => {
      const product = await createProduct(testProducts.laptop);

      const res = await apiClient
        .patch(`/api/products/${product.id}/stock`)
        .send({ quantity: -20 })
        .expect(400);
      
      expectErrorResponse(res, 'Insufficient stock');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await apiClient
        .patch('/api/products/non-existent-id/stock')
        .send({ quantity: 5 })
        .expect(404);
      
      expectErrorResponse(res, 'Product not found');
    });
  });
});
