import {
  apiClient,
  testUsers,
  createUser,
  setupTestDatabase,
  expectSuccessResponse,
  expectErrorResponse,
} from './helpers/api-client';

describe('Users API', () => {
  setupTestDatabase();

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const res = await apiClient.get('/api/users').expect(200);
      expectSuccessResponse(res);
      expect(res.body.data).toEqual([]);
    });

    it('should return all users without passwords', async () => {
      await createUser(testUsers.admin);
      await createUser(testUsers.customer);

      const res = await apiClient.get('/api/users').expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).not.toHaveProperty('password');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID', async () => {
      const user = await createUser(testUsers.admin);

      const res = await apiClient.get(`/api/users/${user.id}`).expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.email).toBe(testUsers.admin.email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await apiClient.get('/api/users/non-existent-id').expect(404);
      expectErrorResponse(res, 'User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = testUsers.newUser();
      
      const res = await apiClient
        .post('/api/users')
        .send(newUser)
        .expect(201);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(newUser.email);
      expect(res.body.data.name).toBe(newUser.name);
      expect(res.body.message).toBe('User created successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await apiClient
        .post('/api/users')
        .send({ email: 'test@test.com' })
        .expect(400);
      
      expectErrorResponse(res, 'Missing required fields');
    });

    it('should return 409 for duplicate email', async () => {
      await createUser(testUsers.admin);
      
      const res = await apiClient
        .post('/api/users')
        .send(testUsers.admin)
        .expect(409);
      
      expectErrorResponse(res, 'Email already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const user = await createUser(testUsers.customer);
      const updateData = { name: 'Updated Name' };

      const res = await apiClient
        .put(`/api/users/${user.id}`)
        .send(updateData)
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.email).toBe(testUsers.customer.email);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await apiClient
        .put('/api/users/non-existent-id')
        .send({ name: 'Test' })
        .expect(404);
      
      expectErrorResponse(res, 'User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const user = await createUser(testUsers.customer);

      const res = await apiClient
        .delete(`/api/users/${user.id}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      await apiClient.get(`/api/users/${user.id}`).expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await apiClient
        .delete('/api/users/non-existent-id')
        .expect(404);
      
      expectErrorResponse(res, 'User not found');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      await createUser(testUsers.customer);

      const res = await apiClient
        .post('/api/users/login')
        .send({
          email: testUsers.customer.email,
          password: testUsers.customer.password,
        })
        .expect(200);
      
      expectSuccessResponse(res);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.email).toBe(testUsers.customer.email);
      expect(res.body.message).toBe('Login successful');
    });

    it('should return 401 for invalid password', async () => {
      await createUser(testUsers.customer);

      const res = await apiClient
        .post('/api/users/login')
        .send({
          email: testUsers.customer.email,
          password: 'wrongpassword',
        })
        .expect(401);
      
      expectErrorResponse(res, 'Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await apiClient
        .post('/api/users/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);
      
      expectErrorResponse(res, 'Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      const res = await apiClient
        .post('/api/users/login')
        .send({ email: 'test@test.com' })
        .expect(400);
      
      expectErrorResponse(res, 'Email and password required');
    });
  });
});
