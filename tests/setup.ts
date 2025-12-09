import dotenv from 'dotenv';

// Set test environment
process.env.NODE_ENV = 'test';

// Load environment variables
dotenv.config();

// Increase timeout for API tests
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  console.log('🚀 Starting API Test Suite...');
});

afterAll(() => {
  console.log('✅ API Test Suite Complete');
});

// Extend Jest matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Declare custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}
